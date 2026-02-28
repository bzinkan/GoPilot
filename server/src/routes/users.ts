import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import pool from '../db';
import { generateCarNumber } from '../utils/studentCode';

const router = Router();

// Update profile
router.put('/me', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { firstName, lastName, phone, checkInMethod, notificationPrefs } = req.body;
    const result = await pool.query(
      `UPDATE users SET
        first_name = COALESCE($1, first_name), last_name = COALESCE($2, last_name),
        phone = COALESCE($3, phone), check_in_method = COALESCE($4, check_in_method),
        notification_prefs = COALESCE($5, notification_prefs), updated_at = NOW()
       WHERE id = $6 RETURNING id, email, first_name, last_name, phone, photo_url, check_in_method, notification_prefs`,
      [firstName, lastName, phone, checkInMethod, notificationPrefs ? JSON.stringify(notificationPrefs) : null, req.user.userId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// Join a school as parent (by slug)
router.post('/me/join-school', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { schoolSlug } = req.body;
    if (!schoolSlug) return res.status(400).json({ error: 'School slug required' });

    const schoolResult = await pool.query(
      "SELECT id, name, slug FROM schools WHERE slug = $1 AND status != 'inactive'",
      [schoolSlug.toLowerCase()]
    );
    if (schoolResult.rows.length === 0) {
      return res.status(404).json({ error: 'School not found' });
    }

    const school = schoolResult.rows[0];

    // Check if already a member
    const existing = await pool.query(
      'SELECT id FROM school_memberships WHERE user_id = $1 AND school_id = $2',
      [req.user.userId, school.id]
    );
    if (existing.rows.length > 0) {
      return res.json({ message: 'Already a member', school });
    }

    const memberResult = await pool.query(
      `INSERT INTO school_memberships (user_id, school_id, role, status) VALUES ($1, $2, 'parent', 'active') RETURNING id`,
      [req.user.userId, school.id]
    );

    // Auto-assign car number
    const carNumber = await generateCarNumber(school.id);
    await pool.query(
      'UPDATE school_memberships SET car_number = $1 WHERE id = $2',
      [carNumber, memberResult.rows[0].id]
    );

    res.json({ message: 'Joined school', school, carNumber });
  } catch (err) {
    next(err);
  }
});

// Get my children (parent)
router.get('/me/children', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query(
      `SELECT s.*, ps.relationship, ps.is_primary, h.name AS homeroom_name
       FROM parent_student ps
       JOIN students s ON s.id = ps.student_id
       LEFT JOIN homerooms h ON h.id = s.homeroom_id
       WHERE ps.parent_id = $1 AND ps.status = 'approved' AND s.status = 'active'
       ORDER BY s.last_name, s.first_name`,
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// Link child by student code
router.post('/me/children/link', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { code, relationship, schoolId } = req.body;
    if (!code || !relationship) return res.status(400).json({ error: 'Student code and relationship required' });

    let studentQuery = "SELECT * FROM students WHERE student_code = $1 AND status = 'active'";
    const studentParams: any[] = [code.toString().trim()];
    if (schoolId) {
      studentQuery += ' AND school_id = $2';
      studentParams.push(schoolId);
    }
    const studentResult = await pool.query(studentQuery, studentParams);
    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid student code' });
    }

    const student = studentResult.rows[0];

    // Check if already linked
    const existing = await pool.query(
      'SELECT id FROM parent_student WHERE parent_id = $1 AND student_id = $2',
      [req.user.userId, student.id]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Already linked to this student' });
    }

    await pool.query(
      `INSERT INTO parent_student (parent_id, student_id, relationship, status)
       VALUES ($1, $2, $3, 'pending')`,
      [req.user.userId, student.id, relationship]
    );

    // Also add as a school member (parent role)
    const memberInsert = await pool.query(
      `INSERT INTO school_memberships (user_id, school_id, role, status)
       VALUES ($1, $2, 'parent', 'active')
       ON CONFLICT (user_id, school_id, role) DO NOTHING
       RETURNING id`,
      [req.user.userId, student.school_id]
    );
    // If newly inserted, assign car number
    if (memberInsert.rows.length > 0) {
      const carNumber = await generateCarNumber(student.school_id);
      await pool.query('UPDATE school_memberships SET car_number = $1 WHERE id = $2', [carNumber, memberInsert.rows[0].id]);
    }

    res.json({ message: 'Link request submitted', student: { firstName: student.first_name, lastName: student.last_name } });
  } catch (err) {
    next(err);
  }
});

// List parent link requests (admin)
router.get('/schools/:schoolId/parent-requests', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query(
      `SELECT ps.*, u.first_name AS parent_first_name, u.last_name AS parent_last_name, u.email AS parent_email,
              s.first_name AS student_first_name, s.last_name AS student_last_name
       FROM parent_student ps
       JOIN users u ON u.id = ps.parent_id
       JOIN students s ON s.id = ps.student_id
       WHERE s.school_id = $1 AND ps.status = 'pending'
       ORDER BY ps.created_at DESC`,
      [req.params.schoolId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// Approve/reject parent link
router.put('/parent-requests/:id', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body; // 'approved' or 'rejected'
    const result = await pool.query(
      'UPDATE parent_student SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Request not found' });

    // If approved, ensure parent's membership has a car number
    if (status === 'approved') {
      const ps = result.rows[0];
      const student = await pool.query('SELECT school_id FROM students WHERE id = $1', [ps.student_id]);
      if (student.rows.length > 0) {
        const schoolId = student.rows[0].school_id;
        const membership = await pool.query(
          "SELECT id, car_number FROM school_memberships WHERE user_id = $1 AND school_id = $2 AND role = 'parent'",
          [ps.parent_id, schoolId]
        );
        if (membership.rows.length > 0 && !membership.rows[0].car_number) {
          const carNumber = await generateCarNumber(schoolId);
          await pool.query('UPDATE school_memberships SET car_number = $1 WHERE id = $2', [carNumber, membership.rows[0].id]);
        }
      }
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// List parents for a school (admin view)
router.get('/schools/:schoolId/parents', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.phone, sm.car_number, sm.status AS membership_status,
              json_agg(json_build_object('id', s.id, 'first_name', s.first_name, 'last_name', s.last_name, 'grade', s.grade)) FILTER (WHERE s.id IS NOT NULL) AS children
       FROM school_memberships sm
       JOIN users u ON u.id = sm.user_id
       LEFT JOIN parent_student ps ON ps.parent_id = u.id AND ps.status = 'approved'
       LEFT JOIN students s ON s.id = ps.student_id AND s.school_id = $1
       WHERE sm.school_id = $1 AND sm.role = 'parent' AND sm.status = 'active'
       GROUP BY u.id, sm.car_number, sm.status
       ORDER BY u.last_name, u.first_name`,
      [req.params.schoolId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

export default router;
