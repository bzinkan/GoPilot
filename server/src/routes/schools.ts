import { Router, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { requireAuth, requireRole, requireSuperAdmin, AuthRequest } from '../middleware/auth';
import pool from '../db';

const router = Router();

// Create school (super admin only)
router.post('/', requireAuth, requireSuperAdmin as any, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, address, phone, timezone, dismissalTime, settings } = req.body;
    if (!name) return res.status(400).json({ error: 'School name is required' });

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const result = await pool.query(
      `INSERT INTO schools (name, slug, address, phone, timezone, dismissal_time, settings)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, slug, address || null, phone || null, timezone || 'America/New_York',
       dismissalTime || '15:00', JSON.stringify(settings || {})]
    );

    const school = result.rows[0];

    // Make creator an admin
    await pool.query(
      `INSERT INTO school_memberships (user_id, school_id, role, status)
       VALUES ($1, $2, 'admin', 'active')`,
      [req.user.userId, school.id]
    );

    res.status(201).json(school);
  } catch (err) {
    next(err);
  }
});

// Get school
router.get('/:schoolId', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query('SELECT * FROM schools WHERE id = $1', [req.params.schoolId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'School not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// Update school
router.put('/:schoolId', requireAuth, requireRole('admin'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, address, phone, timezone, dismissalTime, settings } = req.body;
    const result = await pool.query(
      `UPDATE schools SET
        name = COALESCE($1, name), address = COALESCE($2, address),
        phone = COALESCE($3, phone), timezone = COALESCE($4, timezone),
        dismissal_time = COALESCE($5, dismissal_time),
        settings = COALESCE($6, settings), updated_at = NOW()
       WHERE id = $7 RETURNING *`,
      [name, address, phone, timezone, dismissalTime, settings ? JSON.stringify(settings) : null, req.params.schoolId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// Get school settings (with defaults)
router.get('/:schoolId/settings', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query('SELECT settings FROM schools WHERE id = $1', [req.params.schoolId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'School not found' });

    const settings = result.rows[0].settings || {};
    // Provide default pickup zones if none configured
    if (!settings.pickupZones || settings.pickupZones.length === 0) {
      settings.pickupZones = [
        { id: 'A', name: 'Zone A' },
        { id: 'B', name: 'Zone B' },
        { id: 'C', name: 'Zone C' },
      ];
    }
    res.json(settings);
  } catch (err) {
    next(err);
  }
});

// Update school settings
router.put('/:schoolId/settings', requireAuth, requireRole('admin'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const settings = req.body;
    if (!settings || typeof settings !== 'object') return res.status(400).json({ error: 'Settings object is required' });

    const result = await pool.query(
      `UPDATE schools SET settings = $1, updated_at = NOW() WHERE id = $2 RETURNING settings`,
      [JSON.stringify(settings), req.params.schoolId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'School not found' });
    res.json(result.rows[0].settings);
  } catch (err) {
    next(err);
  }
});

// Invite user to school
router.post('/:schoolId/invite', requireAuth, requireRole('admin'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { email, role } = req.body;
    if (!email || !role) return res.status(400).json({ error: 'Email and role are required' });

    // Find or note the user
    const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found. They must register first.' });
    }

    const userId = userResult.rows[0].id;
    await pool.query(
      `INSERT INTO school_memberships (user_id, school_id, role, status)
       VALUES ($1, $2, $3, 'active')
       ON CONFLICT (user_id, school_id, role) DO UPDATE SET status = 'active'`,
      [userId, req.params.schoolId, role]
    );

    res.json({ message: 'User added to school' });
  } catch (err) {
    next(err);
  }
});

// List members
router.get('/:schoolId/members', requireAuth, requireRole('admin', 'office_staff'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.photo_url, sm.role, sm.status
       FROM school_memberships sm
       JOIN users u ON u.id = sm.user_id
       WHERE sm.school_id = $1
       ORDER BY sm.role, u.last_name`,
      [req.params.schoolId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// ─── STAFF MANAGEMENT ────────────────────────────────────────────────

// GET /api/schools/:schoolId/staff
router.get('/:schoolId/staff', requireAuth, requireRole('admin'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.phone,
              sm.role, sm.status,
              h.id as homeroom_id, h.name as homeroom_name, h.grade as homeroom_grade
       FROM school_memberships sm
       JOIN users u ON u.id = sm.user_id
       LEFT JOIN homerooms h ON h.teacher_id = u.id AND h.school_id = sm.school_id
       WHERE sm.school_id = $1 AND sm.role IN ('admin', 'teacher', 'office_staff')
       ORDER BY sm.role, u.last_name`,
      [req.params.schoolId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/schools/:schoolId/staff
router.post('/:schoolId/staff', requireAuth, requireRole('admin'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { email, firstName, lastName, role, password } = req.body;
    if (!email || !firstName || !lastName || !role) {
      return res.status(400).json({ error: 'email, firstName, lastName, and role are required' });
    }
    if (!['teacher', 'office_staff'].includes(role)) {
      return res.status(400).json({ error: 'role must be teacher or office_staff' });
    }

    // Find or create user
    let userId: number;
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

    if (existing.rows.length > 0) {
      userId = existing.rows[0].id;
      // Update name if different
      await pool.query(
        'UPDATE users SET first_name = COALESCE($1, first_name), last_name = COALESCE($2, last_name) WHERE id = $3',
        [firstName, lastName, userId]
      );
    } else {
      // Create new user account
      const passwordHash = password ? await bcrypt.hash(password, 12) : null;
      const userResult = await pool.query(
        `INSERT INTO users (email, first_name, last_name, password_hash)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [email, firstName, lastName, passwordHash]
      );
      userId = userResult.rows[0].id;
    }

    // Add school membership
    await pool.query(
      `INSERT INTO school_memberships (user_id, school_id, role, status)
       VALUES ($1, $2, $3, 'active')
       ON CONFLICT (user_id, school_id, role) DO UPDATE SET status = 'active'`,
      [userId, req.params.schoolId, role]
    );

    // Return the staff member with homeroom info
    const result = await pool.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.phone,
              sm.role, sm.status,
              h.id as homeroom_id, h.name as homeroom_name, h.grade as homeroom_grade
       FROM school_memberships sm
       JOIN users u ON u.id = sm.user_id
       LEFT JOIN homerooms h ON h.teacher_id = u.id AND h.school_id = sm.school_id
       WHERE sm.school_id = $1 AND u.id = $2 AND sm.role = $3`,
      [req.params.schoolId, userId, role]
    );

    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Staff member already exists with this role' });
    }
    next(err);
  }
});

// PUT /api/schools/:schoolId/staff/:userId
router.put('/:schoolId/staff/:userId', requireAuth, requireRole('admin'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { role, password, firstName, lastName } = req.body;

    if (firstName || lastName) {
      await pool.query(
        'UPDATE users SET first_name = COALESCE($1, first_name), last_name = COALESCE($2, last_name) WHERE id = $3',
        [firstName || null, lastName || null, req.params.userId]
      );
    }

    if (role && ['teacher', 'office_staff'].includes(role)) {
      // Remove old staff roles, add new one
      await pool.query(
        `DELETE FROM school_memberships WHERE user_id = $1 AND school_id = $2 AND role IN ('teacher', 'office_staff')`,
        [req.params.userId, req.params.schoolId]
      );
      await pool.query(
        `INSERT INTO school_memberships (user_id, school_id, role, status) VALUES ($1, $2, $3, 'active')`,
        [req.params.userId, req.params.schoolId, role]
      );
    }

    if (password) {
      const passwordHash = await bcrypt.hash(password, 12);
      await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, req.params.userId]);
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/schools/:schoolId/staff/:userId
router.delete('/:schoolId/staff/:userId', requireAuth, requireRole('admin'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Unassign from homerooms
    await pool.query(
      'UPDATE homerooms SET teacher_id = NULL WHERE school_id = $1 AND teacher_id = $2',
      [req.params.schoolId, req.params.userId]
    );
    // Remove membership
    await pool.query(
      `DELETE FROM school_memberships WHERE user_id = $1 AND school_id = $2 AND role IN ('teacher', 'office_staff')`,
      [req.params.userId, req.params.schoolId]
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
