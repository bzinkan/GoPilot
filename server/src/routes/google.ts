import { Router } from 'express';
import { google } from 'googleapis';
import bcrypt from 'bcryptjs';
import pool from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

const SCOPES = [
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.rosters.readonly',
  'https://www.googleapis.com/auth/admin.directory.user.readonly',
  'https://www.googleapis.com/auth/admin.directory.orgunit.readonly',
];

function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_CLASSROOM_CALLBACK_URL || 'http://localhost:3001/api/google/callback'
  );
}

// GET /api/google/auth-url?schoolId=123
// Returns the Google OAuth URL for Classroom access
router.get('/auth-url', requireAuth, (req: AuthRequest, res) => {
  const schoolId = req.query.schoolId;
  if (!schoolId) return res.status(400).json({ error: 'schoolId required' });

  const oauth2Client = createOAuth2Client();
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    state: JSON.stringify({ schoolId, userId: req.user.userId }),
  });

  res.json({ url });
});

// GET /api/google/callback?code=...&state=...
// Handles the OAuth callback from Google
router.get('/callback', async (req, res) => {
  const { code, state } = req.query;
  if (!code || !state) return res.status(400).send('Missing code or state');

  let parsed: { schoolId: string; userId: string };
  try {
    parsed = JSON.parse(state as string);
  } catch {
    return res.status(400).send('Invalid state');
  }

  const oauth2Client = createOAuth2Client();
  try {
    const { tokens } = await oauth2Client.getToken(code as string);

    await pool.query(
      `INSERT INTO google_tokens (school_id, user_id, access_token, refresh_token, token_expiry, scopes)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (school_id, user_id) DO UPDATE SET
         access_token = EXCLUDED.access_token,
         refresh_token = COALESCE(EXCLUDED.refresh_token, google_tokens.refresh_token),
         token_expiry = EXCLUDED.token_expiry,
         scopes = EXCLUDED.scopes,
         updated_at = NOW()`,
      [
        parsed.schoolId,
        parsed.userId,
        tokens.access_token,
        tokens.refresh_token,
        tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        SCOPES.join(' '),
      ]
    );

    // Redirect back to the client setup page
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    res.redirect(`${clientUrl}/setup?googleConnected=true`);
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    res.redirect(`${clientUrl}/setup?googleError=true`);
  }
});

// GET /api/google/status?schoolId=123
// Check if Google Classroom is connected for this school
router.get('/status', requireAuth, async (req: AuthRequest, res) => {
  const schoolId = req.query.schoolId;
  if (!schoolId) return res.status(400).json({ error: 'schoolId required' });

  try {
    const result = await pool.query(
      'SELECT id, token_expiry FROM google_tokens WHERE school_id = $1 AND user_id = $2',
      [schoolId, req.user.userId]
    );
    res.json({ connected: result.rows.length > 0 });
  } catch (err) {
    console.error('Google status check error:', err);
    res.status(500).json({ error: 'Failed to check status' });
  }
});

// Helper: get an authenticated OAuth2 client for a school/user
async function getAuthenticatedClient(schoolId: number, userId: number) {
  const result = await pool.query(
    'SELECT access_token, refresh_token, token_expiry FROM google_tokens WHERE school_id = $1 AND user_id = $2',
    [schoolId, userId]
  );
  if (result.rows.length === 0) throw new Error('Not connected to Google');

  const { access_token, refresh_token, token_expiry } = result.rows[0];
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    access_token,
    refresh_token,
    expiry_date: token_expiry ? new Date(token_expiry).getTime() : undefined,
  });

  // Listen for token refresh
  oauth2Client.on('tokens', async (tokens) => {
    await pool.query(
      `UPDATE google_tokens SET access_token = $1, token_expiry = $2, updated_at = NOW()
       WHERE school_id = $3 AND user_id = $4`,
      [
        tokens.access_token,
        tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        schoolId,
        userId,
      ]
    );
  });

  return oauth2Client;
}

// GET /api/google/courses?schoolId=123
// List Google Classroom courses for the connected user
router.get('/courses', requireAuth, async (req: AuthRequest, res) => {
  const schoolId = Number(req.query.schoolId);
  if (!schoolId) return res.status(400).json({ error: 'schoolId required' });

  try {
    const auth = await getAuthenticatedClient(schoolId, req.user.userId);
    const classroom = google.classroom({ version: 'v1', auth });

    const response = await classroom.courses.list({
      teacherId: 'me',
      courseStates: ['ACTIVE'],
      pageSize: 100,
    });

    const courses = (response.data.courses || []).map(c => ({
      id: c.id,
      name: c.name,
      section: c.section,
      description: c.descriptionHeading,
      room: c.room,
    }));

    res.json(courses);
  } catch (err: any) {
    console.error('Google courses error:', err.message);
    if (err.message === 'Not connected to Google') {
      return res.status(401).json({ error: 'Not connected to Google Classroom' });
    }
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// POST /api/google/sync
// Sync students from selected Google Classroom courses into the school
// Body: { schoolId, courses: [{ courseId, homeroomId? }] }
router.post('/sync', requireAuth, async (req: AuthRequest, res) => {
  const { schoolId, courses } = req.body;
  if (!schoolId || !courses?.length) {
    return res.status(400).json({ error: 'schoolId and courses required' });
  }

  try {
    const auth = await getAuthenticatedClient(Number(schoolId), req.user.userId);
    const classroom = google.classroom({ version: 'v1', auth });

    let totalImported = 0;
    const results: any[] = [];

    for (const { courseId, homeroomId, grade } of courses) {
      // Get course info
      const courseRes = await classroom.courses.get({ id: courseId });
      const courseName = courseRes.data.name || 'Unknown';

      // Get students in this course
      const studentsRes = await classroom.courses.students.list({
        courseId,
        pageSize: 100,
      });

      const classroomStudents = studentsRes.data.students || [];
      let imported = 0;

      for (const cs of classroomStudents) {
        const profile = cs.profile;
        if (!profile?.name) continue;

        const firstName = profile.name.givenName || '';
        const lastName = profile.name.familyName || '';
        const email = profile.emailAddress || '';

        // Check if student already exists by email
        const existing = await pool.query(
          'SELECT id FROM students WHERE school_id = $1 AND email = $2',
          [schoolId, email]
        );

        if (existing.rows.length > 0) {
          // Update homeroom if provided
          if (homeroomId || grade) {
            await pool.query(
              'UPDATE students SET homeroom_id = COALESCE($1, homeroom_id), grade = COALESCE($3, grade) WHERE id = $2',
              [homeroomId || null, existing.rows[0].id, grade || null]
            );
          }
        } else {
          // Insert new student
          await pool.query(
            `INSERT INTO students (school_id, first_name, last_name, email, homeroom_id, dismissal_type, grade)
             VALUES ($1, $2, $3, $4, $5, 'car', $6)`,
            [schoolId, firstName, lastName, email, homeroomId || null, grade || null]
          );
          imported++;
        }
      }

      totalImported += imported;
      results.push({
        courseId,
        courseName,
        studentsFound: classroomStudents.length,
        studentsImported: imported,
      });
    }

    res.json({ totalImported, results });
  } catch (err: any) {
    console.error('Google sync error:', err.message);
    if (err.message === 'Not connected to Google') {
      return res.status(401).json({ error: 'Not connected to Google Classroom' });
    }
    res.status(500).json({ error: 'Failed to sync students' });
  }
});

// GET /api/google/workspace/orgunits?schoolId=123
// List organizational units from Google Workspace (usually organized by grade)
router.get('/workspace/orgunits', requireAuth, async (req: AuthRequest, res) => {
  const schoolId = Number(req.query.schoolId);
  if (!schoolId) return res.status(400).json({ error: 'schoolId required' });

  try {
    const auth = await getAuthenticatedClient(schoolId, req.user.userId);
    const admin = google.admin({ version: 'directory_v1', auth });

    const response = await admin.orgunits.list({
      customerId: 'my_customer',
      type: 'all',
    });

    const orgunits = (response.data.organizationUnits || []).map(ou => ({
      orgUnitPath: ou.orgUnitPath,
      name: ou.name,
      description: ou.description || '',
      parentOrgUnitPath: ou.parentOrgUnitPath || '/',
    }));

    res.json(orgunits);
  } catch (err: any) {
    console.error('Google Workspace orgunits error:', err.message);
    if (err.message === 'Not connected to Google') {
      return res.status(401).json({ error: 'Not connected to Google' });
    }
    res.status(500).json({ error: 'Failed to fetch org units. Make sure you have admin access.' });
  }
});

// GET /api/google/workspace/users?schoolId=123&orgUnitPath=/Students
// List users from a specific org unit (or all users if no orgUnitPath)
router.get('/workspace/users', requireAuth, async (req: AuthRequest, res) => {
  const schoolId = Number(req.query.schoolId);
  if (!schoolId) return res.status(400).json({ error: 'schoolId required' });

  const orgUnitPath = req.query.orgUnitPath as string || '/';

  try {
    const auth = await getAuthenticatedClient(schoolId, req.user.userId);
    const admin = google.admin({ version: 'directory_v1', auth });

    const allUsers: any[] = [];
    let pageToken: string | undefined;

    do {
      const response: any = await admin.users.list({
        customer: 'my_customer',
        query: `orgUnitPath='${orgUnitPath}'`,
        maxResults: 500,
        pageToken,
        projection: 'basic',
      });

      const users = (response.data.users || []).map((u: any) => ({
        id: u.id,
        email: u.primaryEmail,
        firstName: u.name?.givenName || '',
        lastName: u.name?.familyName || '',
        orgUnitPath: u.orgUnitPath || '/',
        suspended: u.suspended || false,
      }));

      allUsers.push(...users);
      pageToken = response.data.nextPageToken;
    } while (pageToken);

    res.json(allUsers);
  } catch (err: any) {
    console.error('Google Workspace users error:', err.message);
    if (err.message === 'Not connected to Google') {
      return res.status(401).json({ error: 'Not connected to Google' });
    }
    res.status(500).json({ error: 'Failed to fetch users. Make sure you have admin access.' });
  }
});

// POST /api/google/workspace/import
// Import selected Workspace users as students
// Body: { schoolId, users: [{ email, firstName, lastName, grade?, orgUnitPath }] }
router.post('/workspace/import', requireAuth, async (req: AuthRequest, res) => {
  const { schoolId, users } = req.body;
  if (!schoolId || !users?.length) {
    return res.status(400).json({ error: 'schoolId and users required' });
  }

  try {
    let imported = 0;
    let updated = 0;

    for (const u of users) {
      const existing = await pool.query(
        'SELECT id FROM students WHERE school_id = $1 AND email = $2',
        [schoolId, u.email]
      );

      if (existing.rows.length > 0) {
        // Update grade if provided
        if (u.grade) {
          await pool.query(
            'UPDATE students SET grade = $1 WHERE id = $2',
            [u.grade, existing.rows[0].id]
          );
        }
        updated++;
      } else {
        await pool.query(
          `INSERT INTO students (school_id, first_name, last_name, email, grade, dismissal_type)
           VALUES ($1, $2, $3, $4, $5, 'car')`,
          [schoolId, u.firstName, u.lastName, u.email, u.grade || null]
        );
        imported++;
      }
    }

    res.json({ imported, updated, total: users.length });
  } catch (err: any) {
    console.error('Google Workspace import error:', err.message);
    res.status(500).json({ error: 'Failed to import users' });
  }
});

// POST /api/google/workspace/import-orgunits
// Bulk import all users from multiple org units at once
// Body: { schoolId, orgunits: [{ orgUnitPath, grade }] }
router.post('/workspace/import-orgunits', requireAuth, async (req: AuthRequest, res) => {
  const { schoolId, orgunits } = req.body;
  if (!schoolId || !orgunits?.length) {
    return res.status(400).json({ error: 'schoolId and orgunits required' });
  }

  try {
    const auth = await getAuthenticatedClient(Number(schoolId), req.user.userId);
    const admin = google.admin({ version: 'directory_v1', auth });

    let totalImported = 0;
    let totalUpdated = 0;
    const details: any[] = [];

    for (const { orgUnitPath, grade } of orgunits) {
      const allUsers: any[] = [];
      let pageToken: string | undefined;

      do {
        const response: any = await admin.users.list({
          customer: 'my_customer',
          query: `orgUnitPath='${orgUnitPath}'`,
          maxResults: 500,
          pageToken,
          projection: 'basic',
        });
        const users = (response.data.users || []).filter((u: any) => !u.suspended);
        allUsers.push(...users);
        pageToken = response.data.nextPageToken;
      } while (pageToken);

      let imported = 0;
      let updated = 0;

      for (const u of allUsers) {
        const email = u.primaryEmail;
        const firstName = u.name?.givenName || '';
        const lastName = u.name?.familyName || '';

        const existing = await pool.query(
          'SELECT id FROM students WHERE school_id = $1 AND email = $2',
          [schoolId, email]
        );

        if (existing.rows.length > 0) {
          if (grade) {
            await pool.query('UPDATE students SET grade = $1 WHERE id = $2', [grade, existing.rows[0].id]);
          }
          updated++;
        } else {
          await pool.query(
            `INSERT INTO students (school_id, first_name, last_name, email, grade, dismissal_type)
             VALUES ($1, $2, $3, $4, $5, 'car')`,
            [schoolId, firstName, lastName, email, grade || null]
          );
          imported++;
        }
      }

      totalImported += imported;
      totalUpdated += updated;
      details.push({ orgUnitPath, grade: grade || null, usersFound: allUsers.length, imported, updated });
    }

    res.json({ imported: totalImported, updated: totalUpdated, total: totalImported + totalUpdated, details });
  } catch (err: any) {
    console.error('Google Workspace bulk import error:', err.message);
    if (err.message === 'Not connected to Google') {
      return res.status(401).json({ error: 'Not connected to Google' });
    }
    res.status(500).json({ error: 'Failed to import from org units' });
  }
});

// POST /api/google/workspace/import-staff
// Import Workspace users as staff (teachers/office staff)
// Body: { schoolId, users: [{ email, firstName, lastName }], role }
router.post('/workspace/import-staff', requireAuth, async (req: AuthRequest, res) => {
  const { schoolId, users, role } = req.body;
  if (!schoolId || !users?.length || !role) {
    return res.status(400).json({ error: 'schoolId, users, and role required' });
  }
  if (!['teacher', 'office_staff'].includes(role)) {
    return res.status(400).json({ error: 'role must be teacher or office_staff' });
  }

  try {
    let imported = 0;
    let updated = 0;

    for (const u of users) {
      // Find or create user
      let userId: number;
      const existing = await pool.query('SELECT id FROM users WHERE email = $1', [u.email]);

      if (existing.rows.length > 0) {
        userId = existing.rows[0].id;
        await pool.query(
          'UPDATE users SET first_name = COALESCE($1, first_name), last_name = COALESCE($2, last_name) WHERE id = $3',
          [u.firstName, u.lastName, userId]
        );
        updated++;
      } else {
        const userResult = await pool.query(
          `INSERT INTO users (email, first_name, last_name) VALUES ($1, $2, $3) RETURNING id`,
          [u.email, u.firstName, u.lastName]
        );
        userId = userResult.rows[0].id;
        imported++;
      }

      // Add school membership
      await pool.query(
        `INSERT INTO school_memberships (user_id, school_id, role, status)
         VALUES ($1, $2, $3, 'active')
         ON CONFLICT (user_id, school_id, role) DO UPDATE SET status = 'active'`,
        [userId, schoolId, role]
      );
    }

    res.json({ imported, updated, total: users.length });
  } catch (err: any) {
    console.error('Google Workspace staff import error:', err.message);
    res.status(500).json({ error: 'Failed to import staff' });
  }
});

// DELETE /api/google/disconnect?schoolId=123
// Disconnect Google Classroom
router.delete('/disconnect', requireAuth, async (req: AuthRequest, res) => {
  const schoolId = req.query.schoolId;
  if (!schoolId) return res.status(400).json({ error: 'schoolId required' });

  try {
    await pool.query(
      'DELETE FROM google_tokens WHERE school_id = $1 AND user_id = $2',
      [schoolId, req.user.userId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Google disconnect error:', err);
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

export default router;
