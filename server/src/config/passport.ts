import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import pool from '../db';

// Local strategy (email + password)
passport.use(
  new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
      try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];
        if (!user) return done(null, false, { message: 'Invalid email or password' });
        if (!user.password_hash) return done(null, false, { message: 'Please use Google sign-in for this account' });
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return done(null, false, { message: 'Invalid email or password' });
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// Google OAuth strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback',
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(null, false, { message: 'No email from Google' });

          // Check if user exists by google_id
          let result = await pool.query('SELECT * FROM users WHERE google_id = $1', [profile.id]);
          let user = result.rows[0];

          if (!user) {
            // Check if user exists by email (link accounts)
            result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
            user = result.rows[0];
            if (user) {
              // Link Google ID to existing account
              await pool.query('UPDATE users SET google_id = $1, photo_url = $2 WHERE id = $3', [
                profile.id, profile.photos?.[0]?.value, user.id,
              ]);
              user.google_id = profile.id;
            } else {
              // Create new user
              const insertResult = await pool.query(
                `INSERT INTO users (email, google_id, first_name, last_name, photo_url)
                 VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                [email, profile.id, profile.name?.givenName || '', profile.name?.familyName || '', profile.photos?.[0]?.value]
              );
              user = insertResult.rows[0];
            }
          }

          return done(null, user);
        } catch (err) {
          return done(err as Error);
        }
      }
    )
  );
}

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    done(null, result.rows[0] || null);
  } catch (err) {
    done(err);
  }
});

export default passport;
