import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import pool from '../db';

const router = Router();

// List authorized pickups for a student
router.get('/students/:studentId/pickups', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query(
      `SELECT * FROM authorized_pickups WHERE student_id = $1 AND status != 'revoked' ORDER BY name`,
      [req.params.studentId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// Add authorized pickup
router.post('/students/:studentId/pickups', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, relationship, phone } = req.body;
    if (!name || !relationship) return res.status(400).json({ error: 'Name and relationship required' });

    const result = await pool.query(
      `INSERT INTO authorized_pickups (student_id, added_by, name, relationship, phone)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.params.studentId, req.user.userId, name, relationship, phone || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// Approve/reject pickup
router.put('/pickups/:id', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    const result = await pool.query(
      'UPDATE authorized_pickups SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Pickup not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// Delete pickup
router.delete('/pickups/:id', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await pool.query("UPDATE authorized_pickups SET status = 'revoked' WHERE id = $1", [req.params.id]);
    res.json({ message: 'Pickup authorization revoked' });
  } catch (err) {
    next(err);
  }
});

// List custody alerts for a school
router.get('/schools/:schoolId/custody-alerts', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query(
      `SELECT ca.*, s.first_name AS student_first_name, s.last_name AS student_last_name
       FROM custody_alerts ca
       JOIN students s ON s.id = ca.student_id
       WHERE s.school_id = $1 AND ca.active = true
       ORDER BY ca.created_at DESC`,
      [req.params.schoolId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// Create custody alert
router.post('/students/:studentId/custody-alerts', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { personName, alertType, notes, courtOrder } = req.body;
    if (!personName || !alertType) return res.status(400).json({ error: 'Person name and alert type required' });

    const result = await pool.query(
      `INSERT INTO custody_alerts (student_id, person_name, alert_type, notes, court_order, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.params.studentId, personName, alertType, notes || null, courtOrder || null, req.user.userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

export default router;
