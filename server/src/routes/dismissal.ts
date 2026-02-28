import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import pool from '../db';

const router = Router();

// Create or get today's session (using school's timezone)
router.post('/schools/:schoolId/sessions', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schoolId = req.params.schoolId;

    // Get school's timezone to determine "today" in local time
    const schoolResult = await pool.query('SELECT timezone FROM schools WHERE id = $1', [schoolId]);
    const timezone = schoolResult.rows[0]?.timezone || 'America/New_York';

    // Get today's date in the school's timezone
    const localDateResult = await pool.query(
      "SELECT (NOW() AT TIME ZONE $1)::date as local_date",
      [timezone]
    );
    const localDate = localDateResult.rows[0].local_date;

    // Try to get existing session for today (school's local date)
    let result = await pool.query(
      "SELECT * FROM dismissal_sessions WHERE school_id = $1 AND date = $2",
      [schoolId, localDate]
    );

    if (result.rows.length > 0) {
      return res.json(result.rows[0]);
    }

    // Create new session (ON CONFLICT handles race conditions)
    result = await pool.query(
      `INSERT INTO dismissal_sessions (school_id, date, status)
       VALUES ($1, $2, 'pending')
       ON CONFLICT (school_id, date) DO UPDATE SET school_id = EXCLUDED.school_id
       RETURNING *`,
      [schoolId, localDate]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// Get session
router.get('/sessions/:id', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query('SELECT * FROM dismissal_sessions WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Session not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// Update session status (start/pause/complete)
router.put('/sessions/:id', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    const updates: string[] = ["status = $1"];
    const params: any[] = [status];

    if (status === 'active') { updates.push("started_at = COALESCE(started_at, NOW())"); }
    if (status === 'completed') { updates.push("ended_at = NOW()"); }

    const result = await pool.query(
      `UPDATE dismissal_sessions SET ${updates.join(', ')} WHERE id = $${params.length + 1} RETURNING *`,
      [...params, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// Get queue
router.get('/sessions/:id/queue', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status: filterStatus } = req.query;
    let query = `
      SELECT dq.*, s.first_name, s.last_name, s.grade, s.dismissal_type,
             s.bus_route, s.photo_url, h.name AS homeroom_name
      FROM dismissal_queue dq
      JOIN students s ON s.id = dq.student_id
      LEFT JOIN homerooms h ON h.id = s.homeroom_id
      WHERE dq.session_id = $1
    `;
    const params: any[] = [req.params.id];

    if (filterStatus) {
      query += ' AND dq.status = $2';
      params.push(filterStatus);
    }

    query += ' ORDER BY dq.position, dq.check_in_time';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// Parent check-in
router.post('/sessions/:id/check-in', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { checkInMethod } = req.body;
    const sessionId = req.params.id;

    // Get this parent's car-rider children
    const childrenResult = await pool.query(
      `SELECT s.id, s.first_name, s.last_name FROM students s
       JOIN parent_student ps ON ps.student_id = s.id
       WHERE ps.parent_id = $1 AND ps.status = 'approved'
         AND s.dismissal_type = 'car' AND s.status = 'active'`,
      [req.user.userId]
    );

    if (childrenResult.rows.length === 0) {
      return res.status(400).json({ error: 'No car-rider children found' });
    }

    // Get current max position
    const posResult = await pool.query(
      'SELECT COALESCE(MAX(position), 0) AS max_pos FROM dismissal_queue WHERE session_id = $1',
      [sessionId]
    );
    let position = posResult.rows[0].max_pos;

    // Get user's name
    const userResult = await pool.query('SELECT first_name, last_name FROM users WHERE id = $1', [req.user.userId]);
    const guardianName = `${userResult.rows[0].first_name} ${userResult.rows[0].last_name}`;

    const entries = [];
    for (const child of childrenResult.rows) {
      // Check if already in queue
      const existing = await pool.query(
        'SELECT id FROM dismissal_queue WHERE session_id = $1 AND student_id = $2',
        [sessionId, child.id]
      );
      if (existing.rows.length > 0) continue;

      position++;
      const result = await pool.query(
        `INSERT INTO dismissal_queue (session_id, student_id, guardian_id, guardian_name, check_in_method, position, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'waiting') RETURNING *`,
        [sessionId, child.id, req.user.userId, guardianName, checkInMethod || 'app', position]
      );
      entries.push({ ...result.rows[0], first_name: child.first_name, last_name: child.last_name });
    }

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      const session = await pool.query('SELECT school_id FROM dismissal_sessions WHERE id = $1', [sessionId]);
      const schoolId = session.rows[0]?.school_id;
      if (schoolId) {
        io.to(`school:${schoolId}:office`).emit('queue:updated', { action: 'check_in', entries });
      }
    }

    res.status(201).json({ entries, position });
  } catch (err) {
    next(err);
  }
});

// Check-in by car number (office enters car number)
router.post('/sessions/:id/check-in-by-number', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { carNumber } = req.body;
    const sessionId = req.params.id;

    if (!carNumber) return res.status(400).json({ error: 'Car number required' });

    // Get session's school and dismissal mode
    const sessionResult = await pool.query(
      'SELECT ds.school_id, sc.dismissal_mode FROM dismissal_sessions ds JOIN schools sc ON sc.id = ds.school_id WHERE ds.id = $1',
      [sessionId]
    );
    if (sessionResult.rows.length === 0) return res.status(404).json({ error: 'Session not found' });
    const schoolId = sessionResult.rows[0].school_id;
    const dismissalMode = sessionResult.rows[0].dismissal_mode;

    let guardianId: number | null = null;
    let guardianName: string | null = null;
    let children: any[] = [];
    let parentInfo: any = null;

    if (dismissalMode === 'no_app') {
      // Look up family_groups table
      const groupResult = await pool.query(
        'SELECT fg.id, fg.family_name, fg.car_number FROM family_groups fg WHERE fg.school_id = $1 AND fg.car_number = $2',
        [schoolId, carNumber.toString().trim()]
      );
      if (groupResult.rows.length === 0) {
        return res.status(404).json({ error: 'No family group found with that car number' });
      }
      const group = groupResult.rows[0];
      guardianName = group.family_name || `Family #${group.car_number}`;

      const childrenResult = await pool.query(
        `SELECT s.id, s.first_name, s.last_name FROM students s
         JOIN family_group_students fgs ON fgs.student_id = s.id
         WHERE fgs.family_group_id = $1 AND s.dismissal_type = 'car' AND s.status = 'active'`,
        [group.id]
      );
      children = childrenResult.rows;
    } else {
      // App mode: look up school_memberships
      const memberResult = await pool.query(
        "SELECT sm.user_id, u.first_name, u.last_name FROM school_memberships sm JOIN users u ON u.id = sm.user_id WHERE sm.school_id = $1 AND sm.car_number = $2 AND sm.role = 'parent'",
        [schoolId, carNumber.toString().trim()]
      );
      if (memberResult.rows.length === 0) {
        return res.status(404).json({ error: 'No parent found with that car number' });
      }
      const parent = memberResult.rows[0];
      guardianId = parent.user_id;
      guardianName = `${parent.first_name} ${parent.last_name}`;
      parentInfo = { firstName: parent.first_name, lastName: parent.last_name };

      const childrenResult = await pool.query(
        `SELECT s.id, s.first_name, s.last_name FROM students s
         JOIN parent_student ps ON ps.student_id = s.id
         WHERE ps.parent_id = $1 AND ps.status = 'approved'
           AND s.dismissal_type = 'car' AND s.status = 'active' AND s.school_id = $2`,
        [parent.user_id, schoolId]
      );
      children = childrenResult.rows;
    }

    if (children.length === 0) {
      return res.status(400).json({ error: 'No car-rider students found for this number' });
    }

    // Get current max position
    const posResult = await pool.query(
      'SELECT COALESCE(MAX(position), 0) AS max_pos FROM dismissal_queue WHERE session_id = $1',
      [sessionId]
    );
    let position = posResult.rows[0].max_pos;

    const entries = [];
    for (const child of children) {
      const existing = await pool.query(
        'SELECT id FROM dismissal_queue WHERE session_id = $1 AND student_id = $2',
        [sessionId, child.id]
      );
      if (existing.rows.length > 0) continue;

      position++;
      const result = await pool.query(
        `INSERT INTO dismissal_queue (session_id, student_id, guardian_id, guardian_name, check_in_method, position, status)
         VALUES ($1, $2, $3, $4, 'car_number', $5, 'waiting') RETURNING *`,
        [sessionId, child.id, guardianId, guardianName, position]
      );
      entries.push({ ...result.rows[0], first_name: child.first_name, last_name: child.last_name });
    }

    if (entries.length === 0) {
      return res.status(200).json({ entries: [], alreadySubmitted: true, message: 'Car ID already submitted', carNumber: carNumber.toString().trim() });
    }

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`school:${schoolId}:office`).emit('queue:updated', { action: 'check_in', entries });
      // Emit to teacher rooms so teachers see students immediately
      for (const entry of entries) {
        const studentResult2 = await pool.query('SELECT homeroom_id FROM students WHERE id = $1', [entry.student_id]);
        const homeroomId = studentResult2.rows[0]?.homeroom_id;
        if (homeroomId) {
          console.log(`[Car Check-in] Emitting student:checked-in to room: school:${schoolId}:teacher:${homeroomId}, student_id=${entry.student_id}`);
          io.to(`school:${schoolId}:teacher:${homeroomId}`).emit('student:checked-in', entry);
        } else {
          console.log(`[Car Check-in] Student ${entry.student_id} has no homeroom_id, skipping teacher emit`);
        }
      }
    }

    const response: any = { entries, position, carNumber: carNumber.toString().trim() };
    if (parentInfo) {
      response.parent = parentInfo;
    }

    // Log for debugging teacher socket updates
    console.log(`[Car Check-in] Emitted student:checked-in for ${entries.length} entries to teacher rooms`);

    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
});

// Check-in by bus number (office enters bus number)
router.post('/sessions/:id/check-in-by-bus', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { busNumber } = req.body;
    const sessionId = req.params.id;

    if (!busNumber) return res.status(400).json({ error: 'Bus number required' });

    // Get session's school
    const sessionResult = await pool.query(
      'SELECT school_id FROM dismissal_sessions WHERE id = $1',
      [sessionId]
    );
    if (sessionResult.rows.length === 0) return res.status(404).json({ error: 'Session not found' });
    const schoolId = sessionResult.rows[0].school_id;

    // Find all bus students with this route
    const childrenResult = await pool.query(
      `SELECT id, first_name, last_name FROM students
       WHERE school_id = $1 AND dismissal_type = 'bus' AND bus_route = $2 AND status = 'active'`,
      [schoolId, busNumber.toString().trim()]
    );

    if (childrenResult.rows.length === 0) {
      return res.status(404).json({ error: 'No students found for that bus number' });
    }

    const children = childrenResult.rows;
    const guardianName = `Bus #${busNumber.toString().trim()}`;

    // Get current max position
    const posResult = await pool.query(
      'SELECT COALESCE(MAX(position), 0) AS max_pos FROM dismissal_queue WHERE session_id = $1',
      [sessionId]
    );
    let position = posResult.rows[0].max_pos;

    const entries = [];
    for (const child of children) {
      const existing = await pool.query(
        'SELECT id FROM dismissal_queue WHERE session_id = $1 AND student_id = $2',
        [sessionId, child.id]
      );
      if (existing.rows.length > 0) continue;

      position++;
      const result = await pool.query(
        `INSERT INTO dismissal_queue (session_id, student_id, guardian_id, guardian_name, check_in_method, position, status)
         VALUES ($1, $2, NULL, $3, 'bus_number', $4, 'waiting') RETURNING *`,
        [sessionId, child.id, guardianName, position]
      );
      entries.push({ ...result.rows[0], first_name: child.first_name, last_name: child.last_name });
    }

    if (entries.length === 0) {
      return res.status(200).json({ entries: [], alreadySubmitted: true, message: 'Bus # already submitted', busNumber: busNumber.toString().trim() });
    }

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`school:${schoolId}:office`).emit('queue:updated', { action: 'check_in', entries });
      // Emit to teacher rooms so teachers see students immediately
      for (const entry of entries) {
        const studentResult2 = await pool.query('SELECT homeroom_id FROM students WHERE id = $1', [entry.student_id]);
        const homeroomId = studentResult2.rows[0]?.homeroom_id;
        if (homeroomId) {
          io.to(`school:${schoolId}:teacher:${homeroomId}`).emit('student:checked-in', entry);
        }
      }
    }

    res.status(201).json({ entries, position, busNumber: busNumber.toString().trim() });
  } catch (err) {
    next(err);
  }
});

// Call student (assign to zone)
router.post('/sessions/:id/call', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { queueId, zone } = req.body;
    const result = await pool.query(
      `UPDATE dismissal_queue SET status = 'called', zone = $1, called_at = NOW()
       WHERE id = $2 RETURNING *`,
      [zone || null, queueId]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Queue entry not found' });

    const entry = result.rows[0];

    // Get student details for socket event
    const studentResult = await pool.query(
      'SELECT s.*, h.name AS homeroom_name FROM students s LEFT JOIN homerooms h ON h.id = s.homeroom_id WHERE s.id = $1',
      [entry.student_id]
    );
    const student = studentResult.rows[0];

    // Emit socket events
    const io = req.app.get('io');
    if (io) {
      const session = await pool.query('SELECT school_id FROM dismissal_sessions WHERE id = $1', [req.params.id]);
      const schoolId = session.rows[0]?.school_id;
      if (schoolId) {
        const eventData = { ...entry, ...student };
        io.to(`school:${schoolId}:office`).emit('queue:updated', { action: 'called', entry: eventData });
        if (student.homeroom_id) {
          io.to(`school:${schoolId}:teacher:${student.homeroom_id}`).emit('student:called', eventData);
        }
        if (entry.guardian_id) {
          io.to(`school:${schoolId}:parent:${entry.guardian_id}`).emit('student:called', eventData);
        }
      }
    }

    res.json(entry);
  } catch (err) {
    next(err);
  }
});

// Call next batch
router.post('/sessions/:id/call-batch', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { count, zone } = req.body;
    const batchSize = count || 5;

    const result = await pool.query(
      `UPDATE dismissal_queue SET status = 'called', zone = $1, called_at = NOW()
       WHERE id IN (
         SELECT id FROM dismissal_queue
         WHERE session_id = $2 AND status = 'waiting'
         ORDER BY position LIMIT $3
       ) RETURNING *`,
      [zone || null, req.params.id, batchSize]
    );

    // Emit socket events for each called student
    const io = req.app.get('io');
    if (io && result.rows.length > 0) {
      const session = await pool.query('SELECT school_id FROM dismissal_sessions WHERE id = $1', [req.params.id]);
      const schoolId = session.rows[0]?.school_id;
      if (schoolId) {
        io.to(`school:${schoolId}:office`).emit('queue:updated', { action: 'batch_called', entries: result.rows });
        for (const entry of result.rows) {
          const studentResult = await pool.query(
            'SELECT homeroom_id FROM students WHERE id = $1', [entry.student_id]
          );
          const homeroomId = studentResult.rows[0]?.homeroom_id;
          if (homeroomId) {
            io.to(`school:${schoolId}:teacher:${homeroomId}`).emit('student:called', entry);
          }
          if (entry.guardian_id) {
            io.to(`school:${schoolId}:parent:${entry.guardian_id}`).emit('student:called', entry);
          }
        }
      }
    }

    res.json({ called: result.rows.length, entries: result.rows });
  } catch (err) {
    next(err);
  }
});

// Release student (teacher signals student is walking to pickup zone)
router.post('/queue/:id/release', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query(
      `UPDATE dismissal_queue SET status = 'released', released_at = NOW()
       WHERE id = $1 AND status IN ('called', 'waiting') RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Queue entry not found or not in valid status' });

    const entry = result.rows[0];
    const io = req.app.get('io');
    if (io) {
      const session = await pool.query('SELECT school_id FROM dismissal_sessions WHERE id = $1', [entry.session_id]);
      const schoolId = session.rows[0]?.school_id;
      if (schoolId) {
        io.to(`school:${schoolId}:office`).emit('queue:updated', { action: 'released', entry });
        io.to(`school:${schoolId}:office`).emit('student:released', entry);
        const studentResult = await pool.query('SELECT homeroom_id FROM students WHERE id = $1', [entry.student_id]);
        const homeroomId = studentResult.rows[0]?.homeroom_id;
        if (homeroomId) {
          io.to(`school:${schoolId}:teacher:${homeroomId}`).emit('student:released', entry);
        }
        if (entry.guardian_id) {
          io.to(`school:${schoolId}:parent:${entry.guardian_id}`).emit('student:released', entry);
        }
      }
    }

    res.json(entry);
  } catch (err) {
    next(err);
  }
});

// Dismiss student (office or parent can call this)
router.post('/queue/:id/dismiss', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // If caller is a parent, verify they own this queue entry
    const queueCheck = await pool.query('SELECT guardian_id FROM dismissal_queue WHERE id = $1', [req.params.id]);
    if (queueCheck.rows.length === 0) return res.status(404).json({ error: 'Queue entry not found' });

    // Check if user is a parent (not admin/office) — verify guardian ownership
    if (!req.user.isSuperAdmin) {
      const entry = queueCheck.rows[0];
      if (entry.guardian_id && entry.guardian_id === req.user.userId) {
        // Parent owns this entry — allow
      } else {
        // Check if user has admin/office role for this school
        const session = await pool.query(
          `SELECT ds.school_id FROM dismissal_queue dq JOIN dismissal_sessions ds ON ds.id = dq.session_id WHERE dq.id = $1`,
          [req.params.id]
        );
        const schoolId = session.rows[0]?.school_id;
        if (schoolId) {
          const roleCheck = await pool.query(
            `SELECT role FROM school_memberships WHERE user_id = $1 AND school_id = $2 AND role IN ('admin', 'office_staff') AND status = 'active'`,
            [req.user.userId, schoolId]
          );
          if (roleCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Not authorized to dismiss this student' });
          }
        }
      }
    }

    const result = await pool.query(
      `UPDATE dismissal_queue SET status = 'dismissed', dismissed_at = NOW()
       WHERE id = $1 AND status IN ('waiting', 'called', 'released', 'delayed', 'held') RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Queue entry not found' });

    const entry = result.rows[0];
    const io = req.app.get('io');
    if (io) {
      const session = await pool.query('SELECT school_id FROM dismissal_sessions WHERE id = $1', [entry.session_id]);
      const schoolId = session.rows[0]?.school_id;
      if (schoolId) {
        io.to(`school:${schoolId}:office`).emit('queue:updated', { action: 'dismissed', entry });
        const studentResult = await pool.query('SELECT homeroom_id FROM students WHERE id = $1', [entry.student_id]);
        const homeroomId = studentResult.rows[0]?.homeroom_id;
        if (homeroomId) {
          io.to(`school:${schoolId}:teacher:${homeroomId}`).emit('student:dismissed', entry);
        }
        if (entry.guardian_id) {
          io.to(`school:${schoolId}:parent:${entry.guardian_id}`).emit('student:dismissed', entry);
        }
      }
    }

    res.json(entry);
  } catch (err) {
    next(err);
  }
});

// Batch dismiss students
router.post('/queue/dismiss-batch', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { queueIds } = req.body;
    if (!queueIds || !Array.isArray(queueIds) || queueIds.length === 0) {
      return res.status(400).json({ error: 'queueIds array required' });
    }

    const result = await pool.query(
      `UPDATE dismissal_queue SET status = 'dismissed', dismissed_at = NOW()
       WHERE id = ANY($1) AND status IN ('waiting', 'called', 'released', 'delayed', 'held') RETURNING *`,
      [queueIds]
    );

    // Emit socket events for each dismissed student
    const io = req.app.get('io');
    if (io && result.rows.length > 0) {
      const entry0 = result.rows[0];
      const session = await pool.query('SELECT school_id FROM dismissal_sessions WHERE id = $1', [entry0.session_id]);
      const schoolId = session.rows[0]?.school_id;
      if (schoolId) {
        io.to(`school:${schoolId}:office`).emit('queue:updated', { action: 'batch_dismissed', entries: result.rows });
        for (const entry of result.rows) {
          const studentResult = await pool.query('SELECT homeroom_id FROM students WHERE id = $1', [entry.student_id]);
          const homeroomId = studentResult.rows[0]?.homeroom_id;
          if (homeroomId) {
            io.to(`school:${schoolId}:teacher:${homeroomId}`).emit('student:dismissed', entry);
          }
          if (entry.guardian_id) {
            io.to(`school:${schoolId}:parent:${entry.guardian_id}`).emit('student:dismissed', entry);
          }
        }
      }
    }

    res.json({ dismissed: result.rows.length, entries: result.rows });
  } catch (err) {
    next(err);
  }
});

// Batch release students (teacher dismisses multiple from class)
router.post('/queue/release-batch', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { queueIds } = req.body;
    if (!queueIds || !Array.isArray(queueIds) || queueIds.length === 0) {
      return res.status(400).json({ error: 'queueIds array required' });
    }

    const result = await pool.query(
      `UPDATE dismissal_queue SET status = 'released', released_at = NOW()
       WHERE id = ANY($1) AND status IN ('waiting', 'called') RETURNING *`,
      [queueIds]
    );

    const io = req.app.get('io');
    if (io && result.rows.length > 0) {
      const entry0 = result.rows[0];
      const session = await pool.query('SELECT school_id FROM dismissal_sessions WHERE id = $1', [entry0.session_id]);
      const schoolId = session.rows[0]?.school_id;
      if (schoolId) {
        io.to(`school:${schoolId}:office`).emit('queue:updated', { action: 'batch_released', entries: result.rows });
        for (const entry of result.rows) {
          const studentResult = await pool.query('SELECT homeroom_id FROM students WHERE id = $1', [entry.student_id]);
          const homeroomId = studentResult.rows[0]?.homeroom_id;
          if (homeroomId) {
            io.to(`school:${schoolId}:teacher:${homeroomId}`).emit('student:released', entry);
          }
          if (entry.guardian_id) {
            io.to(`school:${schoolId}:parent:${entry.guardian_id}`).emit('student:released', entry);
          }
        }
      }
    }

    res.json({ released: result.rows.length, entries: result.rows });
  } catch (err) {
    next(err);
  }
});

// Release all walkers (office clicks single button)
router.post('/sessions/:id/release-walkers', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const sessionId = req.params.id;

    const sessionResult = await pool.query(
      'SELECT school_id FROM dismissal_sessions WHERE id = $1',
      [sessionId]
    );
    if (sessionResult.rows.length === 0) return res.status(404).json({ error: 'Session not found' });
    const schoolId = sessionResult.rows[0].school_id;

    // Find all walker students in the school
    const childrenResult = await pool.query(
      `SELECT id, first_name, last_name FROM students
       WHERE school_id = $1 AND dismissal_type = 'walker' AND status = 'active'`,
      [schoolId]
    );

    if (childrenResult.rows.length === 0) {
      return res.status(200).json({ entries: [], message: 'No walker students found' });
    }

    const posResult = await pool.query(
      'SELECT COALESCE(MAX(position), 0) AS max_pos FROM dismissal_queue WHERE session_id = $1',
      [sessionId]
    );
    let position = posResult.rows[0].max_pos;

    const entries = [];
    for (const child of childrenResult.rows) {
      const existing = await pool.query(
        'SELECT id FROM dismissal_queue WHERE session_id = $1 AND student_id = $2',
        [sessionId, child.id]
      );
      if (existing.rows.length > 0) continue;

      position++;
      const result = await pool.query(
        `INSERT INTO dismissal_queue (session_id, student_id, guardian_id, guardian_name, check_in_method, position, status, dismissed_at)
         VALUES ($1, $2, NULL, 'Walkers', 'walker', $3, 'dismissed', NOW()) RETURNING *`,
        [sessionId, child.id, position]
      );
      entries.push({ ...result.rows[0], first_name: child.first_name, last_name: child.last_name });
    }

    if (entries.length === 0) {
      return res.status(200).json({ entries: [], alreadySubmitted: true, message: 'Walkers already released' });
    }

    const io = req.app.get('io');
    if (io) {
      io.to(`school:${schoolId}:office`).emit('queue:updated', { action: 'dismissed', entries });
      for (const entry of entries) {
        const studentResult = await pool.query('SELECT homeroom_id FROM students WHERE id = $1', [entry.student_id]);
        const homeroomId = studentResult.rows[0]?.homeroom_id;
        if (homeroomId) {
          io.to(`school:${schoolId}:teacher:${homeroomId}`).emit('student:dismissed', entry);
        }
      }
    }

    res.status(201).json({ entries, position });
  } catch (err) {
    next(err);
  }
});

// Release walkers by grade or homeroom filter
router.post('/sessions/:id/release-walkers-by-filter', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const sessionId = req.params.id;
    const { filterType, filterValues } = req.body; // filterType: 'grade' | 'homeroom', filterValues: string[] | number[]

    if (!filterType || !filterValues || !Array.isArray(filterValues) || filterValues.length === 0) {
      return res.status(400).json({ error: 'filterType and filterValues are required' });
    }

    const sessionResult = await pool.query(
      'SELECT school_id FROM dismissal_sessions WHERE id = $1',
      [sessionId]
    );
    if (sessionResult.rows.length === 0) return res.status(404).json({ error: 'Session not found' });
    const schoolId = sessionResult.rows[0].school_id;

    // Find walker students matching the filter
    let childrenQuery: string;
    let childrenParams: any[];

    if (filterType === 'grade') {
      childrenQuery = `
        SELECT s.id, s.first_name, s.last_name, s.grade, s.homeroom_id
        FROM students s
        WHERE s.school_id = $1 AND s.dismissal_type = 'walker' AND s.status = 'active'
          AND s.grade = ANY($2)
      `;
      childrenParams = [schoolId, filterValues];
    } else if (filterType === 'homeroom') {
      childrenQuery = `
        SELECT s.id, s.first_name, s.last_name, s.grade, s.homeroom_id
        FROM students s
        WHERE s.school_id = $1 AND s.dismissal_type = 'walker' AND s.status = 'active'
          AND s.homeroom_id = ANY($2)
      `;
      childrenParams = [schoolId, filterValues.map(Number)];
    } else {
      return res.status(400).json({ error: 'Invalid filterType. Must be "grade" or "homeroom"' });
    }

    const childrenResult = await pool.query(childrenQuery, childrenParams);

    if (childrenResult.rows.length === 0) {
      return res.status(200).json({ entries: [], message: 'No walker students found for selected filter' });
    }

    const posResult = await pool.query(
      'SELECT COALESCE(MAX(position), 0) AS max_pos FROM dismissal_queue WHERE session_id = $1',
      [sessionId]
    );
    let position = posResult.rows[0].max_pos;

    const entries = [];
    for (const child of childrenResult.rows) {
      const existing = await pool.query(
        'SELECT id FROM dismissal_queue WHERE session_id = $1 AND student_id = $2',
        [sessionId, child.id]
      );
      if (existing.rows.length > 0) continue;

      position++;
      const guardianName = filterType === 'grade' ? `Walkers - Grade ${child.grade}` : 'Walkers';
      const result = await pool.query(
        `INSERT INTO dismissal_queue (session_id, student_id, guardian_id, guardian_name, check_in_method, position, status, dismissed_at)
         VALUES ($1, $2, NULL, $3, 'walker', $4, 'dismissed', NOW()) RETURNING *`,
        [sessionId, child.id, guardianName, position]
      );
      entries.push({ ...result.rows[0], first_name: child.first_name, last_name: child.last_name });
    }

    if (entries.length === 0) {
      return res.status(200).json({ entries: [], alreadySubmitted: true, message: 'Selected walkers already released' });
    }

    const io = req.app.get('io');
    if (io) {
      io.to(`school:${schoolId}:office`).emit('queue:updated', { action: 'dismissed', entries });
      for (const entry of entries) {
        const studentResult = await pool.query('SELECT homeroom_id FROM students WHERE id = $1', [entry.student_id]);
        const homeroomId = studentResult.rows[0]?.homeroom_id;
        if (homeroomId) {
          io.to(`school:${schoolId}:teacher:${homeroomId}`).emit('student:dismissed', entry);
        }
      }
    }

    res.status(201).json({ entries, position });
  } catch (err) {
    next(err);
  }
});

// Hold student
router.post('/queue/:id/hold', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { reason } = req.body;
    const result = await pool.query(
      `UPDATE dismissal_queue SET status = 'held', hold_reason = $1
       WHERE id = $2 RETURNING *`,
      [reason || 'No reason specified', req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Queue entry not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// Delay student (2 more minutes)
router.post('/queue/:id/delay', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query(
      `UPDATE dismissal_queue SET status = 'delayed', delayed_until = NOW() + INTERVAL '2 minutes'
       WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Queue entry not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// Session stats
router.get('/sessions/:id/stats', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query(
      `SELECT
        COUNT(*) FILTER (WHERE status = 'waiting')::int AS waiting,
        COUNT(*) FILTER (WHERE status = 'called')::int AS called,
        COUNT(*) FILTER (WHERE status = 'released')::int AS released,
        COUNT(*) FILTER (WHERE status = 'dismissed')::int AS dismissed,
        COUNT(*) FILTER (WHERE status = 'held')::int AS held,
        COUNT(*) FILTER (WHERE status = 'delayed')::int AS delayed,
        COUNT(*)::int AS total,
        AVG(EXTRACT(EPOCH FROM (dismissed_at - check_in_time))) FILTER (WHERE dismissed_at IS NOT NULL) AS avg_wait_seconds
       FROM dismissal_queue WHERE session_id = $1`,
      [req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// Activity log
router.get('/sessions/:id/activity', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query(
      `SELECT al.*, u.first_name AS actor_first_name, u.last_name AS actor_last_name
       FROM activity_log al
       LEFT JOIN users u ON u.id = al.actor_id
       WHERE al.session_id = $1
       ORDER BY al.created_at DESC
       LIMIT 50`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

export default router;
