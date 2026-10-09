# 💬 MERN Chat Application

A clean, responsive real-time chat application powered by the MERN architecture (Node.js, Express, MongoDB/Mongoose, and Socket.io).

## 📁 Project Architecture

```
mern-chat/
│
├── server/                    # BACKEND (Node.js & Express)
│   ├── models/                
│   │   └── Message.js         # Mongoose message schema
│   ├── .env                   # Environment variables
│   ├── package.json           # Backend dependencies
│   └── server.js              # Express + Socket.io server
│
└── client/                    # FRONTEND (HTML, CSS, JS)
    ├── index.html             # Login & Chat UI
    ├── style.css              # Styling
    └── script.js              # Socket.io client logic
```

## 🚀 How to Run Locally

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas URI)

### 2. Backend Setup
```bash
cd server
npm install
```

Configure `server/.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/mern_chat_db
CLIENT_ORIGIN=http://localhost:3000
```

Start the backend server:
```bash
npm run dev
# or: npm start
```
*Note: If MongoDB is not running, the server automatically uses in-memory persistence fallback for seamless local testing.*

### 3. Frontend Setup
Open `client/index.html` in any browser or serve it using any HTTP server:
```bash
cd client
npx serve .
# Or open client/index.html directly with Live Server
```

## ⚡ Socket.io Event Protocol

| Event | Direction | Payload | Description |
|---|---|---|---|
| `join_room` | Client ➔ Server | `{ username, room, avatar }` | Join specific room channel |
| `room_history` | Server ➔ Client | `Message[]` | Array of last 100 room messages |
| `send_message` | Client ➔ Server | `{ username, room, text, avatar }` | Send a new message to the room |
| `receive_message` | Server ➔ Client | `Message` | Broadcasted message to all clients in room |
| `typing` | Client ➔ Server | `{ username, room }` | Broadcast typing indicator |
| `stop_typing` | Client ➔ Server | `{ username, room }` | Dismiss typing indicator |
| `room_users` | Server ➔ Client | `{ room, users: User[] }` | Active online members in room |
| `add_reaction` | Client ➔ Server | `{ messageId, emoji, username, room }` | Toggle reaction on a message |
| `message_updated` | Server ➔ Client | `Message` | Updated message with reaction tally |

## 🛠️ REST API Endpoints

- `GET /api/health` - Server status and client count
- `GET /api/messages/:room` - Retrieve message history
- `POST /api/messages` - Post message via HTTP
- `GET /api/rooms` - List available rooms and member count
