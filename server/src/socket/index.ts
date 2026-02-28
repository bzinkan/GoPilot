import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { verifyToken } from '../config/jwt';
import pool from '../db';

export function setupSocket(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));

    try {
      const payload = verifyToken(token);
      socket.data.userId = payload.userId;
      socket.data.email = payload.email;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.data.userId;
    console.log(`Socket connected: user ${userId}`);

    // Client tells us which rooms to join
    socket.on('join:school', async ({ schoolId, role, homeroomId }) => {
      console.log(`[Socket] User ${userId} joining as ${role}, school=${schoolId}, homeroom=${homeroomId}`);
      if (role === 'admin' || role === 'office_staff') {
        socket.join(`school:${schoolId}:office`);
        console.log(`[Socket] User ${userId} joined room: school:${schoolId}:office`);
      }
      if (role === 'teacher' && homeroomId) {
        socket.join(`school:${schoolId}:teacher:${homeroomId}`);
        console.log(`[Socket] User ${userId} joined room: school:${schoolId}:teacher:${homeroomId}`);
      }
      if (role === 'parent') {
        socket.join(`school:${schoolId}:parent:${userId}`);
        console.log(`[Socket] User ${userId} joined room: school:${schoolId}:parent:${userId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: user ${userId}`);
    });
  });

  return io;
}
