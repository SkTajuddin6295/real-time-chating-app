/**
 * MERN Chat - Client-side Socket.io Logic
 * Handles real-time messaging, rooms, presence, and UI interactions
 */

// Application State
const state = {
  socket: null,
  currentUser: {
    username: '',
    avatar: '🤖',
    room: 'general',
  },
  messages: [],
  onlineUsers: [],
  soundEnabled: true,
  typingTimeout: null,
};

// DOM Element References
const loginScreen = document.getElementById('login-screen');
const chatScreen = document.getElementById('chat-screen');
const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username-input');
const roomSelect = document.getElementById('room-select');
const customRoomInput = document.getElementById('custom-room-input');
const avatarOptions = document.querySelectorAll('.avatar-option');

const connectionStatus = document.getElementById('connection-status');
const currentUserNameEl = document.getElementById('current-user-name');
const currentUserAvatarEl = document.getElementById('current-user-avatar');
const currentRoomBadgeEl = document.getElementById('current-room-badge');
const roomListEl = document.getElementById('room-list');
const onlineUsersListEl = document.getElementById('online-users-list');
const onlineCountEl = document.getElementById('online-count');
const soundToggleBtn = document.getElementById('sound-toggle');
const soundIconEl = document.getElementById('sound-icon');
const leaveRoomBtn = document.getElementById('leave-room-btn');

const activeRoomTitle = document.getElementById('active-room-title');
const activeRoomSubtitle = document.getElementById('active-room-subtitle');
const welcomeRoomName = document.getElementById('welcome-room-name');
const messageSearch = document.getElementById('message-search');
const clearChatBtn = document.getElementById('clear-chat-btn');
const messagesContainer = document.getElementById('messages-container');
const messagesList = document.getElementById('messages-list');
const typingIndicatorBar = document.getElementById('typing-indicator-bar');
const typingTextEl = document.getElementById('typing-text');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const quickEmojiBtns = document.querySelectorAll('.quick-emoji-btn');
const addRoomBtn = document.getElementById('add-room-btn');

// --- 1. INITIALIZATION & SETUP ---

function init() {
  setupEventListeners();
  // Check if Socket.io library is loaded
  if (typeof io !== 'undefined') {
    initSocketConnection();
  } else {
    console.error('Socket.io client library not loaded.');
  }
}

// Initialize Socket.io connection to current host / server
function initSocketConnection() {
  // Connect to the same origin or default port 5000 / 3000
  const socketUrl = window.location.origin;
  state.socket = io(socketUrl, {
    transports: ['websocket', 'polling'],
  });

  state.socket.on('connect', () => {
    updateConnectionStatus(true);
    console.log('✅ Connected to Socket.io server with ID:', state.socket.id);
    // If user already logged in (e.g. reconnection), rejoin room
    if (state.currentUser.username) {
      joinRoom(state.currentUser.room);
    }
  });

  state.socket.on('disconnect', () => {
    updateConnectionStatus(false);
    console.log('❌ Disconnected from Socket.io server');
  });

  // Real-time Event Listeners
  state.socket.on('room_history', handleRoomHistory);
  state.socket.on('receive_message', handleReceiveMessage);
  state.socket.on('user_joined', handleUserJoined);
  state.socket.on('user_left', handleUserLeft);
  state.socket.on('room_users', handleRoomUsers);
  state.socket.on('user_typing', handleUserTyping);
  state.socket.on('user_stop_typing', handleUserStopTyping);
  state.socket.on('message_updated', handleMessageUpdated);
}

function updateConnectionStatus(isConnected) {
  if (isConnected) {
    connectionStatus.className = 'connection-status';
    connectionStatus.innerHTML = '<span class="status-dot"></span><span>Online</span>';
  } else {
    connectionStatus.className = 'connection-status offline';
    connectionStatus.innerHTML = '<span class="status-dot"></span><span>Reconnecting...</span>';
  }
}

// --- 2. USER LOGIN & ROOM JOINING ---

function setupEventListeners() {
  // Avatar selection
  avatarOptions.forEach((btn) => {
    btn.addEventListener('click', () => {
      avatarOptions.forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      state.currentUser.avatar = btn.innerText;
    });
  });

  // Room dropdown change
  roomSelect.addEventListener('change', (e) => {
    if (e.target.value === '__custom__') {
      customRoomInput.classList.remove('hidden');
      customRoomInput.focus();
    } else {
      customRoomInput.classList.add('hidden');
    }
  });

  // Login form submit
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = usernameInput.value.trim();
    if (!username) return;

    let room = roomSelect.value;
    if (room === '__custom__') {
      room = customRoomInput.value.trim().toLowerCase() || 'general';
    }

    state.currentUser.username = username;
    state.currentUser.room = room;

    // Switch to Chat Screen
    loginScreen.classList.add('hidden');
    chatScreen.classList.remove('hidden');

    // Update UI profile
    currentUserNameEl.textContent = state.currentUser.username;
    currentUserAvatarEl.textContent = state.currentUser.avatar;
    currentRoomBadgeEl.textContent = `# ${state.currentUser.room}`;

    // Join room over socket
    joinRoom(room);
  });

  // Message submission
  messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    sendMessage();
  });

  // Enter to send, Shift+Enter for new line
  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    } else {
      emitTyping();
    }
  });

  // Emoji quick buttons
  quickEmojiBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      messageInput.value += btn.getAttribute('data-emoji');
      messageInput.focus();
    });
  });

  // Channel room clicks
  roomListEl.addEventListener('click', (e) => {
    const roomItem = e.target.closest('.room-item');
    if (!roomItem) return;
    const targetRoom = roomItem.getAttribute('data-room');
    if (targetRoom && targetRoom !== state.currentUser.room) {
      switchRoom(targetRoom);
    }
  });

  // Add room prompt
  addRoomBtn.addEventListener('click', () => {
    const newRoom = prompt('Enter new room name:');
    if (newRoom && newRoom.trim()) {
      const sanitized = newRoom.trim().toLowerCase().replace(/\s+/g, '-');
      addRoomToList(sanitized);
      switchRoom(sanitized);
    }
  });

  // Sound toggle
  soundToggleBtn.addEventListener('click', () => {
    state.soundEnabled = !state.soundEnabled;
    soundIconEl.textContent = state.soundEnabled ? '🔔' : '🔕';
    soundToggleBtn.innerHTML = `<span id="sound-icon">${state.soundEnabled ? '🔔' : '🔕'}</span> Sound ${state.soundEnabled ? 'On' : 'Off'}`;
  });

  // Leave room / Switch user
  leaveRoomBtn.addEventListener('click', () => {
    if (confirm('Leave current chat session?')) {
      loginScreen.classList.remove('hidden');
      chatScreen.classList.add('hidden');
      state.currentUser.username = '';
      messagesList.innerHTML = '';
      state.messages = [];
    }
  });

  // Search filter
  messageSearch.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    renderFilteredMessages(query);
  });

  // Clear chat screen locally
  clearChatBtn.addEventListener('click', () => {
    messagesList.innerHTML = '';
    state.messages = [];
  });
}

function joinRoom(room) {
  state.currentUser.room = room;
  activeRoomTitle.textContent = `# ${room}`;
  welcomeRoomName.textContent = room;
  currentRoomBadgeEl.textContent = `# ${room}`;

  // Update active state in room list
  document.querySelectorAll('.room-item').forEach((item) => {
    if (item.getAttribute('data-room') === room) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Ensure room item exists in the sidebar list
  addRoomToList(room);

  // Emit Socket.io join_room
  state.socket.emit('join_room', {
    username: state.currentUser.username,
    room: state.currentUser.room,
    avatar: state.currentUser.avatar,
  });
}

function switchRoom(newRoom) {
  messagesList.innerHTML = '';
  state.messages = [];
  joinRoom(newRoom);
}

function addRoomToList(roomName) {
  const existing = document.querySelector(`.room-item[data-room="${roomName}"]`);
  if (!existing) {
    const li = document.createElement('li');
    li.className = 'room-item';
    li.setAttribute('data-room', roomName);
    li.innerHTML = `<span class="hash">#</span><span class="room-name">${roomName}</span>`;
    roomListEl.appendChild(li);
  }
}

// --- 3. SENDING & RECEIVING MESSAGES ---

function sendMessage() {
  const text = messageInput.value.trim();
  if (!text) return;

  const messagePayload = {
    username: state.currentUser.username,
    room: state.currentUser.room,
    text: text,
    avatar: state.currentUser.avatar,
  };

  // Emit send_message to server
  state.socket.emit('send_message', messagePayload);

  // Clear input
  messageInput.value = '';
  emitStopTyping();
}

function handleReceiveMessage(message) {
  state.messages.push(message);
  renderMessage(message);
  scrollToBottom();

  // Play audio chime if sent by someone else
  if (message.username !== state.currentUser.username) {
    playNotificationSound();
  }
}

function handleRoomHistory(history) {
  messagesList.innerHTML = '';
  state.messages = history || [];
  state.messages.forEach((msg) => renderMessage(msg));
  scrollToBottom();
}

function renderMessage(msg) {
  const isMe = msg.username === state.currentUser.username;
  const timeFormatted = formatTime(msg.createdAt || Date.now());

  const row = document.createElement('div');
  row.className = `message-row ${isMe ? 'me' : 'other'}`;
  row.id = `msg-${msg._id}`;

  const reactionsHtml = renderReactionsHTML(msg);

  row.innerHTML = `
    <div class="message-avatar">${escapeHtml(msg.avatar || '👤')}</div>
    <div class="message-content">
      <div class="message-meta">
        <span class="sender-name">${escapeHtml(msg.username)}</span>
        <span class="timestamp">${timeFormatted}</span>
      </div>
      <div class="message-bubble">${escapeHtml(msg.text)}</div>
      <div class="message-reactions">
        ${reactionsHtml}
        <button class="reaction-pill add-reaction-btn" data-id="${msg._id}" title="React">➕</button>
      </div>
    </div>
  `;

  // Attach reaction event listener
  const addReactBtn = row.querySelector('.add-reaction-btn');
  addReactBtn.addEventListener('click', () => {
    const emoji = prompt('Choose reaction emoji (👍, ❤️, 🔥, 😂, 🚀):', '👍');
    if (emoji) {
      state.socket.emit('add_reaction', {
        messageId: msg._id,
        emoji: emoji.trim(),
        username: state.currentUser.username,
        room: state.currentUser.room,
      });
    }
  });

  messagesList.appendChild(row);
}

function renderReactionsHTML(msg) {
  if (!msg.reactions || msg.reactions.length === 0) return '';
  // Group by emoji
  const counts = {};
  const usersByEmoji = {};
  msg.reactions.forEach((r) => {
    counts[r.emoji] = (counts[r.emoji] || 0) + 1;
    if (!usersByEmoji[r.emoji]) usersByEmoji[r.emoji] = [];
    usersByEmoji[r.emoji].push(r.username);
  });

  return Object.keys(counts)
    .map((emoji) => {
      const hasMyReaction = usersByEmoji[emoji].includes(state.currentUser.username);
      return `
      <span class="reaction-pill ${hasMyReaction ? 'reacted' : ''}" title="${usersByEmoji[emoji].join(', ')}">
        <span>${emoji}</span>
        <span class="count">${counts[emoji]}</span>
      </span>
    `;
    })
    .join('');
}

function handleMessageUpdated(updatedMessage) {
  const index = state.messages.findIndex((m) => m._id === updatedMessage._id);
  if (index > -1) {
    state.messages[index] = updatedMessage;
  }
  const el = document.getElementById(`msg-${updatedMessage._id}`);
  if (el) {
    const reactionsContainer = el.querySelector('.message-reactions');
    if (reactionsContainer) {
      reactionsContainer.innerHTML = `
        ${renderReactionsHTML(updatedMessage)}
        <button class="reaction-pill add-reaction-btn" data-id="${updatedMessage._id}" title="React">➕</button>
      `;
      // Re-bind reaction button
      reactionsContainer.querySelector('.add-reaction-btn').addEventListener('click', () => {
        const emoji = prompt('Choose reaction emoji (👍, ❤️, 🔥, 😂, 🚀):', '👍');
        if (emoji) {
          state.socket.emit('add_reaction', {
            messageId: updatedMessage._id,
            emoji: emoji.trim(),
            username: state.currentUser.username,
            room: state.currentUser.room,
          });
        }
      });
    }
  }
}

// --- 4. SYSTEM NOTIFICATIONS & PRESENCE ---

function handleUserJoined(data) {
  renderSystemNotification(`${data.username} joined #${data.room}`);
}

function handleUserLeft(data) {
  renderSystemNotification(`${data.username} left #${data.room}`);
}

function renderSystemNotification(text) {
  const div = document.createElement('div');
  div.className = 'system-message';
  div.textContent = text;
  messagesList.appendChild(div);
  scrollToBottom();
}

function handleRoomUsers(data) {
  state.onlineUsers = data.users || [];
  onlineCountEl.textContent = state.onlineUsers.length;
  activeRoomSubtitle.textContent = `${state.onlineUsers.length} member${state.onlineUsers.length === 1 ? '' : 's'} online`;

  onlineUsersListEl.innerHTML = '';
  state.onlineUsers.forEach((user) => {
    const li = document.createElement('li');
    li.className = 'user-item';
    li.innerHTML = `
      <span class="avatar">${escapeHtml(user.avatar || '👤')}</span>
      <span class="username">${escapeHtml(user.username)} ${user.username === state.currentUser.username ? '(you)' : ''}</span>
      <span class="status-indicator"></span>
    `;
    onlineUsersListEl.appendChild(li);
  });
}

// --- 5. TYPING INDICATOR ---

function emitTyping() {
  if (!state.currentUser.username) return;
  state.socket.emit('typing', {
    username: state.currentUser.username,
    room: state.currentUser.room,
  });

  clearTimeout(state.typingTimeout);
  state.typingTimeout = setTimeout(() => {
    emitStopTyping();
  }, 2000);
}

function emitStopTyping() {
  clearTimeout(state.typingTimeout);
  state.socket.emit('stop_typing', {
    username: state.currentUser.username,
    room: state.currentUser.room,
  });
}

function handleUserTyping(data) {
  if (data.username !== state.currentUser.username) {
    typingTextEl.textContent = `${data.username} is typing...`;
    typingIndicatorBar.classList.add('visible');
  }
}

function handleUserStopTyping(data) {
  typingIndicatorBar.classList.remove('visible');
}

// --- 6. UTILITY FUNCTIONS ---

function scrollToBottom() {
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function formatTime(isoOrTimestamp) {
  const date = new Date(isoOrTimestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(string) {
  if (!string) return '';
  return String(string)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderFilteredMessages(query) {
  messagesList.innerHTML = '';
  const filtered = state.messages.filter((m) =>
    m.text.toLowerCase().includes(query) || m.username.toLowerCase().includes(query)
  );
  filtered.forEach((msg) => renderMessage(msg));
}

// Synthesized notification chime via Web Audio API
function playNotificationSound() {
  if (!state.soundEnabled) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (err) {
    // Ignore audio permission/context restriction
  }
}

// Start client app when DOM is ready
document.addEventListener('DOMContentLoaded', init);
