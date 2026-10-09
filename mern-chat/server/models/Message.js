import mongoose from 'mongoose';

/**
 * Message Schema for MERN Chat application
 * Stores chat messages per room with timestamps, sender username, and optional reactions
 */
const messageSchema = new mongoose.Schema(
  {
    room: {
      type: String,
      required: [true, 'Room identifier is required'],
      trim: true,
      index: true,
      default: 'general',
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      trim: true,
    },
    text: {
      type: String,
      required: [true, 'Message text cannot be empty'],
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    avatar: {
      type: String,
      default: '',
    },
    reactions: [
      {
        emoji: { type: String, required: true },
        username: { type: String, required: true },
      },
    ],
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

// Indexes for fast history retrieval sorted by timestamp
messageSchema.index({ room: 1, createdAt: 1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;
