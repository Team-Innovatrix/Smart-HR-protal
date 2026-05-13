import mongoose, { Schema, Document } from 'mongoose';

export interface ISeniorityLevel extends Document {
  name: string;
  order: number;
  description?: string;
  isActive: boolean;
}

export interface IPosition extends Document {
  name: string;
  description?: string;
  seniorityLevel?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDepartment extends Document {
  name: string;
  description?: string;
  positions: IPosition[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrgStructure extends Document {
  seniorityLevels: ISeniorityLevel[];
  departments: IDepartment[];
  createdAt: Date;
  updatedAt: Date;
}

// Seniority Level Schema
const SeniorityLevelSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
    unique: true
  },
  order: {
    type: Number,
    required: true,
    unique: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 200
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Position Schema (nested in department)
const PositionSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  seniorityLevel: {
    type: String,
    trim: true,
    maxlength: 50,
    enum: ['Entry', 'Junior', 'Associate', 'Mid', 'Senior', 'Lead', 'Specialist', 'Manager', 'Director', 'Executive']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Department Schema
const DepartmentSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
    unique: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  positions: [PositionSchema],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Main OrgStructure Schema
const OrgStructureSchema: Schema = new Schema({
  seniorityLevels: [SeniorityLevelSchema],
  departments: [DepartmentSchema]
}, {
  timestamps: true
});

// Create indexes for better query performance
SeniorityLevelSchema.index({ isActive: 1 });

// Note: DepartmentSchema name field already has unique: true in schema definition
DepartmentSchema.index({ isActive: 1 });
DepartmentSchema.index({ 'positions.name': 1 });

PositionSchema.index({ name: 1 });
PositionSchema.index({ isActive: 1 });

export default mongoose.models.OrgStructure || mongoose.model<IOrgStructure>('OrgStructure', OrgStructureSchema);
