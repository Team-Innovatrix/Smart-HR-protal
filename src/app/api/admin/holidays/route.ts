import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SystemSettings from '@/models/SystemSettings';
import { isAdminSessionValid } from '@/lib/adminCookieAuth';

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    if (!isAdminSessionValid(request)) { return NextResponse.json({ error: 'Access denied.' }, { status: 403 }); }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get system settings
    let settings = await SystemSettings.findOne();
    if (!settings) {
      // Create default settings if none exist
      settings = new SystemSettings({
        updatedBy: 'admin@innovatrix.com',
        holidays: new Map()
      });
      await settings.save();
    }

    // Get holidays for the specified year
    const yearKey = year || new Date().getFullYear().toString();
    const yearHolidays = settings.holidays?.get(yearKey) || [];
    
    // Convert to the expected format with _id for compatibility
    const holidays = yearHolidays.map((holiday: { name: string; date: string }, index: number) => ({
      _id: `${yearKey}_${index}`, // Generate a pseudo ID for compatibility
      name: holiday.name,
      date: holiday.date,
      year: parseInt(yearKey),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));

    // Sort by date (string comparison works for YYYY-MM-DD format)
    holidays.sort((a: { date: string }, b: { date: string }) => a.date.localeCompare(b.date));

    // Get available years from the holidays Map
    const availableYears = Array.from(settings.holidays?.keys() || [])
      .map((y: any) => parseInt(y))
      .sort((a, b) => b - a);

    // Add current and next year if not present
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    if (!availableYears.includes(currentYear)) {
      availableYears.unshift(currentYear);
    }
    if (!availableYears.includes(nextYear)) {
      availableYears.unshift(nextYear);
    }

    return NextResponse.json({
      success: true,
      data: {
        holidays,
        pagination: {
          page,
          limit,
          total: holidays.length,
          pages: Math.ceil(holidays.length / limit)
        },
        availableYears
      }
    });

  } catch (error) {
    console.error('Holidays fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch holidays' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    if (!isAdminSessionValid(request)) { return NextResponse.json({ error: 'Access denied.' }, { status: 403 }); }

    await connectDB();

    const body = await request.json();
    const { name, date, year } = body;

    // Validation
    if (!name || !date || !year) {
      return NextResponse.json(
        { success: false, error: 'Name, date, and year are required' },
        { status: 400 }
      );
    }

    // Validate year (current year or next year only)
    const currentYear = new Date().getFullYear();
    if (year < currentYear || year > currentYear + 1) {
      return NextResponse.json(
        { success: false, error: 'Year must be current year or next year only' },
        { status: 400 }
      );
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format. Please use YYYY-MM-DD format' },
        { status: 400 }
      );
    }

    // Get or create system settings
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = new SystemSettings({
        updatedBy: 'admin@innovatrix.com',
        holidays: new Map()
      });
    }

    // Initialize holidays Map if it doesn't exist
    if (!settings.holidays) {
      settings.holidays = new Map();
    }

    const yearKey = year.toString();
    const yearHolidays = settings.holidays.get(yearKey) || [];

    // Check if holiday already exists for this date
    const existingHoliday = yearHolidays.find((h: { date: string }) => h.date === date);
    if (existingHoliday) {
      return NextResponse.json(
        { success: false, error: 'Holiday already exists for this date' },
        { status: 400 }
      );
    }

    // Add new holiday
    yearHolidays.push({
      name: name.trim(),
      date: date
    });

    // Sort holidays by date (string comparison works for YYYY-MM-DD format)
    yearHolidays.sort((a: { date: string }, b: { date: string }) => a.date.localeCompare(b.date));

    // Update the holidays Map
    settings.holidays.set(yearKey, yearHolidays);
    settings.updatedBy = 'admin@innovatrix.com';
    settings.updatedAt = new Date();

    // Mark the holidays field as modified
    settings.markModified('holidays');

    await settings.save();

    // Return the created holiday in the expected format
    const createdHoliday = {
      _id: `${yearKey}_${yearHolidays.length - 1}`,
      name: name.trim(),
      date: date,
      year: year,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: createdHoliday,
      message: 'Holiday created successfully'
    });

  } catch (error) {
    console.error('Holiday creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create holiday' },
      { status: 500 }
    );
  }
}
