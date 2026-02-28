import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../config/jwt';
import pool from '../db';

export interface AuthRequest extends Request {
  user?: any;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireRole(...roles: string[]) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });

    const schoolId = req.params.schoolId || req.body.schoolId;
    if (!schoolId) return res.status(400).json({ error: 'School ID required' });

    try {
      // Super admins bypass role checks
      if (req.user.isSuperAdmin) {
        req.user.role = 'admin';
        req.user.schoolId = Number(schoolId);
        return next();
      }

      const result = await pool.query(
        `SELECT role FROM school_memberships
         WHERE user_id = $1 AND school_id = $2 AND role = ANY($3) AND status = 'active'`,
        [req.user.userId, schoolId, roles]
      );

      if (result.rows.length === 0) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      req.user.role = result.rows[0].role;
      req.user.schoolId = Number(schoolId);
      next();
    } catch (err) {
      next(err);
    }
  };
}

export async function requireSuperAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });

  try {
    const result = await pool.query(
      'SELECT is_super_admin FROM users WHERE id = $1',
      [req.user.userId]
    );
    if (!result.rows[0]?.is_super_admin) {
      return res.status(403).json({ error: 'Super admin access required' });
    }
    next();
  } catch (err) {
    next(err);
  }
}
