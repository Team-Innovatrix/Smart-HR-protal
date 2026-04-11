import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessage extends Document {
  senderId: string; // clerkUserId
  receiverId: string; // clerkUserId (for 1:1)
  groupId: string; // teamId (for group chat)
  content: string;
  type: 'text' | 'image' | 'file';
  isRead: boolean;
  createdAt: Date;
}

const ChatMessageSchema: Schema = new Schema({
  senderId: { type: String, required: true },
  receiverId: { type: String },
  groupId: { type: String },
  content: { type: String, required: true },
  type: { type: String, enum: ['text', 'image', 'file'], default: 'text' },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Index for faster queries
ChatMessageSchema.index({ senderId: 1, receiverId: 1 });
ChatMessageSchema.index({ groupId: 1 });

export default mongoose.models.ChatMessage || mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
