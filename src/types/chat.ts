export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface MessageReaction {
  emoji: string;
  username: string;
}

export interface ChatMessage {
  _id: string;
  room: string;
  senderId: string; // Unique User ID used for alignment comparison
  username: string;
  text: string;
  avatar?: string;
  attachmentUrl?: string;
  attachmentType?: 'image' | 'file';
  attachmentName?: string;
  status: MessageStatus;
  reactions?: MessageReaction[];
  createdAt: string;
}

export interface UserProfile {
  id: string; // Unique User ID
  name: string;
  avatar: string;
  status: 'online' | 'offline';
  role?: string;
}

export interface RoomUser {
  id: string;
  username: string;
  room: string;
  avatar: string;
  joinedAt: string;
}

export interface RoomMeta {
  name: string;
  onlineCount: number;
  messageCount: number;
}
