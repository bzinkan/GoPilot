import pool from '../db';

export async function generateCarNumber(schoolId: number): Promise<string> {
  const countResult = await pool.query(
    "SELECT COUNT(*) FROM school_memberships WHERE school_id = $1 AND role = 'parent'",
    [schoolId]
  );
  const parentCount = parseInt(countResult.rows[0].count, 10);
  const min = parentCount >= 1000 ? 1000 : 100;
  const max = parentCount >= 1000 ? 9999 : 999;

  for (let attempt = 0; attempt < 20; attempt++) {
    const code = String(Math.floor(Math.random() * (max - min + 1)) + min);
    // Check both tables for collisions
    const existing1 = await pool.query(
      'SELECT id FROM school_memberships WHERE school_id = $1 AND car_number = $2',
      [schoolId, code]
    );
    const existing2 = await pool.query(
      'SELECT id FROM family_groups WHERE school_id = $1 AND car_number = $2',
      [schoolId, code]
    );
    if (existing1.rows.length === 0 && existing2.rows.length === 0) return code;
  }
  throw new Error('Failed to generate unique car number');
}

export async function generateFamilyGroupNumber(schoolId: number): Promise<string> {
  const countResult = await pool.query(
    'SELECT COUNT(*) FROM family_groups WHERE school_id = $1',
    [schoolId]
  );
  const groupCount = parseInt(countResult.rows[0].count, 10);
  const min = groupCount >= 900 ? 1000 : 100;
  const max = groupCount >= 900 ? 9999 : 999;

  for (let attempt = 0; attempt < 20; attempt++) {
    const code = String(Math.floor(Math.random() * (max - min + 1)) + min);
    // Check both tables for collisions
    const existing1 = await pool.query(
      'SELECT id FROM family_groups WHERE school_id = $1 AND car_number = $2',
      [schoolId, code]
    );
    const existing2 = await pool.query(
      'SELECT id FROM school_memberships WHERE school_id = $1 AND car_number = $2',
      [schoolId, code]
    );
    if (existing1.rows.length === 0 && existing2.rows.length === 0) return code;
  }
  throw new Error('Failed to generate unique family group number');
}

export async function generateStudentCode(schoolId: number): Promise<string> {
  // Determine code length based on student count at this school
  const countResult = await pool.query(
    'SELECT COUNT(*) FROM students WHERE school_id = $1',
    [schoolId]
  );
  const studentCount = parseInt(countResult.rows[0].count, 10);
  const min = studentCount >= 1000 ? 1000 : 100;
  const max = studentCount >= 1000 ? 9999 : 999;

  for (let attempt = 0; attempt < 20; attempt++) {
    const code = String(Math.floor(Math.random() * (max - min + 1)) + min);
    const existing = await pool.query(
      'SELECT id FROM students WHERE school_id = $1 AND student_code = $2',
      [schoolId, code]
    );
    if (existing.rows.length === 0) return code;
  }
  throw new Error('Failed to generate unique student code');
}
