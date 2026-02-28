import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import passport from '../config/passport';
import { signToken } from '../config/jwt';
import { requireAuth, AuthRequest } from '../middleware/auth';
import pool from '../db';
import { generateCarNumber } from '../utils/studentCode';

const router = Router();

// Register with email/password
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, firstName, lastName, phone, schoolName, timezone } = req.body;

    if (!email || !password || !firstName || !lastName || !schoolName) {
      return res.status(400).json({ error: 'Email, password, first name, last name, and school name are required' });
    }

    // Check if user exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, email, first_name, last_name, phone, photo_url, created_at`,
      [email, passwordHash, firstName, lastName, phone || null]
    );

    const user = result.rows[0];

    // Create school with trial status
    const slug = schoolName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const schoolResult = await pool.query(
      `INSERT INTO schools (name, slug, status, timezone) VALUES ($1, $2, 'trial', $3) RETURNING id, name, slug`,
      [schoolName, slug, timezone || 'America/New_York']
    );
    const school = schoolResult.rows[0];

    // Create school membership as admin
    await pool.query(
      `INSERT INTO school_memberships (user_id, school_id, role, status) VALUES ($1, $2, 'admin', 'active')`,
      [user.id, school.id]
    );

    const token = signToken({ userId: user.id, email: user.email });

    res.status(201).json({ token, user, school });
  } catch (err) {
    next(err);
  }
});

// Register as parent (no school creation)
router.post('/register/parent', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, firstName, lastName, phone, inviteToken } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Email, password, first name, and last name are required' });
    }

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, email, first_name, last_name, phone, photo_url, created_at`,
      [email, passwordHash, firstName, lastName, phone || null]
    );

    const user = result.rows[0];
    const token = signToken({ userId: user.id, email: user.email });

    let school = null;
    let carNumber = null;

    // If invite token provided, auto-link to family group
    if (inviteToken) {
      const groupResult = await pool.query(
        `SELECT fg.id, fg.school_id, fg.car_number, fg.family_name, s.name AS school_name, s.slug AS school_slug
         FROM family_groups fg JOIN schools s ON s.id = fg.school_id
         WHERE fg.invite_token = $1 AND fg.claimed_by_user_id IS NULL`,
        [inviteToken]
      );

      if (groupResult.rows.length > 0) {
        const group = groupResult.rows[0];

        // Create school membership with the family group's car number
        await pool.query(
          `INSERT INTO school_memberships (user_id, school_id, role, status, car_number)
           VALUES ($1, $2, 'parent', 'active', $3)
           ON CONFLICT (user_id, school_id, role) DO UPDATE SET car_number = $3`,
          [user.id, group.school_id, group.car_number]
        );

        // Auto-link all students in the family group
        const students = await pool.query(
          'SELECT student_id FROM family_group_students WHERE family_group_id = $1',
          [group.id]
        );
        for (const s of students.rows) {
          await pool.query(
            `INSERT INTO parent_student (parent_id, student_id, relationship, status)
             VALUES ($1, $2, 'parent', 'approved')
             ON CONFLICT DO NOTHING`,
            [user.id, s.student_id]
          );
        }

        // Mark family group as claimed
        await pool.query(
          'UPDATE family_groups SET claimed_by_user_id = $1 WHERE id = $2',
          [user.id, group.id]
        );

        school = { id: group.school_id, name: group.school_name, slug: group.school_slug };
        carNumber = group.car_number;
      }
    }

    res.status(201).json({ token, user, school, carNumber });
  } catch (err) {
    next(err);
  }
});

// Login with email/password
router.post('/login', (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('local', { session: false }, async (err: any, user: any, info: any) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ error: info?.message || 'Invalid credentials' });

    try {
      // Fetch memberships
      const membershipResult = await pool.query(
        `SELECT sm.school_id, sm.role, s.name AS school_name, s.slug AS school_slug, sm.car_number, s.timezone AS school_timezone
         FROM school_memberships sm
         JOIN schools s ON s.id = sm.school_id
         WHERE sm.user_id = $1 AND sm.status = 'active'`,
        [user.id]
      );

      const token = signToken({ userId: user.id, email: user.email, isSuperAdmin: user.is_super_admin || false });
      res.json({
        token,
        user: {
          id: user.id, email: user.email,
          first_name: user.first_name, last_name: user.last_name,
          phone: user.phone, photo_url: user.photo_url,
          is_super_admin: user.is_super_admin || false,
          memberships: membershipResult.rows,
        },
      });
    } catch (dbErr) {
      next(dbErr);
    }
  })(req, res, next);
});

// Google OAuth - initiate
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false,
}));

// Google OAuth - callback
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login?error=google_failed' }),
  (req: Request, res: Response) => {
    const user = req.user as any;
    const token = signToken({ userId: user.id, email: user.email });
    // Redirect to client with token
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    res.redirect(`${clientUrl}/auth/callback?token=${token}`);
  }
);

// Get current user
router.get('/me', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.photo_url,
              u.check_in_method, u.notification_prefs, u.google_id, u.is_super_admin,
              json_agg(json_build_object('school_id', sm.school_id, 'role', sm.role, 'school_name', s.name, 'school_slug', s.slug, 'car_number', sm.car_number, 'school_timezone', s.timezone)) FILTER (WHERE sm.id IS NOT NULL) AS memberships
       FROM users u
       LEFT JOIN school_memberships sm ON sm.user_id = u.id AND sm.status = 'active'
       LEFT JOIN schools s ON s.id = sm.school_id
       WHERE u.id = $1
       GROUP BY u.id`,
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

export default router;
