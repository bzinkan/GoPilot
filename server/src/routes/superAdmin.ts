import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { requireAuth, requireSuperAdmin, AuthRequest } from '../middleware/auth';
import { signToken } from '../config/jwt';
import pool from '../db';

const router = Router();

// ─── Public: Submit trial request ────────────────────────────────────
router.post('/trial-requests', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { schoolName, domain, contactName, contactEmail, estimatedStudents, message } = req.body;
    if (!schoolName || !contactName || !contactEmail) {
      return res.status(400).json({ error: 'School name, contact name, and contact email are required' });
    }

    // Prevent duplicate submissions from same email
    const existing = await pool.query(
      `SELECT id FROM trial_requests WHERE LOWER(contact_email) = LOWER($1) AND status = 'pending'`,
      [contactEmail]
    );
    if (existing.rows.length > 0) {
      return res.json({ message: 'Trial request submitted successfully' });
    }

    await pool.query(
      `INSERT INTO trial_requests (school_name, domain, contact_name, contact_email, estimated_students, message)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [schoolName, domain || null, contactName, contactEmail, estimatedStudents || null, message || null]
    );

    res.status(201).json({ message: 'Trial request submitted successfully' });
  } catch (err) {
    next(err);
  }
});

// ─── All routes below require super admin ────────────────────────────
router.use(requireAuth);
router.use(requireSuperAdmin as any);

// ─── Dashboard stats ─────────────────────────────────────────────────
router.get('/stats', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schools = await pool.query(
      `SELECT
        COUNT(*) FILTER (WHERE deleted_at IS NULL) AS total_schools,
        COUNT(*) FILTER (WHERE status = 'active' AND deleted_at IS NULL) AS active_schools,
        COUNT(*) FILTER (WHERE status = 'trial' AND deleted_at IS NULL) AS trial_schools,
        COUNT(*) FILTER (WHERE status = 'suspended' AND deleted_at IS NULL) AS suspended_schools
       FROM schools`
    );
    const students = await pool.query(
      `SELECT COUNT(*) AS total_students FROM students
       WHERE school_id IN (SELECT id FROM schools WHERE deleted_at IS NULL)`
    );
    const pending = await pool.query(
      `SELECT COUNT(*) AS pending_requests FROM trial_requests WHERE status = 'pending'`
    );

    res.json({
      ...schools.rows[0],
      total_students: students.rows[0].total_students,
      pending_requests: pending.rows[0].pending_requests,
    });
  } catch (err) {
    next(err);
  }
});

// ─── List schools ────────────────────────────────────────────────────
router.get('/schools', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { search, status } = req.query;
    let query = `
      SELECT s.*,
        (SELECT COUNT(*) FROM students st WHERE st.school_id = s.id) AS student_count,
        (SELECT COUNT(*) FROM school_memberships sm WHERE sm.school_id = s.id AND sm.role = 'admin' AND sm.status = 'active') AS admin_count,
        (SELECT COUNT(*) FROM school_memberships sm WHERE sm.school_id = s.id AND sm.status = 'active') AS member_count
      FROM schools s
      WHERE s.deleted_at IS NULL
    `;
    const params: any[] = [];

    if (status && status !== 'all') {
      params.push(status);
      query += ` AND s.status = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND s.name ILIKE $${params.length}`;
    }

    query += ' ORDER BY s.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// ─── Create school + first admin ─────────────────────────────────────
router.post('/schools', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      name, address, phone, timezone, dismissalTime,
      status: schoolStatus, maxStudents, trialDays, billingEmail,
      adminEmail, adminFirstName, adminLastName, adminPassword,
    } = req.body;

    if (!name) return res.status(400).json({ error: 'School name is required' });

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Calculate trial end date
    let trialEndsAt = null;
    if (schoolStatus === 'trial' && trialDays) {
      trialEndsAt = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);
    }

    const schoolResult = await pool.query(
      `INSERT INTO schools (name, slug, address, phone, timezone, dismissal_time, status, max_students, trial_ends_at, billing_email)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        name, slug,
        address || null, phone || null,
        timezone || 'America/New_York',
        dismissalTime || '15:00',
        schoolStatus || 'trial',
        maxStudents || null,
        trialEndsAt,
        billingEmail || adminEmail || null,
      ]
    );
    const school = schoolResult.rows[0];

    let adminCreated = false;
    let tempPassword = null;

    if (adminEmail) {
      // Find or create admin user
      let adminUser = (await pool.query('SELECT * FROM users WHERE email = $1', [adminEmail])).rows[0];

      if (!adminUser) {
        tempPassword = adminPassword || crypto.randomBytes(8).toString('base64').slice(0, 12);
        const hash = await bcrypt.hash(tempPassword, 12);
        const adminResult = await pool.query(
          `INSERT INTO users (email, password_hash, first_name, last_name, is_super_admin)
           VALUES ($1, $2, $3, $4, false) RETURNING *`,
          [adminEmail, hash, adminFirstName || 'School', adminLastName || 'Admin']
        );
        adminUser = adminResult.rows[0];
      }

      // Create admin membership
      await pool.query(
        `INSERT INTO school_memberships (user_id, school_id, role, status)
         VALUES ($1, $2, 'admin', 'active')
         ON CONFLICT (user_id, school_id, role) DO UPDATE SET status = 'active'`,
        [adminUser.id, school.id]
      );
      adminCreated = true;
    }

    res.status(201).json({
      school,
      adminCreated,
      tempPassword,
    });
  } catch (err) {
    next(err);
  }
});

// ─── Get school detail ───────────────────────────────────────────────
router.get('/schools/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const school = (await pool.query('SELECT * FROM schools WHERE id = $1', [req.params.id])).rows[0];
    if (!school) return res.status(404).json({ error: 'School not found' });

    const members = (await pool.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, sm.role, sm.status
       FROM school_memberships sm
       JOIN users u ON u.id = sm.user_id
       WHERE sm.school_id = $1
       ORDER BY sm.role, u.last_name`,
      [req.params.id]
    )).rows;

    const studentCount = (await pool.query(
      'SELECT COUNT(*) AS count FROM students WHERE school_id = $1',
      [req.params.id]
    )).rows[0].count;

    const homeroomCount = (await pool.query(
      'SELECT COUNT(*) AS count FROM homerooms WHERE school_id = $1',
      [req.params.id]
    )).rows[0].count;

    res.json({ ...school, members, student_count: studentCount, homeroom_count: homeroomCount });
  } catch (err) {
    next(err);
  }
});

// ─── Update school ───────────────────────────────────────────────────
router.put('/schools/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, address, phone, timezone, dismissalTime, status: schoolStatus, maxStudents, billingEmail } = req.body;
    const result = await pool.query(
      `UPDATE schools SET
        name = COALESCE($1, name), address = COALESCE($2, address),
        phone = COALESCE($3, phone), timezone = COALESCE($4, timezone),
        dismissal_time = COALESCE($5, dismissal_time),
        status = COALESCE($6, status), max_students = COALESCE($7, max_students),
        billing_email = COALESCE($8, billing_email), updated_at = NOW()
       WHERE id = $9 RETURNING *`,
      [name, address, phone, timezone, dismissalTime, schoolStatus, maxStudents, billingEmail, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'School not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// ─── Suspend school ──────────────────────────────────────────────────
router.post('/schools/:id/suspend', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query(
      `UPDATE schools SET status = 'suspended', updated_at = NOW() WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'School not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// ─── Restore school ─────────────────────────────────────────────────
router.post('/schools/:id/restore', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query(
      `UPDATE schools SET status = 'active', deleted_at = NULL, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'School not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// ─── Soft delete school ──────────────────────────────────────────────
router.delete('/schools/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query(
      `UPDATE schools SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'School not found' });
    res.json({ message: 'School deleted' });
  } catch (err) {
    next(err);
  }
});

// ─── Add admin to school ────────────────────────────────────────────
router.post('/schools/:id/admins', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { email, firstName, lastName, password } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    let user = (await pool.query('SELECT * FROM users WHERE email = $1', [email])).rows[0];
    let tempPassword = null;

    if (!user) {
      tempPassword = password || crypto.randomBytes(8).toString('base64').slice(0, 12);
      const hash = await bcrypt.hash(tempPassword, 12);
      user = (await pool.query(
        `INSERT INTO users (email, password_hash, first_name, last_name)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [email, hash, firstName || 'School', lastName || 'Admin']
      )).rows[0];
    }

    await pool.query(
      `INSERT INTO school_memberships (user_id, school_id, role, status)
       VALUES ($1, $2, 'admin', 'active')
       ON CONFLICT (user_id, school_id, role) DO UPDATE SET status = 'active'`,
      [user.id, req.params.id]
    );

    res.json({
      admin: { id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name },
      tempPassword,
    });
  } catch (err) {
    next(err);
  }
});

// ─── Impersonate school admin ────────────────────────────────────────
router.post('/schools/:id/impersonate', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const admin = (await pool.query(
      `SELECT u.id, u.email FROM school_memberships sm
       JOIN users u ON u.id = sm.user_id
       WHERE sm.school_id = $1 AND sm.role = 'admin' AND sm.status = 'active'
       LIMIT 1`,
      [req.params.id]
    )).rows[0];

    if (!admin) return res.status(404).json({ error: 'No admin found for this school' });

    const token = signToken({ userId: admin.id, email: admin.email });
    res.json({ token, admin });
  } catch (err) {
    next(err);
  }
});

// ─── List trial requests ────────────────────────────────────────────
router.get('/trial-requests', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM trial_requests';
    const params: any[] = [];

    if (status && status !== 'all') {
      params.push(status);
      query += ` WHERE status = $${params.length}`;
    }

    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// ─── Update trial request ───────────────────────────────────────────
router.put('/trial-requests/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, notes } = req.body;
    const result = await pool.query(
      `UPDATE trial_requests SET
        status = COALESCE($1, status),
        notes = COALESCE($2, notes),
        updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [status, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Trial request not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// ─── Convert trial request to school ────────────────────────────────
router.post('/trial-requests/:id/convert', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const request = (await pool.query('SELECT * FROM trial_requests WHERE id = $1', [req.params.id])).rows[0];
    if (!request) return res.status(404).json({ error: 'Trial request not found' });
    if (request.status === 'converted') return res.status(400).json({ error: 'Already converted' });

    const { trialDays, maxStudents } = req.body;

    // Create the school
    const slug = request.school_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const trialEndsAt = new Date(Date.now() + (trialDays || 30) * 24 * 60 * 60 * 1000);

    const schoolResult = await pool.query(
      `INSERT INTO schools (name, slug, status, max_students, trial_ends_at, billing_email)
       VALUES ($1, $2, 'trial', $3, $4, $5) RETURNING *`,
      [request.school_name, slug, maxStudents || null, trialEndsAt, request.contact_email]
    );
    const school = schoolResult.rows[0];

    // Create admin user
    let adminUser = (await pool.query('SELECT * FROM users WHERE email = $1', [request.contact_email])).rows[0];
    let tempPassword = null;

    if (!adminUser) {
      tempPassword = crypto.randomBytes(8).toString('base64').slice(0, 12);
      const hash = await bcrypt.hash(tempPassword, 12);
      const nameParts = request.contact_name.split(' ');
      adminUser = (await pool.query(
        `INSERT INTO users (email, password_hash, first_name, last_name)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [request.contact_email, hash, nameParts[0] || 'School', nameParts.slice(1).join(' ') || 'Admin']
      )).rows[0];
    }

    await pool.query(
      `INSERT INTO school_memberships (user_id, school_id, role, status)
       VALUES ($1, $2, 'admin', 'active')
       ON CONFLICT (user_id, school_id, role) DO UPDATE SET status = 'active'`,
      [adminUser.id, school.id]
    );

    // Update trial request
    await pool.query(
      `UPDATE trial_requests SET status = 'converted', converted_school_id = $1, updated_at = NOW() WHERE id = $2`,
      [school.id, req.params.id]
    );

    res.json({ school, adminCreated: true, tempPassword });
  } catch (err) {
    next(err);
  }
});

export default router;
