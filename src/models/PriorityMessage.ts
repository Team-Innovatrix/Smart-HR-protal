import mongoose, { Schema, Document } from 'mongoose';

export interface IPriorityMessage extends Document {
  message: string;
  senderName: string;
  senderId: string;
  createdAt: Date;
  expiresAt: Date;
}

const PriorityMessageSchema = new Schema<IPriorityMessage>({
  message: { type: String, required: true },
  senderName: { type: String, required: true },
  senderId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true }
}, {
  timestamps: true
});

export default mongoose.models.PriorityMessage || mongoose.model<IPriorityMessage>('PriorityMessage', PriorityMessageSchema);
