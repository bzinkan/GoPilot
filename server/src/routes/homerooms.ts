import { Router, Response, NextFunction } from 'express';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';
import pool from '../db';

const router = Router();

// List homerooms for a school
router.get('/schools/:schoolId/homerooms', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query(
      `SELECT h.*,
              u.first_name AS teacher_first_name, u.last_name AS teacher_last_name,
              COUNT(s.id)::int AS student_count
       FROM homerooms h
       LEFT JOIN users u ON u.id = h.teacher_id
       LEFT JOIN students s ON s.homeroom_id = h.id AND s.status = 'active'
       WHERE h.school_id = $1
       GROUP BY h.id, u.first_name, u.last_name
       ORDER BY h.grade, h.name`,
      [req.params.schoolId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// Create homeroom
router.post('/schools/:schoolId/homerooms', requireAuth, requireRole('admin'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, grade, room, teacherId } = req.body;
    if (!name || !grade) return res.status(400).json({ error: 'Name and grade are required' });

    const result = await pool.query(
      `INSERT INTO homerooms (school_id, teacher_id, name, grade, room)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.params.schoolId, teacherId || null, name, grade, room || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// Update homeroom
router.put('/homerooms/:id', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, grade, room, teacherId } = req.body;
    const result = await pool.query(
      `UPDATE homerooms SET
        name = COALESCE($1, name), grade = COALESCE($2, grade),
        room = COALESCE($3, room), teacher_id = COALESCE($4, teacher_id)
       WHERE id = $5 RETURNING *`,
      [name, grade, room, teacherId, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Homeroom not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// Delete homeroom
router.delete('/homerooms/:id', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await pool.query('UPDATE students SET homeroom_id = NULL WHERE homeroom_id = $1', [req.params.id]);
    await pool.query('DELETE FROM homerooms WHERE id = $1', [req.params.id]);
    res.json({ message: 'Homeroom deleted' });
  } catch (err) {
    next(err);
  }
});

// Assign students to homeroom
router.post('/homerooms/:id/assign', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { studentIds } = req.body;
    if (!Array.isArray(studentIds)) return res.status(400).json({ error: 'studentIds array required' });

    await pool.query(
      'UPDATE students SET homeroom_id = $1 WHERE id = ANY($2)',
      [req.params.id, studentIds]
    );
    res.json({ message: `${studentIds.length} students assigned` });
  } catch (err) {
    next(err);
  }
});

export default router;
