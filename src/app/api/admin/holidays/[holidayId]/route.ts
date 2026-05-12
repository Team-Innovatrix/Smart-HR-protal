import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SystemSettings from '@/models/SystemSettings';
import { isAdminSessionValid } from '@/lib/adminCookieAuth';

export async function PUT(
  request: NextRequest,
  context: any
) {
  try {
    if (!await isAdminSessionValid(request)) {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
    }

    await connectDB();

    const { holidayId } = context?.params || {};
    const body = await request.json();
    const { name, date, year } = body;

    // Parse holiday ID (format: year_index)
    const [yearKey, indexStr] = holidayId.split('_');
    const index = parseInt(indexStr);

    if (!yearKey || isNaN(index)) {
      return NextResponse.json(
        { success: false, error: 'Invalid holiday ID' },
        { status: 400 }
      );
    }

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

    // Get system settings
    const settings = await SystemSettings.findOne();
    if (!settings || !settings.holidays) {
      return NextResponse.json(
        { success: false, error: 'Holiday not found' },
        { status: 404 }
      );
    }

    const yearHolidays = settings.holidays.get(yearKey) || [];
    if (index >= yearHolidays.length || index < 0) {
      return NextResponse.json(
        { success: false, error: 'Holiday not found' },
        { status: 404 }
      );
    }

    // Check if another holiday already exists for this date (excluding current holiday)
    const duplicateHoliday = yearHolidays.find((h: any, i: number) => h.date === date && i !== index);
    if (duplicateHoliday) {
      return NextResponse.json(
        { success: false, error: 'Holiday already exists for this date' },
        { status: 400 }
      );
    }

    // Update holiday
    yearHolidays[index] = {
      name: name.trim(),
      date: date
    };

    // Sort holidays by date (string comparison works for YYYY-MM-DD format)
    yearHolidays.sort((a: any, b: any) => a.date.localeCompare(b.date));

    // Update the holidays object
    settings.holidays.set(yearKey, yearHolidays);
    settings.updatedBy = 'admin@innovatrix.com';
    settings.updatedAt = new Date();

    // Mark the holidays field as modified
    settings.markModified('holidays');

    await settings.save();

    // Return the updated holiday in the expected format
    const updatedHoliday = {
      _id: holidayId,
      name: name.trim(),
      date: date,
      year: year,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: updatedHoliday,
      message: 'Holiday updated successfully'
    });

  } catch (error) {
    console.error('Holiday update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update holiday' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: any
) {
  try {
    if (!await isAdminSessionValid(request)) {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
    }

    await connectDB();

    const { holidayId } = context?.params || {};

    // Parse holiday ID (format: year_index)
    const [yearKey, indexStr] = holidayId.split('_');
    const index = parseInt(indexStr);

    if (!yearKey || isNaN(index)) {
      return NextResponse.json(
        { success: false, error: 'Invalid holiday ID' },
        { status: 400 }
      );
    }

    // Get system settings
    const settings = await SystemSettings.findOne();
    if (!settings || !settings.holidays) {
      return NextResponse.json(
        { success: false, error: 'Holiday not found' },
        { status: 404 }
      );
    }

    const yearHolidays = settings.holidays.get(yearKey) || [];
    if (index >= yearHolidays.length || index < 0) {
      return NextResponse.json(
        { success: false, error: 'Holiday not found' },
        { status: 404 }
      );
    }

    // Remove holiday from array
    yearHolidays.splice(index, 1);

    // Update the holidays Map
    settings.holidays.set(yearKey, yearHolidays);
    settings.updatedBy = 'admin@innovatrix.com';
    settings.updatedAt = new Date();

    // Mark the holidays field as modified
    settings.markModified('holidays');

    await settings.save();

    return NextResponse.json({
      success: true,
      message: 'Holiday deleted successfully'
    });

  } catch (error) {
    console.error('Holiday deletion error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete holiday' },
      { status: 500 }
    );
  }
}
