import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

import express from 'express';
import cors from 'cors';
import session from 'express-session';
import helmet from 'helmet';
import { createServer } from 'http';
import passport from './config/passport';
import { errorHandler } from './middleware/errorHandler';
import { setupSocket } from './socket';
import { startScheduler } from './scheduler';

// Routes
import healthRouter from './routes/health';
import authRouter from './routes/auth';
import schoolsRouter from './routes/schools';
import homeroomsRouter from './routes/homerooms';
import studentsRouter from './routes/students';
import usersRouter from './routes/users';
import pickupsRouter from './routes/pickups';
import dismissalRouter from './routes/dismissal';
import changesRouter from './routes/changes';
import busRoutesRouter from './routes/busRoutes';
import superAdminRouter from './routes/superAdmin';
import googleRouter from './routes/google';

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;

// Socket.IO
const io = setupSocket(httpServer);
app.set('io', io);

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'gopilot-session-secret',
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

// Mount routes
app.use('/api', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/schools', schoolsRouter);
app.use('/api', homeroomsRouter);   // /api/schools/:schoolId/homerooms & /api/homerooms/:id
app.use('/api', studentsRouter);    // /api/schools/:schoolId/students & /api/students/:id
app.use('/api', usersRouter);       // /api/me, /api/schools/:schoolId/parent-requests
app.use('/api', pickupsRouter);     // /api/students/:studentId/pickups, /api/schools/:schoolId/custody-alerts
app.use('/api', dismissalRouter);   // /api/schools/:schoolId/sessions, /api/sessions/:id/*, /api/queue/:id/*
app.use('/api', changesRouter);     // /api/sessions/:id/changes, /api/changes/:id
app.use('/api', busRoutesRouter);   // /api/schools/:schoolId/bus-routes
app.use('/api/super-admin', superAdminRouter);
app.use('/api/google', googleRouter);  // Google Classroom sync

// Error handler
app.use(errorHandler);

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startScheduler(io);
});
