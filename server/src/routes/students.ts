import { Router, Response, NextFunction } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import { parse } from 'csv-parse';
import { Readable } from 'stream';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';
import pool from '../db';
import { generateStudentCode, generateFamilyGroupNumber } from '../utils/studentCode';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// List students for a school
router.get('/schools/:schoolId/students', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { grade, homeroomId, dismissalType, search } = req.query;
    let query = `
      SELECT s.*, h.name AS homeroom_name, h.grade AS homeroom_grade, fg.car_number
      FROM students s
      LEFT JOIN homerooms h ON h.id = s.homeroom_id
      LEFT JOIN family_group_students fgs ON fgs.student_id = s.id
      LEFT JOIN family_groups fg ON fg.id = fgs.family_group_id
      WHERE s.school_id = $1 AND s.status = 'active'
    `;
    const params: any[] = [req.params.schoolId];
    let paramIdx = 2;

    if (grade) { query += ` AND s.grade = $${paramIdx++}`; params.push(grade); }
    if (homeroomId) { query += ` AND s.homeroom_id = $${paramIdx++}`; params.push(homeroomId); }
    if (dismissalType) { query += ` AND s.dismissal_type = $${paramIdx++}`; params.push(dismissalType); }
    if (search) {
      query += ` AND (s.first_name ILIKE $${paramIdx} OR s.last_name ILIKE $${paramIdx})`;
      params.push(`%${search}%`);
      paramIdx++;
    }

    query += ' ORDER BY s.last_name, s.first_name';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// Create student
router.post('/schools/:schoolId/students', requireAuth, requireRole('admin', 'office_staff'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { firstName, lastName, grade, email, dismissalType, busRoute, homeroomId, externalId } = req.body;
    if (!firstName || !lastName) return res.status(400).json({ error: 'First and last name required' });

    const studentCode = await generateStudentCode(Number(req.params.schoolId));
    const result = await pool.query(
      `INSERT INTO students (school_id, homeroom_id, external_id, first_name, last_name, grade, email, dismissal_type, bus_route, student_code)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [req.params.schoolId, homeroomId || null, externalId || null,
       firstName, lastName, grade || null, email || null,
       dismissalType || 'car', busRoute || null, studentCode]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// Update student
router.put('/students/:id', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { firstName, lastName, grade, email, dismissalType, busRoute, homeroomId, status } = req.body;
    const result = await pool.query(
      `UPDATE students SET
        first_name = COALESCE($1, first_name), last_name = COALESCE($2, last_name),
        grade = COALESCE($3, grade), email = COALESCE($4, email),
        dismissal_type = COALESCE($5, dismissal_type), bus_route = COALESCE($6, bus_route),
        homeroom_id = COALESCE($7, homeroom_id), status = COALESCE($8, status),
        updated_at = NOW()
       WHERE id = $9 RETURNING *`,
      [firstName, lastName, grade, email, dismissalType, busRoute, homeroomId, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Student not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// Delete student (soft)
router.delete('/students/:id', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await pool.query("UPDATE students SET status = 'inactive' WHERE id = $1", [req.params.id]);
    res.json({ message: 'Student removed' });
  } catch (err) {
    next(err);
  }
});

// Bulk update students (dismissal type and bus route)
router.put('/schools/:schoolId/students/bulk-update', requireAuth, requireRole('admin', 'office_staff'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { updates } = req.body;
      const schoolId = req.params.schoolId;
      if (!Array.isArray(updates) || updates.length === 0) {
        return res.status(400).json({ error: 'Updates array required' });
      }

      const results = [];
      for (const u of updates) {
        const result = await pool.query(
          `UPDATE students SET
            dismissal_type = COALESCE($1, dismissal_type),
            bus_route = $2,
            updated_at = NOW()
           WHERE id = $3 AND school_id = $4 RETURNING *`,
          [u.dismissal_type || null, u.bus_route !== undefined ? u.bus_route : null, u.id, schoolId]
        );
        if (result.rows.length > 0) results.push(result.rows[0]);
      }

      res.json(results);
    } catch (err) {
      next(err);
    }
  }
);

// CSV import
router.post('/schools/:schoolId/students/import', requireAuth, requireRole('admin'), upload.single('file'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'CSV file required' });

      const records: any[] = [];
      const parser = Readable.from(req.file.buffer).pipe(
        parse({ columns: true, skip_empty_lines: true, trim: true })
      );

      for await (const record of parser) {
        records.push(record);
      }

      let imported = 0;
      let skipped = 0;

      for (const record of records) {
        const firstName = record['First Name'] || record['first_name'] || record['firstName'];
        const lastName = record['Last Name'] || record['last_name'] || record['lastName'];
        if (!firstName || !lastName) { skipped++; continue; }

        const grade = record['Grade'] || record['grade'] || '';
        const email = record['Email'] || record['email'] || '';
        const dismissalType = record['Dismissal Type'] || record['dismissal_type'] || 'car';
        const busRoute = record['Bus #'] || record['Bus Route'] || record['bus_route'] || '';
        const externalId = record['Student ID'] || record['external_id'] || '';

        const studentCode = await generateStudentCode(Number(req.params.schoolId));
        await pool.query(
          `INSERT INTO students (school_id, external_id, first_name, last_name, grade, email, dismissal_type, bus_route, student_code)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT DO NOTHING`,
          [req.params.schoolId, externalId || null, firstName, lastName,
           grade || null, email || null, dismissalType, busRoute || null, studentCode]
        );
        imported++;
      }

      res.json({ imported, skipped, total: records.length });
    } catch (err) {
      next(err);
    }
  }
);

// ==================== Family Groups ====================

// List family groups for a school
router.get('/schools/:schoolId/family-groups', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const groups = await pool.query(
      `SELECT fg.*, json_agg(json_build_object('id', s.id, 'first_name', s.first_name, 'last_name', s.last_name, 'grade', s.grade, 'dismissal_type', s.dismissal_type, 'homeroom_name', h.name)) FILTER (WHERE s.id IS NOT NULL) AS students
       FROM family_groups fg
       LEFT JOIN family_group_students fgs ON fgs.family_group_id = fg.id
       LEFT JOIN students s ON s.id = fgs.student_id AND s.status = 'active'
       LEFT JOIN homerooms h ON h.id = s.homeroom_id
       WHERE fg.school_id = $1
       GROUP BY fg.id
       ORDER BY fg.car_number`,
      [req.params.schoolId]
    );
    res.json(groups.rows);
  } catch (err) {
    next(err);
  }
});

// Create family group
router.post('/schools/:schoolId/family-groups', requireAuth, requireRole('admin', 'office_staff'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schoolId = Number(req.params.schoolId);
    const { carNumber, familyName, studentIds } = req.body;

    const number = carNumber || await generateFamilyGroupNumber(schoolId);

    const result = await pool.query(
      'INSERT INTO family_groups (school_id, car_number, family_name) VALUES ($1, $2, $3) RETURNING *',
      [schoolId, number, familyName || null]
    );
    const group = result.rows[0];

    if (studentIds?.length) {
      for (const sid of studentIds) {
        await pool.query(
          'INSERT INTO family_group_students (family_group_id, student_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [group.id, sid]
        );
      }
    }

    res.status(201).json(group);
  } catch (err) {
    next(err);
  }
});

// Update family group
router.put('/family-groups/:id', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { familyName, carNumber, studentIds } = req.body;

    if (carNumber !== undefined) {
      await pool.query('UPDATE family_groups SET car_number = $1 WHERE id = $2', [carNumber, req.params.id]);
    }

    if (familyName !== undefined) {
      await pool.query('UPDATE family_groups SET family_name = $1 WHERE id = $2', [familyName, req.params.id]);
    }

    if (studentIds !== undefined) {
      await pool.query('DELETE FROM family_group_students WHERE family_group_id = $1', [req.params.id]);
      for (const sid of studentIds) {
        await pool.query(
          'INSERT INTO family_group_students (family_group_id, student_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [req.params.id, sid]
        );
      }
    }

    const result = await pool.query('SELECT * FROM family_groups WHERE id = $1', [req.params.id]);
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// Add students to existing family group
router.post('/family-groups/:id/students', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { studentIds } = req.body;
    for (const sid of studentIds) {
      await pool.query(
        'INSERT INTO family_group_students (family_group_id, student_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [req.params.id, sid]
      );
    }
    res.json({ message: 'Students added' });
  } catch (err) {
    next(err);
  }
});

// Remove student from family group
router.delete('/family-groups/:groupId/students/:studentId', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await pool.query(
      'DELETE FROM family_group_students WHERE family_group_id = $1 AND student_id = $2',
      [req.params.groupId, req.params.studentId]
    );
    res.json({ message: 'Student removed' });
  } catch (err) {
    next(err);
  }
});

// Delete family group
router.delete('/family-groups/:id', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await pool.query('DELETE FROM family_groups WHERE id = $1', [req.params.id]);
    res.json({ message: 'Group deleted' });
  } catch (err) {
    next(err);
  }
});

// Auto-assign: create individual groups for all unassigned students
router.post('/schools/:schoolId/family-groups/auto-assign', requireAuth, requireRole('admin', 'office_staff'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schoolId = Number(req.params.schoolId);

    const unassigned = await pool.query(
      `SELECT s.id, s.first_name, s.last_name FROM students s
       WHERE s.school_id = $1 AND s.status = 'active'
         AND s.id NOT IN (SELECT student_id FROM family_group_students)
       ORDER BY s.last_name, s.first_name`,
      [schoolId]
    );

    let created = 0;
    for (const student of unassigned.rows) {
      const number = await generateFamilyGroupNumber(schoolId);
      const result = await pool.query(
        'INSERT INTO family_groups (school_id, car_number, family_name) VALUES ($1, $2, $3) RETURNING id',
        [schoolId, number, `${student.last_name} Family`]
      );
      await pool.query(
        'INSERT INTO family_group_students (family_group_id, student_id) VALUES ($1, $2)',
        [result.rows[0].id, student.id]
      );
      created++;
    }

    res.json({ created, total: unassigned.rows.length });
  } catch (err) {
    next(err);
  }
});

// Send to App Mode: generate invite tokens for all family groups, switch school mode
router.post('/schools/:schoolId/send-to-app-mode', requireAuth, requireRole('admin'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schoolId = Number(req.params.schoolId);

    // Update school mode
    await pool.query("UPDATE schools SET dismissal_mode = 'app' WHERE id = $1", [schoolId]);

    // Generate invite tokens for all family groups that don't have one yet
    const groups = await pool.query(
      'SELECT id FROM family_groups WHERE school_id = $1 AND invite_token IS NULL',
      [schoolId]
    );

    for (const group of groups.rows) {
      const token = crypto.randomBytes(32).toString('hex');
      await pool.query('UPDATE family_groups SET invite_token = $1 WHERE id = $2', [token, group.id]);
    }

    // Return all groups with tokens and students
    const result = await pool.query(
      `SELECT fg.id, fg.car_number, fg.family_name, fg.invite_token, fg.claimed_by_user_id,
              json_agg(json_build_object('id', s.id, 'first_name', s.first_name, 'last_name', s.last_name)) FILTER (WHERE s.id IS NOT NULL) AS students
       FROM family_groups fg
       LEFT JOIN family_group_students fgs ON fgs.family_group_id = fg.id
       LEFT JOIN students s ON s.id = fgs.student_id AND s.status = 'active'
       WHERE fg.school_id = $1
       GROUP BY fg.id
       ORDER BY fg.car_number`,
      [schoolId]
    );

    res.json({ mode: 'app', groups: result.rows });
  } catch (err) {
    next(err);
  }
});

// Switch back to no-app mode
router.post('/schools/:schoolId/switch-to-no-app-mode', requireAuth, requireRole('admin'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schoolId = Number(req.params.schoolId);
    await pool.query("UPDATE schools SET dismissal_mode = 'no_app' WHERE id = $1", [schoolId]);
    res.json({ mode: 'no_app' });
  } catch (err) {
    next(err);
  }
});

// Get school dismissal mode
router.get('/schools/:schoolId/dismissal-mode', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query('SELECT dismissal_mode FROM schools WHERE id = $1', [req.params.schoolId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'School not found' });
    res.json({ mode: result.rows[0].dismissal_mode });
  } catch (err) {
    next(err);
  }
});

export default router;
