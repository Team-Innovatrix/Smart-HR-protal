import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const startTime = Date.now();
  const webhookId = Math.random().toString(36).substring(7);
  
  console.log(`📨 [${webhookId}] Clerk webhook request received`, {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    environment: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV
  });

  try {
    // Get the headers
    const headerPayload = await headers()
    const svix_id = headerPayload.get("svix-id")
    const svix_timestamp = headerPayload.get("svix-timestamp")
    const svix_signature = headerPayload.get("svix-signature")

    console.log(`🔍 [${webhookId}] Webhook headers received:`, {
      svix_id: svix_id ? `${svix_id.substring(0, 8)}...` : 'MISSING',
      svix_timestamp: svix_timestamp || 'MISSING',
      svix_signature: svix_signature ? `${svix_signature.substring(0, 8)}...` : 'MISSING',
      hasWebhookSecret: !!process.env.CLERK_WEBHOOK_SECRET
    });

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      console.error(`❌ [${webhookId}] Missing required webhook headers`, {
        svix_id: !!svix_id,
        svix_timestamp: !!svix_timestamp,
        svix_signature: !!svix_signature
      });
      
      return new Response('Error occurred -- no svix headers', {
        status: 400
      })
    }

    // Get the body
    const payload = await req.json()
    const body = JSON.stringify(payload)

    console.log(`📦 [${webhookId}] Webhook payload received:`, {
      eventType: payload.type,
      userId: payload.data?.id || 'UNKNOWN',
      email: 'email_addresses' in (payload.data || {}) && Array.isArray((payload.data as Record<string, unknown>).email_addresses)
        ? ((payload.data as Record<string, unknown>).email_addresses as Array<{ email_address?: string }>)[0]?.email_address || 'UNKNOWN'
        : 'N/A',
      payloadSize: body.length,
      hasWebhookSecret: !!process.env.CLERK_WEBHOOK_SECRET
    });

    // Create a new Svix instance with your secret.
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error(`❌ [${webhookId}] CLERK_WEBHOOK_SECRET environment variable is not set`);
      return new Response('Webhook secret not configured', {
        status: 500
      });
    }

    const wh = new Webhook(webhookSecret)

    let evt: WebhookEvent

    // Verify the payload with the headers
    try {
      console.log(`🔐 [${webhookId}] Verifying webhook signature...`);
      evt = wh.verify(body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }) as WebhookEvent
      
      console.log(`✅ [${webhookId}] Webhook signature verification successful`);
    } catch (err) {
      console.error(`❌ [${webhookId}] Webhook signature verification failed:`, {
        error: err instanceof Error ? err.message : 'Unknown error',
        svix_id: svix_id.substring(0, 8),
        timestamp: svix_timestamp,
        hasSecret: !!webhookSecret,
        secretPrefix: webhookSecret.substring(0, 8)
      });
      
      return new Response('Error occurred during signature verification', {
        status: 400
      })
    }

    // Handle the webhook
    const eventType = evt.type
    
    console.log(`🎯 [${webhookId}] Processing webhook event: ${eventType}`, {
      userId: evt.data?.id || 'UNKNOWN',
      email: 'email_addresses' in (evt.data || {}) && Array.isArray((evt.data as unknown as Record<string, unknown>).email_addresses) 
        ? ((evt.data as unknown as Record<string, unknown>).email_addresses as Array<{ email_address?: string }>)[0]?.email_address || 'UNKNOWN'
        : 'N/A',
      timestamp: 'created_at' in (evt.data || {}) ? (evt.data as unknown as Record<string, unknown>).created_at as string || 'UNKNOWN' : 'N/A'
    });

    try {
      switch (eventType) {
        case 'user.created':
          console.log(`👤 [${webhookId}] User created event processing`, {
            userId: evt.data?.id,
            email: 'email_addresses' in (evt.data || {}) && Array.isArray((evt.data as unknown as Record<string, unknown>).email_addresses) 
              ? ((evt.data as unknown as Record<string, unknown>).email_addresses as Array<{ email_address?: string }>)[0]?.email_address
              : 'N/A',
            firstName: 'first_name' in (evt.data || {}) ? (evt.data as unknown as Record<string, unknown>).first_name as string : 'N/A',
            lastName: 'last_name' in (evt.data || {}) ? (evt.data as unknown as Record<string, unknown>).last_name as string : 'N/A'
          });
          // Profile will be synced when user first accesses the portal
          break
          
        case 'user.updated':
          console.log(`🔄 [${webhookId}] User updated event processing`, {
            userId: evt.data?.id,
            email: 'email_addresses' in (evt.data || {}) && Array.isArray((evt.data as unknown as Record<string, unknown>).email_addresses) 
              ? ((evt.data as unknown as Record<string, unknown>).email_addresses as Array<{ email_address?: string }>)[0]?.email_address
              : 'N/A',
            firstName: 'first_name' in (evt.data || {}) ? (evt.data as unknown as Record<string, unknown>).first_name as string : 'N/A',
            lastName: 'last_name' in (evt.data || {}) ? (evt.data as unknown as Record<string, unknown>).last_name as string : 'N/A',
            updatedFields: Object.keys(evt.data || {}).filter(key =>
              !['id', 'created_at', 'updated_at'].includes(key)
            )
          });
          // Profile will be synced when user next accesses the portal
          break
          
        case 'session.created':
          console.log(`🔑 [${webhookId}] Session created event processing`, {
            userId: 'user_id' in (evt.data || {}) ? (evt.data as unknown as Record<string, unknown>).user_id as string : 'N/A',
            sessionId: evt.data?.id,
            createdAt: 'created_at' in (evt.data || {}) ? (evt.data as unknown as Record<string, unknown>).created_at as string : 'N/A'
          });
          // This indicates a user has logged in
          // Profile will be synced when user accesses the portal
          break
          
        case 'user.deleted':
          console.log(`🗑️ [${webhookId}] User deleted event processing`, {
            userId: evt.data?.id,
            email: 'email_addresses' in (evt.data || {}) && Array.isArray((evt.data as unknown as Record<string, unknown>).email_addresses) 
              ? ((evt.data as unknown as Record<string, unknown>).email_addresses as Array<{ email_address?: string }>)[0]?.email_address
              : 'N/A'
          });
          // Handle user deletion if needed
          break
          
        default:
          console.log(`ℹ️ [${webhookId}] Unhandled webhook event: ${eventType}`, {
            eventData: evt.data,
            eventType
          });
      }

      const duration = Date.now() - startTime;
      console.log(`✅ [${webhookId}] Webhook processed successfully`, {
        eventType,
        duration,
        status: 'SUCCESS'
      });

      return NextResponse.json({ 
        success: true,
        webhookId,
        eventType,
        duration,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ [${webhookId}] Error processing webhook event:`, {
        eventType,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        duration,
        timestamp: new Date().toISOString()
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to process webhook',
          webhookId,
          eventType,
          duration,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ [${webhookId}] Critical webhook error:`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      duration,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      hasWebhookSecret: !!process.env.CLERK_WEBHOOK_SECRET
    });
    
    return new Response('Internal server error processing webhook', {
      status: 500
    })
  }
}
