import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ChatMessage {
  _id: string;
  room: string;
  senderId: string; // Unique User ID
  username: string;
  text: string;
  avatar: string;
  attachmentUrl?: string;
  attachmentType?: 'image' | 'file';
  status: 'sent' | 'delivered' | 'read';
  reactions: Array<{ emoji: string; username: string }>;
  createdAt: string;
}

interface ConnectedUser {
  id: string;
  userId: string;
  username: string;
  room: string;
  avatar: string;
  joinedAt: string;
}

// In-memory data store with initial sample messages with unique senderIds
const messages: ChatMessage[] = [
  {
    _id: 'msg_init_1',
    room: 'general',
    senderId: 'user_taj_202',
    username: 'Taj',
    text: 'Hey everyone, welcome to the common room!',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Taj',
    status: 'read',
    reactions: [],
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    _id: 'msg_init_2',
    room: 'general',
    senderId: 'user_raj_101',
    username: 'Raj',
    text: 'Hey Taj! Good to see you in the room. Left-right alignment is working smoothly!',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Raj',
    status: 'read',
    reactions: [],
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    _id: 'msg_init_3',
    room: 'general',
    senderId: 'user_taj_202',
    username: 'Taj',
    text: 'Awesome! Real-time messaging with status indicators is live.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Taj',
    status: 'delivered',
    reactions: [],
    createdAt: new Date(Date.now() - 900000).toISOString(),
  },
];

const connectedUsers = new Map<string, ConnectedUser>();
const defaultRooms = ['general', 'tech-chat', 'random', 'help', 'showcase'];
const customRooms = new Set<string>();

async function startServer() {
  const app = express();
  const httpServer = createServer(app);

  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    transports: ['polling', 'websocket'],
    pingTimeout: 45000,
    pingInterval: 15000,
    allowEIO3: true,
  });

  app.use(cors());
  app.use(express.json());

  // Serve the standalone vanilla client from /mern-chat/client/ at /standalone
  const vanillaClientPath = path.resolve(__dirname, 'mern-chat', 'client');
  if (fs.existsSync(vanillaClientPath)) {
    app.use('/standalone', express.static(vanillaClientPath));
  }

  // --- REST API ENDPOINTS ---

  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      connectedClients: connectedUsers.size,
      totalMessages: messages.length,
      timestamp: new Date().toISOString(),
    });
  });

  // Get messages for room
  app.get('/api/messages/:room', (req: Request, res: Response) => {
    const room = req.params.room.toLowerCase();
    const roomMessages = messages.filter((m) => m.room === room).slice(-150);
    res.json(roomMessages);
  });

  // Post message via REST API
  app.post('/api/messages', (req: Request, res: Response) => {
    const { senderId, username, room = 'general', text, avatar = '👤', attachmentUrl, attachmentType } = req.body;
    if (!username || (!text && !attachmentUrl)) {
      return res.status(400).json({ error: 'Username and text or attachment are required' });
    }

    const normalizedRoom = String(room).toLowerCase().trim();
    const newMsg: ChatMessage = {
      _id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      room: normalizedRoom,
      senderId: senderId || 'user_anon_' + Math.random().toString(36).substring(2, 7),
      username: String(username).trim(),
      text: String(text || '').trim(),
      avatar: avatar || '👤',
      attachmentUrl,
      attachmentType,
      status: 'delivered',
      reactions: [],
      createdAt: new Date().toISOString(),
    };

    messages.push(newMsg);
    io.to(normalizedRoom).emit('receive_message', newMsg);
    res.status(201).json(newMsg);
  });

  // Get rooms list with active counts
  app.get('/api/rooms', (req: Request, res: Response) => {
    const allRoomNames = Array.from(new Set([...defaultRooms, ...customRooms]));
    const roomStats = allRoomNames.map((r) => {
      let count = 0;
      for (const u of connectedUsers.values()) {
        if (u.room === r) count++;
      }
      return {
        name: r,
        onlineCount: count,
        messageCount: messages.filter((m) => m.room === r).length,
      };
    });
    res.json(roomStats);
  });

  // API to return the files of the mern-chat project for the in-app explorer
  app.get('/api/project-files', (req: Request, res: Response) => {
    try {
      const baseDir = path.resolve(__dirname, 'mern-chat');
      const files: Record<string, string> = {};

      const readDirRecursive = (dir: string, relativePath: string = '') => {
        if (!fs.existsSync(dir)) return;
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          const rel = relativePath ? `${relativePath}/${entry.name}` : entry.name;
          if (entry.isDirectory()) {
            readDirRecursive(fullPath, rel);
          } else {
            files[rel] = fs.readFileSync(fullPath, 'utf-8');
          }
        }
      };

      readDirRecursive(baseDir);
      res.json(files);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({ error: 'Failed to read project files: ' + message });
    }
  });

  // --- SOCKET.IO REAL-TIME HANDLERS ---

  function broadcastRoomUsers(room: string) {
    const roomUsers: ConnectedUser[] = [];
    for (const u of connectedUsers.values()) {
      if (u.room === room) {
        roomUsers.push(u);
      }
    }
    io.to(room).emit('room_users', { room, users: roomUsers });
  }

  io.on('connection', (socket: Socket) => {
    // 1. Join room
    socket.on('join_room', ({ userId, username, room = 'general', avatar = '🤖' }) => {
      const normalizedRoom = (room || 'general').toLowerCase().trim();
      customRooms.add(normalizedRoom);

      // Leave previous room
      const existing = connectedUsers.get(socket.id);
      if (existing && existing.room) {
        socket.leave(existing.room);
        io.to(existing.room).emit('user_left', {
          username: existing.username,
          room: existing.room,
          timestamp: new Date().toISOString(),
        });
        broadcastRoomUsers(existing.room);
      }

      socket.join(normalizedRoom);
      const userObj: ConnectedUser = {
        id: socket.id,
        userId: userId || 'user_' + Math.random().toString(36).substring(2, 7),
        username: username || 'Guest',
        room: normalizedRoom,
        avatar: avatar || '🤖',
        joinedAt: new Date().toISOString(),
      };
      connectedUsers.set(socket.id, userObj);

      // Send room history
      const roomHistory = messages.filter((m) => m.room === normalizedRoom).slice(-150);
      socket.emit('room_history', roomHistory);

      // Broadcast user joined
      io.to(normalizedRoom).emit('user_joined', {
        userId: userObj.userId,
        username: userObj.username,
        room: normalizedRoom,
        avatar: userObj.avatar,
        timestamp: new Date().toISOString(),
      });

      broadcastRoomUsers(normalizedRoom);
    });

    // 2. Send message
    socket.on('send_message', ({ senderId, username, room = 'general', text, avatar = '👤', attachmentUrl, attachmentType, attachmentName }) => {
      if ((!text || !text.trim()) && !attachmentUrl) return;
      const normalizedRoom = (room || 'general').toLowerCase().trim();

      const newMsg: ChatMessage = {
        _id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        room: normalizedRoom,
        senderId: senderId || (connectedUsers.get(socket.id)?.userId || 'user_' + Math.random().toString(36).substring(2, 7)),
        username: username || (connectedUsers.get(socket.id)?.username || 'Guest'),
        text: (text || '').trim(),
        avatar: avatar || (connectedUsers.get(socket.id)?.avatar || '👤'),
        attachmentUrl,
        attachmentType,
        status: 'delivered',
        reactions: [],
        createdAt: new Date().toISOString(),
      };

      messages.push(newMsg);
      io.to(normalizedRoom).emit('receive_message', newMsg);
    });

    // 3. Typing indicator
    socket.on('typing', ({ username, room }) => {
      const normalizedRoom = (room || 'general').toLowerCase().trim();
      socket.to(normalizedRoom).emit('user_typing', { username, room: normalizedRoom });
    });

    socket.on('stop_typing', ({ username, room }) => {
      const normalizedRoom = (room || 'general').toLowerCase().trim();
      socket.to(normalizedRoom).emit('user_stop_typing', { username, room: normalizedRoom });
    });

    // 4. Reactions
    socket.on('add_reaction', ({ messageId, emoji, username, room }) => {
      const normalizedRoom = (room || 'general').toLowerCase().trim();
      const target = messages.find((m) => m._id === messageId);
      if (target) {
        if (!target.reactions) target.reactions = [];
        const existingIdx = target.reactions.findIndex(
          (r) => r.emoji === emoji && r.username === username
        );
        if (existingIdx > -1) {
          target.reactions.splice(existingIdx, 1);
        } else {
          target.reactions.push({ emoji, username });
        }
        io.to(normalizedRoom).emit('message_updated', target);
      }
    });

    // 5. Disconnect
    socket.on('disconnect', () => {
      const user = connectedUsers.get(socket.id);
      if (user) {
        connectedUsers.delete(socket.id);
        io.to(user.room).emit('user_left', {
          username: user.username,
          room: user.room,
          timestamp: new Date().toISOString(),
        });
        broadcastRoomUsers(user.room);
      }
    });
  });

  // --- VITE MIDDLEWARE / PRODUCTION CLIENT SERVING ---
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    app.use('*', async (req: Request, res: Response, next) => {
      const url = req.originalUrl;
      try {
        const indexPath = path.resolve(__dirname, 'index.html');
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: unknown) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server and Socket.io listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
