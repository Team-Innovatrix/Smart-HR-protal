import mongoose, { Schema, Document } from 'mongoose';

export interface IJob extends Document {
  title: string;
  department: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  experience: 'entry' | 'mid' | 'senior' | 'lead';
  description: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  salary: {
    min: number;
    max: number;
    currency: string;
  };
  isActive: boolean;
  postedDate: Date;
  deadline?: Date;
  tags: string[];
  company: string;
  contactEmail: string;
  applicationCount: number;
}

const JobSchema: Schema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'internship'],
    required: true
  },
  experience: {
    type: String,
    enum: ['entry', 'mid', 'senior', 'lead'],
    required: true
  },
  description: {
    type: String,
    required: true,
    minlength: 50
  },
  requirements: [{
    type: String,
    required: true
  }],
  responsibilities: [{
    type: String,
    required: true
  }],
  benefits: [{
    type: String
  }],
  salary: {
    min: {
      type: Number,
      required: true
    },
    max: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  postedDate: {
    type: Date,
    default: Date.now
  },
  deadline: {
    type: Date
  },
  tags: [{
    type: String,
    trim: true
  }],
  company: {
    type: String,
    required: true,
    default: 'HR Dashboard'
  },
  contactEmail: {
    type: String,
    required: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  applicationCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Create indexes for better query performance
JobSchema.index({ title: 'text', description: 'text', department: 'text' });
JobSchema.index({ isActive: 1, postedDate: -1 });
JobSchema.index({ location: 1, type: 1, experience: 1 });

export default mongoose.models.Job || mongoose.model<IJob>('Job', JobSchema);
