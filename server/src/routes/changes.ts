import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import pool from '../db';

const router = Router();

// Submit change request (parent)
router.post('/sessions/:id/changes', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { studentId, fromType, toType, busRoute, note } = req.body;
    if (!studentId || !fromType || !toType) {
      return res.status(400).json({ error: 'studentId, fromType, and toType are required' });
    }

    const result = await pool.query(
      `INSERT INTO dismissal_changes (session_id, student_id, requested_by, from_type, to_type, bus_route, note)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.params.id, studentId, req.user.userId, fromType, toType, busRoute || null, note || null]
    );

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      const session = await pool.query('SELECT school_id FROM dismissal_sessions WHERE id = $1', [req.params.id]);
      const schoolId = session.rows[0]?.school_id;
      if (schoolId) {
        io.to(`school:${schoolId}:office`).emit('change:requested', result.rows[0]);
      }
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// List change requests
router.get('/sessions/:id/changes', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query(
      `SELECT dc.*, s.first_name AS student_first_name, s.last_name AS student_last_name,
              u.first_name AS requester_first_name, u.last_name AS requester_last_name
       FROM dismissal_changes dc
       JOIN students s ON s.id = dc.student_id
       JOIN users u ON u.id = dc.requested_by
       WHERE dc.session_id = $1
       ORDER BY dc.created_at DESC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// Approve/reject change
router.put('/changes/:id', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    const result = await pool.query(
      `UPDATE dismissal_changes SET status = $1, reviewed_by = $2, reviewed_at = NOW()
       WHERE id = $3 RETURNING *`,
      [status, req.user.userId, req.params.id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Change request not found' });

    const change = result.rows[0];

    // If approved, update the student's dismissal type
    if (status === 'approved') {
      await pool.query(
        'UPDATE students SET dismissal_type = $1, bus_route = $2 WHERE id = $3',
        [change.to_type, change.bus_route, change.student_id]
      );
    }

    // Emit to parent
    const io = req.app.get('io');
    if (io) {
      const session = await pool.query('SELECT school_id FROM dismissal_sessions WHERE id = $1', [change.session_id]);
      const schoolId = session.rows[0]?.school_id;
      if (schoolId) {
        io.to(`school:${schoolId}:parent:${change.requested_by}`).emit('change:resolved', change);
      }
    }

    res.json(change);
  } catch (err) {
    next(err);
  }
});

export default router;
