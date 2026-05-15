import mongoose from 'mongoose';

export interface IDocument extends mongoose.Document {
  title: string;
  category: 'hr-policy' | 'resume' | 'tax-form' | 'offer-letter' | 'general';
  fileType: string;
  fileSize: number;
  s3Url: string;
  s3Key: string;
  uploadedBy: string; // Clerk User ID
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['hr-policy', 'resume', 'tax-form', 'offer-letter', 'general'], 
    default: 'general' 
  },
  fileType: { type: String, required: true },
  fileSize: { type: Number, required: true },
  s3Url: { type: String, required: true },
  s3Key: { type: String, required: true },
  uploadedBy: { type: String, required: true, index: true },
  isPublic: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.models.Document || mongoose.model<IDocument>('Document', DocumentSchema);
