import mongoose from 'mongoose';
import dotenv from 'dotenv';
import SystemSettings from '../models/SystemSettings';

// Load environment variables
dotenv.config({ path: '.env.local' });

const INDIAN_HOLIDAYS = {
  '2024': [
    { name: 'Republic Day', date: '2024-01-26', type: 'national', category: 'gazetted', region: 'All India' },
    { name: 'Independence Day', date: '2024-08-15', type: 'national', category: 'gazetted', region: 'All India' },
    { name: 'Gandhi Jayanti', date: '2024-10-02', type: 'national', category: 'gazetted', region: 'All India' },
    { name: 'Makar Sankranti / Pongal', date: '2024-01-15', type: 'festival', category: 'festival', region: 'All India', isMajorFestival: true, travelLikely: true },
    { name: 'Holi', date: '2024-03-25', type: 'festival', category: 'gazetted', region: 'All India', isMajorFestival: true, travelLikely: true },
    { name: 'Good Friday', date: '2024-03-29', type: 'festival', category: 'gazetted', region: 'All India' },
    { name: 'Eid ul-Fitr', date: '2024-04-11', type: 'festival', category: 'gazetted', region: 'All India', isMajorFestival: true, travelLikely: true },
    { name: 'Diwali', date: '2024-11-01', type: 'festival', category: 'gazetted', region: 'All India', isMajorFestival: true, travelLikely: true },
    { name: 'Christmas', date: '2024-12-25', type: 'festival', category: 'gazetted', region: 'All India', isMajorFestival: true, travelLikely: true },
  ],
  '2025': [
    { name: 'Republic Day', date: '2025-01-26', type: 'national', category: 'gazetted', region: 'All India' },
    { name: 'Independence Day', date: '2025-08-15', type: 'national', category: 'gazetted', region: 'All India' },
    { name: 'Gandhi Jayanti', date: '2025-10-02', type: 'national', category: 'gazetted', region: 'All India' },
    { name: 'Makar Sankranti / Pongal', date: '2025-01-14', type: 'festival', category: 'festival', region: 'All India', isMajorFestival: true, travelLikely: true },
    { name: 'Holi', date: '2025-03-14', type: 'festival', category: 'gazetted', region: 'All India', isMajorFestival: true, travelLikely: true },
    { name: 'Good Friday', date: '2025-04-18', type: 'festival', category: 'gazetted', region: 'All India' },
    { name: 'Eid ul-Fitr', date: '2025-03-31', type: 'festival', category: 'gazetted', region: 'All India', isMajorFestival: true, travelLikely: true },
    { name: 'Diwali', date: '2025-10-20', type: 'festival', category: 'gazetted', region: 'All India', isMajorFestival: true, travelLikely: true },
    { name: 'Christmas', date: '2025-12-25', type: 'festival', category: 'gazetted', region: 'All India', isMajorFestival: true, travelLikely: true },
  ],
  '2026': [
    { name: 'Republic Day', date: '2026-01-26', type: 'national', category: 'gazetted', region: 'All India' },
    { name: 'Independence Day', date: '2026-08-15', type: 'national', category: 'gazetted', region: 'All India' },
    { name: 'Gandhi Jayanti', date: '2026-10-02', type: 'national', category: 'gazetted', region: 'All India' },
    { name: 'Makar Sankranti / Pongal', date: '2026-01-14', type: 'festival', category: 'festival', region: 'All India', isMajorFestival: true, travelLikely: true },
    { name: 'Holi', date: '2026-03-04', type: 'festival', category: 'gazetted', region: 'All India', isMajorFestival: true, travelLikely: true },
    { name: 'Good Friday', date: '2026-04-03', type: 'festival', category: 'gazetted', region: 'All India' },
    { name: 'Eid ul-Fitr', date: '2026-03-20', type: 'festival', category: 'gazetted', region: 'All India', isMajorFestival: true, travelLikely: true },
    { name: 'Diwali', date: '2026-10-09', type: 'festival', category: 'gazetted', region: 'All India', isMajorFestival: true, travelLikely: true },
    { name: 'Christmas', date: '2026-12-25', type: 'festival', category: 'gazetted', region: 'All India', isMajorFestival: true, travelLikely: true },
  ],
};

async function run() {
  if (!process.env.MONGODB_URI) {
    console.error('Error: MONGODB_URI not found in .env.local');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = new SystemSettings({ updatedBy: 'system' });
    }

    if (!settings.holidays) {
      settings.holidays = new Map();
    }

    Object.keys(INDIAN_HOLIDAYS).forEach(year => {
      settings.holidays.set(year, INDIAN_HOLIDAYS[year as keyof typeof INDIAN_HOLIDAYS]);
    });

    await settings.save();
    console.log('Successfully seeded Indian holidays into SystemSettings');

  } catch (error) {
    console.error('Error seeding holidays:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

run();
