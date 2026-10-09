import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import Message from './models/Message.js';

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mern_chat_db';
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || '*';

// Setup Socket.io with CORS configuration
const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

// In-memory fallback message storage when MongoDB is not connected
let isMongoConnected = false;
const inMemoryMessages = [];
const connectedUsers = new Map(); // socket.id -> { username, room, avatar, joinedAt }

// Attempt to connect to MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => {
    isMongoConnected = true;
    console.log('✅ Connected to MongoDB successfully.');
  })
  .catch((err) => {
    console.warn('⚠️  MongoDB connection error:', err.message);
    console.log('ℹ️  Running in-memory fallback for messages. (Start local mongod or set MONGO_URI in .env for persistent database storage).');
  });

// --- REST API ROUTES ---

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mongoConnected: isMongoConnected,
    connectedClients: connectedUsers.size,
    timestamp: new Date().toISOString(),
  });
});

// Get message history for a specific room
app.get('/api/messages/:room', async (req, res) => {
  const room = req.params.room.toLowerCase();
  try {
    if (isMongoConnected) {
      const messages = await Message.find({ room }).sort({ createdAt: 1 }).limit(100);
      return res.json(messages);
    } else {
      const messages = inMemoryMessages.filter((m) => m.room === room).slice(-100);
      return res.json(messages);
    }
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to retrieve message history' });
  }
});

// Post a message via REST API
app.post('/api/messages', async (req, res) => {
  const { username, room = 'general', text, avatar = '' } = req.body;
  if (!username || !text) {
    return res.status(400).json({ error: 'Username and text are required' });
  }

  const normalizedRoom = room.toLowerCase();

  try {
    let savedMessage;
    if (isMongoConnected) {
      savedMessage = await Message.create({
        username,
        room: normalizedRoom,
        text,
        avatar,
        reactions: [],
      });
    } else {
      savedMessage = {
        _id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        username,
        room: normalizedRoom,
        text,
        avatar,
        reactions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      inMemoryMessages.push(savedMessage);
    }

    // Broadcast message to room listeners
    io.to(normalizedRoom).emit('receive_message', savedMessage);
    res.status(201).json(savedMessage);
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ error: 'Failed to post message' });
  }
});

// Get available rooms and active user counts
app.get('/api/rooms', (req, res) => {
  const defaultRooms = ['general', 'tech-chat', 'random', 'help'];
  const activeRooms = new Set(defaultRooms);

  for (const user of connectedUsers.values()) {
    if (user.room) activeRooms.add(user.room);
  }

  const roomList = Array.from(activeRooms).map((roomName) => {
    let userCount = 0;
    for (const u of connectedUsers.values()) {
      if (u.room === roomName) userCount++;
    }
    return { name: roomName, onlineCount: userCount };
  });

  res.json(roomList);
});

// --- SOCKET.IO REAL-TIME LOGIC ---

io.on('connection', (socket) => {
  console.log(`⚡ Socket connected: ${socket.id}`);

  // 1. User joins a chat room
  socket.on('join_room', async ({ username, room = 'general', avatar = '' }) => {
    const normalizedRoom = room.toLowerCase().trim() || 'general';

    // Leave previous room if any
    const previousUser = connectedUsers.get(socket.id);
    if (previousUser && previousUser.room) {
      socket.leave(previousUser.room);
      io.to(previousUser.room).emit('user_left', {
        username: previousUser.username,
        room: previousUser.room,
        timestamp: new Date(),
      });
      broadcastRoomUsers(previousUser.room);
    }

    // Join new room
    socket.join(normalizedRoom);
    connectedUsers.set(socket.id, {
      id: socket.id,
      username: username || 'Anonymous',
      room: normalizedRoom,
      avatar: avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${username || socket.id}`,
      joinedAt: new Date(),
    });

    console.log(`👤 ${username} joined #${normalizedRoom}`);

    // Fetch and send message history for this room
    try {
      let history = [];
      if (isMongoConnected) {
        history = await Message.find({ room: normalizedRoom }).sort({ createdAt: 1 }).limit(100);
      } else {
        history = inMemoryMessages.filter((m) => m.room === normalizedRoom).slice(-100);
      }
      socket.emit('room_history', history);
    } catch (err) {
      console.error('Failed to load room history:', err);
    }

    // Broadcast system message to everyone in the room
    io.to(normalizedRoom).emit('user_joined', {
      username,
      room: normalizedRoom,
      avatar: connectedUsers.get(socket.id)?.avatar,
      timestamp: new Date(),
    });

    // Send updated active users list to the room
    broadcastRoomUsers(normalizedRoom);
  });

  // 2. User sends a chat message
  socket.on('send_message', async ({ username, room = 'general', text, avatar = '' }) => {
    if (!text || !text.trim()) return;

    const normalizedRoom = room.toLowerCase().trim();
    const cleanText = text.trim();

    try {
      let messageDoc;
      if (isMongoConnected) {
        messageDoc = await Message.create({
          username,
          room: normalizedRoom,
          text: cleanText,
          avatar,
          reactions: [],
        });
      } else {
        messageDoc = {
          _id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
          username,
          room: normalizedRoom,
          text: cleanText,
          avatar,
          reactions: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        inMemoryMessages.push(messageDoc);
      }

      // Broadcast the persisted message to all clients in the room
      io.to(normalizedRoom).emit('receive_message', messageDoc);
    } catch (error) {
      console.error('Socket error saving message:', error);
      socket.emit('error_message', { message: 'Could not send message.' });
    }
  });

  // 3. User is typing
  socket.on('typing', ({ username, room }) => {
    const normalizedRoom = (room || 'general').toLowerCase();
    socket.to(normalizedRoom).emit('user_typing', { username, room: normalizedRoom });
  });

  // 4. User stopped typing
  socket.on('stop_typing', ({ username, room }) => {
    const normalizedRoom = (room || 'general').toLowerCase();
    socket.to(normalizedRoom).emit('user_stop_typing', { username, room: normalizedRoom });
  });

  // 5. Message reaction
  socket.on('add_reaction', async ({ messageId, emoji, username, room }) => {
    const normalizedRoom = (room || 'general').toLowerCase();

    if (isMongoConnected) {
      try {
        const msg = await Message.findById(messageId);
        if (msg) {
          const existingIndex = msg.reactions.findIndex(
            (r) => r.emoji === emoji && r.username === username
          );
          if (existingIndex > -1) {
            msg.reactions.splice(existingIndex, 1); // Toggle off
          } else {
            msg.reactions.push({ emoji, username });
          }
          await msg.save();
          io.to(normalizedRoom).emit('message_updated', msg);
        }
      } catch (err) {
        console.error('Error updating reaction in Mongo:', err);
      }
    } else {
      const msg = inMemoryMessages.find((m) => m._id === messageId);
      if (msg) {
        if (!msg.reactions) msg.reactions = [];
        const existingIndex = msg.reactions.findIndex(
          (r) => r.emoji === emoji && r.username === username
        );
        if (existingIndex > -1) {
          msg.reactions.splice(existingIndex, 1);
        } else {
          msg.reactions.push({ emoji, username });
        }
        io.to(normalizedRoom).emit('message_updated', msg);
      }
    }
  });

  // 6. User disconnects
  socket.on('disconnect', () => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      connectedUsers.delete(socket.id);
      console.log(`🔌 ${user.username} disconnected`);

      io.to(user.room).emit('user_left', {
        username: user.username,
        room: user.room,
        timestamp: new Date(),
      });

      broadcastRoomUsers(user.room);
    }
  });
});

// Helper: Broadcast list of users currently connected to a specific room
function broadcastRoomUsers(room) {
  const usersInRoom = [];
  for (const user of connectedUsers.values()) {
    if (user.room === room) {
      usersInRoom.push({
        id: user.id,
        username: user.username,
        avatar: user.avatar,
      });
    }
  }
  io.to(room).emit('room_users', { room, users: usersInRoom });
}

// Start HTTP + Socket.io Server
server.listen(PORT, () => {
  console.log(`🚀 MERN Chat Server listening on port ${PORT}`);
  console.log(`📡 WebSocket ready on port ${PORT}`);
});
