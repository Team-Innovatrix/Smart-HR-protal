import mongoose, { Schema, Document } from 'mongoose';

export interface IJobVacancy extends Document {
  title: string;
  department: string;
  location: string;
  jobType: 'full-time' | 'part-time' | 'contract' | 'internship';
  description: string;
  requirements: string[];
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency: string;
  deadline?: Date;
  isActive: boolean;
  postedBy?: string; // Clerk user ID of the admin who posted
  createdAt: Date;
  updatedAt: Date;
}

const JobVacancySchema: Schema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    department: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    jobType: {
      type: String,
      enum: ['full-time', 'part-time', 'contract', 'internship'],
      required: true,
    },
    description: { type: String, required: true, minlength: 20 },
    requirements: [{ type: String, trim: true }],
    salaryMin: { type: Number, min: 0 },
    salaryMax: { type: Number, min: 0 },
    salaryCurrency: { type: String, default: 'INR' },
    deadline: { type: Date },
    isActive: { type: Boolean, default: true },
    postedBy: { type: String },
  },
  { timestamps: true }
);

JobVacancySchema.index({ isActive: 1, createdAt: -1 });
JobVacancySchema.index({ department: 1, jobType: 1 });

export default mongoose.models.JobVacancy ||
  mongoose.model<IJobVacancy>('JobVacancy', JobVacancySchema);
