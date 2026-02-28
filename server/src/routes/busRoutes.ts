import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import pool from '../db';

const router = Router();

// List bus routes
router.get('/schools/:schoolId/bus-routes', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query(
      `SELECT br.*, COUNT(s.id)::int AS student_count
       FROM bus_routes br
       LEFT JOIN students s ON s.bus_route = br.route_number AND s.school_id = br.school_id AND s.status = 'active'
       WHERE br.school_id = $1
       GROUP BY br.id
       ORDER BY br.route_number`,
      [req.params.schoolId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// Create bus route
router.post('/schools/:schoolId/bus-routes', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { routeNumber, departureTime } = req.body;
    if (!routeNumber) return res.status(400).json({ error: 'Route number required' });

    const result = await pool.query(
      `INSERT INTO bus_routes (school_id, route_number, departure_time)
       VALUES ($1, $2, $3) RETURNING *`,
      [req.params.schoolId, routeNumber, departureTime || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// Update bus route status
router.put('/bus-routes/:id', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, departureTime } = req.body;
    const result = await pool.query(
      `UPDATE bus_routes SET status = COALESCE($1, status), departure_time = COALESCE($2, departure_time)
       WHERE id = $3 RETURNING *`,
      [status, departureTime, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Bus route not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

export default router;
