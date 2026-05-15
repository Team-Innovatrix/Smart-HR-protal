export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Lead from '@/models/Lead';
import SystemSettings from '@/models/SystemSettings';
import { createLastDaysDateQuery } from '@/lib/dateQueryUtils';
import { emailService } from '@/lib/emailService';

export async function POST(request: NextRequest) {
  try {
    // Connect to MongoDB
    await connectDB();

    const body = await request.json();
    
    // Extract form data
    const {
      firstName,
      lastName,
      email,
      phone,
      company,
      service,
      message
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !service || !message) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Validate service selection
    const validServices = ['product-development', 'gtm-growth', 'people-ops', 'custom', 'consultation'];
    if (!validServices.includes(service)) {
      return NextResponse.json(
        { success: false, message: 'Please select a valid service' },
        { status: 400 }
      );
    }

    // Get system timezone for consistent date calculations
    const systemSettings = await SystemSettings.findOne();
    const systemTimezone = systemSettings?.general?.timezone || 'UTC';

    // Check if lead already exists (same email and service within last 30 days)
    const existingLead = await Lead.findOne({
      email: email.toLowerCase(),
      service,
      createdAt: createLastDaysDateQuery(30, systemTimezone),
      isActive: true
    });

    if (existingLead) {
      return NextResponse.json(
        { success: false, message: 'You have already submitted an inquiry for this service recently. Please wait 30 days or contact us directly.' },
        { status: 409 }
      );
    }

    // Create lead in MongoDB
    const lead = new Lead({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : undefined,
      company: company ? company.trim() : undefined,
      service,
      message: message.trim(),
      status: 'new',
      source: 'contact-form',
      priority: 'medium',
      isActive: true
    });

    await lead.save();

    // Send emails if SendGrid is configured (non-blocking)
    if (emailService.isConfigured()) {
      const teamRecipients = (process.env.LEADS_NOTIFICATION_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);
      const leadName = `${firstName} ${lastName}`.trim();

      // Fire-and-forget promises; we won't block the response
      Promise.all([
        teamRecipients.length > 0
          ? emailService.sendEmail({
              to: teamRecipients,
              subject: `New Lead: ${leadName} • ${service}`,
              html: `<p><strong>New inquiry received</strong></p>
                    <p><strong>Name:</strong> ${leadName}<br/>
                    <strong>Email:</strong> ${email}<br/>
                    <strong>Phone:</strong> ${phone || '-'}<br/>
                    <strong>Company:</strong> ${company || '-'}<br/>
                    <strong>Service:</strong> ${service}<br/>
                    <strong>Message:</strong><br/>${(message || '').replace(/\n/g, '<br/>')}</p>`,
              from: process.env.SENDGRID_FROM_EMAIL,
            })
          : Promise.resolve({ success: true }),
        emailService.sendEmail({
          to: email,
          subject: 'We received your message – HR Dashboard',
          html: `<p>Hi ${firstName},</p>
                 <p>Thanks for reaching out about <strong>${service}</strong>. Our team will get back to you within 4 business hours.</p>
                 <p>Here’s a copy of your message:</p>
                 <blockquote>${(message || '').replace(/\n/g, '<br/>')}</blockquote>
                 <p>Best,<br/>The HR Dashboard Team</p>`,
          from: process.env.SENDGRID_FROM_EMAIL,
          replyTo: process.env.SENDGRID_REPLY_TO_EMAIL || process.env.SENDGRID_FROM_EMAIL,
        })
      ]).catch(err => {
        console.error('Lead email notifications failed:', err);
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you for your message! We\'ll get back to you within 4 hours.',
      data: {
        leadId: lead._id,
        status: lead.status
      }
    });

  } catch (error) {
    console.error('Lead submission error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check for admin authentication
    const authHeader = request.headers.get('authorization');
    const adminToken = process.env.ADMIN_API_TOKEN;
    
    if (!authHeader || !adminToken || authHeader !== `Bearer ${adminToken}`) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized access' },
        { status: 401 }
      );
    }

    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const service = searchParams.get('service');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    const query: Record<string, unknown> = { isActive: true };
    
    if (status) {
      query.status = status;
    }
    
    if (service) {
      query.service = service;
    }
    
    const skip = (page - 1) * limit;
    
    const [leads, total] = await Promise.all([
      Lead.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-__v'),
      Lead.countDocuments(query)
    ]);
    
    return NextResponse.json({
      success: true,
      data: {
        leads,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
    
  } catch (error) {
    console.error('Fetch leads error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
