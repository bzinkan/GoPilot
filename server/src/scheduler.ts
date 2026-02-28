import pool from './db';
import { Server as SocketServer } from 'socket.io';

let io: SocketServer | null = null;

export function startScheduler(socketIo: SocketServer) {
  io = socketIo;
  console.log('Dismissal scheduler started (checking every 60s)');

  // Check every 60 seconds
  setInterval(checkDismissalTimes, 60 * 1000);
  // Also check immediately on startup
  checkDismissalTimes();
}

async function checkDismissalTimes() {
  try {
    // Find schools where dismissal_time matches current time (HH:MM)
    // Compare using the school's timezone
    const result = await pool.query(`
      SELECT id, name, dismissal_time, timezone
      FROM schools
      WHERE status = 'active'
        AND dismissal_time IS NOT NULL
        AND TO_CHAR(NOW() AT TIME ZONE COALESCE(timezone, 'America/New_York'), 'HH24:MI') = TO_CHAR(dismissal_time, 'HH24:MI')
    `);

    for (const school of result.rows) {
      await autoStartDismissal(school.id, school.name);
    }
  } catch (err) {
    console.error('Scheduler error:', err);
  }
}

async function autoStartDismissal(schoolId: number, schoolName: string) {
  try {
    // Get school's timezone to determine "today" in local time
    const schoolResult = await pool.query('SELECT timezone FROM schools WHERE id = $1', [schoolId]);
    const timezone = schoolResult.rows[0]?.timezone || 'America/New_York';

    // Get today's date in the school's timezone
    const localDateResult = await pool.query(
      "SELECT (NOW() AT TIME ZONE $1)::date as local_date",
      [timezone]
    );
    const localDate = localDateResult.rows[0].local_date;

    // Check if session already exists for today (school's local date)
    const existing = await pool.query(
      "SELECT id, status FROM dismissal_sessions WHERE school_id = $1 AND date = $2",
      [schoolId, localDate]
    );

    if (existing.rows.length > 0) {
      const session = existing.rows[0];
      // Only auto-start if session is pending (not already active/completed)
      if (session.status === 'pending') {
        await pool.query(
          "UPDATE dismissal_sessions SET status = 'active', started_at = NOW() WHERE id = $1",
          [session.id]
        );
        console.log(`Auto-started dismissal for ${schoolName} (session ${session.id})`);
        io?.to(`school:${schoolId}`).emit('dismissal:started', { sessionId: session.id });
      }
    } else {
      // Create and immediately start a new session
      const newSession = await pool.query(
        `INSERT INTO dismissal_sessions (school_id, date, status, started_at)
         VALUES ($1, $2, 'active', NOW()) RETURNING id`,
        [schoolId, localDate]
      );
      console.log(`Auto-created and started dismissal for ${schoolName} (session ${newSession.rows[0].id})`);
      io?.to(`school:${schoolId}`).emit('dismissal:started', { sessionId: newSession.rows[0].id });
    }
  } catch (err) {
    console.error(`Failed to auto-start dismissal for school ${schoolId}:`, err);
  }
}
