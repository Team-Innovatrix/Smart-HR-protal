import { NextRequest, NextResponse } from "next/server";
import { runCorePipeline, type AgentState, createInitialVoiceCommandState } from "@/lib/langGraph";
import { logger } from "@/lib/langGraph/utils/logger";
import { OpenAIService } from "@/lib/openaiService";
import { RedisSessionStore } from "@/lib/session/sessionStore";
import { VoiceSession } from "@/models/VoiceSession";
import connectDB from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  const requestStart = Date.now();
  
  try {
    // Authenticate user
    let authenticatedUser;
    try {
      const { auth, currentUser } = await import('@/lib/devAuthWrapper');
      const { userId } = await auth();
      
      if (!userId) {
        throw new Error('No user ID found');
      }
      
      const user = await currentUser();
      if (!user) {
        throw new Error('No user found');
      }
      
      authenticatedUser = {
        userId,
        email: user.emailAddresses[0]?.emailAddress || '',
        firstName: user.firstName || '',
        lastName: user.lastName || ''
      };
      
    } catch (authError) {
      return NextResponse.json(
        { 
          error: 'Authentication required',
          details: 'Please sign in to use voice commands',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      );
    }
    
    // Get the form data with audio file, optional sessionId, and optional location
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    const existingSessionId = formData.get('sessionId') as string | null;
    const locationString = formData.get('location') as string | null;
    
    // Parse location data if provided
    let location: { latitude: number; longitude: number } | undefined;
    if (locationString) {
      try {
        const parsed = JSON.parse(locationString);
        if (parsed && typeof parsed.latitude === 'number' && typeof parsed.longitude === 'number') {
          location = parsed;
          console.log('📍 Location data received:', { 
            latitude: parsed.latitude, 
            longitude: parsed.longitude 
          });
        }
      } catch (e) {
        console.error('Failed to parse location data:', e);
      }
    } else {
      console.log('📍 No location data in request');
    }
    
    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }
    
    // Convert File to Blob for processing
    const audioBlob = new Blob([audioFile], { type: audioFile.type });
    
    // Transcribe audio using OpenAI
    const openaiService = new OpenAIService();
    let transcription;
    try {
      transcription = await openaiService.transcribeAudio(audioBlob);
    } catch (transcriptionError) {
      return NextResponse.json(
        { 
          error: 'Audio transcription failed',
          details: transcriptionError instanceof Error ? transcriptionError.message : 'Unknown transcription error'
        },
        { status: 500 }
      );
    }
    
    const text = transcription.text;
    
    // Determine if this is a new session or continuing an existing one
    let sessionId: string;
    let isFirstMessage: boolean;
    let existingSession: any = null;
    
    if (existingSessionId) {
      // Try to retrieve existing session
      existingSession = await RedisSessionStore.get(existingSessionId);
      
      if (existingSession && existingSession.isActive) {
        sessionId = existingSessionId;
        // Check if we need intent extraction (no active intent) or intent continuity (has active intent)
        const hasActiveIntent = existingSession.currentWorkflow && existingSession.currentWorkflow !== '';
        isFirstMessage = !hasActiveIntent; // Use intent extraction if no active intent, continuity if has active intent
        
        logger.info('Continuing existing session', { 
          sessionId, 
          userId: authenticatedUser.userId
        }, {
          willExtractIntent: !hasActiveIntent,
          currentIntent: existingSession.currentWorkflow || 'none'
        });
      } else {
        // Session not found or expired, create new one
        sessionId = crypto.randomUUID();
        isFirstMessage = true;
        logger.info('Session not found or expired, creating new session', { 
          sessionId, 
          userId: authenticatedUser.userId 
        }, {
          oldSessionId: existingSessionId
        });
      }
    } else {
      // No sessionId provided, create new session
      sessionId = crypto.randomUUID();
      isFirstMessage = true;
      logger.info('No session provided, creating new session', { sessionId, userId: authenticatedUser.userId });
    }
    
    logger.voiceRecordingStart(sessionId, authenticatedUser.userId);
    logger.info('Voice command processing started', { 
      sessionId, 
      userId: authenticatedUser.userId
    }, {
      isFirstMessage
    });

    // Create or restore initial state for langgraph pipeline
    // If continuing session, get conversation history from MongoDB
    let conversationHistory: any[] = [];
    if (existingSession && !isFirstMessage) {
      try {
        await connectDB();
        const mongoSession = await VoiceSession.findOne({ sessionId }).lean() as any;
        if (mongoSession && mongoSession.conversationHistory) {
          // Convert MongoDB format back to LangGraph format
          conversationHistory = mongoSession.conversationHistory.map((msg: any) => ({
            id: msg.messageId,
            type: msg.type,
            content: msg.content || msg.rawTranscribedText || '',
            timestamp: msg.timestamp,
            intent: msg.intent,
            confidence: msg.intentConfidence,
            parameters: msg.parameters,
            executionResult: msg.executionResult,
            metadata: msg.metadata
          }));
        }
      } catch (error) {
        console.error('Failed to load conversation history from MongoDB:', error);
        // Continue with empty history if load fails
      }
    }
    
    const initialState: AgentState = existingSession ? {
      ...createInitialVoiceCommandState(sessionId, authenticatedUser.userId),
      currentIntent: existingSession.currentWorkflow || '',
      requiredData: {
        ...existingSession.contextData || {},
        ...(location ? { location } : {}) // Include location if provided
      },
      conversationHistory, // From MongoDB
    } : {
      ...createInitialVoiceCommandState(sessionId, authenticatedUser.userId),
      requiredData: location ? { location } : {}, // Include location if provided
      conversationHistory: [],
    };

    console.log('📍 Initial state created with location:', { 
      hasLocation: !!initialState.requiredData.location,
      requiredDataKeys: Object.keys(initialState.requiredData)
    });

    // Run the langgraph pipeline with isFirstMessage flag
    const result = await runCorePipeline(text, initialState, isFirstMessage);
    
    // Update or create session in Redis with lightweight state (no full conversation history)
    const now = new Date().toISOString();
    const updatedSessionData: any = {
      id: sessionId,
      userId: authenticatedUser.userId,
      createdAt: existingSession?.createdAt || now,
      lastActivity: now,
      isActive: true,
      conversationHistory: [], // Don't store full history in Redis - use MongoDB instead
      currentWorkflow: result.value.currentIntent || '',
      workflowStep: result.value.isComplete ? 'completed' : 'pending',
      userTimezone: existingSession?.userTimezone || 'UTC',
      userRole: existingSession?.userRole || 'employee',
      userPreferences: existingSession?.userPreferences || {},
      pendingActions: existingSession?.pendingActions || [],
      completedActions: existingSession?.completedActions || [],
      contextData: result.value.requiredData || {},
      totalInteractions: (existingSession?.totalInteractions || 0) + 1,
      averageResponseTime: existingSession?.averageResponseTime || 0,
      errorCount: existingSession?.errorCount || 0,
      context: {},
      expiresAt: new Date(Date.now() + 900000).toISOString(), // 15 minutes from now
      metadata: existingSession?.metadata || {
        userId: authenticatedUser.userId,
        createdAt: now,
        updatedAt: now
      }
    };
    
    await RedisSessionStore.set(updatedSessionData);
    
    // Save conversation to MongoDB session
    try {
      await connectDB();
      
      // Convert LangGraph conversation history to MongoDB format
      const mongoConversationHistory = result.value.conversationHistory.map((msg: any) => {
        // For assistant messages with execution results, use the execution result message
        const isAssistantWithExecution = msg.type === 'assistant' && msg.executionResult?.message;
        const content = isAssistantWithExecution ? msg.executionResult.message : (msg.content || '');

        return {
          messageId: msg.id || crypto.randomUUID(),
          type: msg.type as 'user' | 'assistant' | 'system',
          timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
          rawTranscribedText: msg.type === 'user' ? msg.content : undefined,
          transcriptionConfidence: msg.confidence || 0.95,
          content: content,
          intent: msg.intent,
          intentConfidence: msg.confidence,
          parameters: msg.parameters,
          executionResult: msg.executionResult,
          metadata: msg.metadata
        };
      });
      
      // Count messages by type
      const userMessages = mongoConversationHistory.filter((m: any) => m.type === 'user').length;
      const assistantMessages = mongoConversationHistory.filter((m: any) => m.type === 'assistant').length;
      
      // Track completed intents
      const completedIntents: string[] = [];
      if (result.value.isComplete && result.value.currentIntent) {
        completedIntents.push(result.value.currentIntent);
      }
      
      // Find existing session or create new one
      let voiceSession = await VoiceSession.findOne({ sessionId });
      
      if (voiceSession) {
        // Update existing session with full conversation
        voiceSession.conversationHistory = mongoConversationHistory;
        voiceSession.currentIntent = result.value.currentIntent || undefined;
        voiceSession.currentIntentConfidence = result.value.isComplete ? undefined : 0.95;
        voiceSession.awaitingResponse = !result.value.isComplete;
        voiceSession.requiresConfirmation = result.value.requiresConfirmation;
        voiceSession.totalMessages = mongoConversationHistory.length;
        voiceSession.totalUserMessages = userMessages;
        voiceSession.totalAssistantMessages = assistantMessages;
        
        // Add to completed intents if intent was completed
        if (result.value.isComplete && result.value.currentIntent) {
          if (!voiceSession.completedIntents.includes(result.value.currentIntent)) {
            voiceSession.completedIntents.push(result.value.currentIntent);
          }
        }
        
        voiceSession.lastActivityAt = new Date();
        voiceSession.totalDuration += (Date.now() - requestStart);
        voiceSession.averageResponseTime = voiceSession.totalDuration / voiceSession.totalMessages;
        
        await voiceSession.save();
        logger.info('Conversation updated in session', { sessionId, userId: authenticatedUser.userId }, { 
          totalMessages: mongoConversationHistory.length,
          currentIntent: result.value.currentIntent
        });
      } else {
        // Create new session with conversation
        voiceSession = new VoiceSession({
          sessionId,
          userId: authenticatedUser.userId,
          clerkUserId: authenticatedUser.userId,
          userRole: updatedSessionData.userRole || 'employee',
          conversationHistory: mongoConversationHistory,
          currentIntent: result.value.currentIntent || undefined,
          currentIntentConfidence: result.value.isComplete ? undefined : 0.95,
          awaitingResponse: !result.value.isComplete,
          requiresConfirmation: result.value.requiresConfirmation,
          totalMessages: mongoConversationHistory.length,
          totalUserMessages: userMessages,
          totalAssistantMessages: assistantMessages,
          completedIntents,
          sessionStartedAt: new Date(),
          lastActivityAt: new Date(),
          isActive: true,
          userAgent: req.headers.get('user-agent') || 'Unknown',
          ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
          averageResponseTime: Date.now() - requestStart,
          totalDuration: Date.now() - requestStart
        });
        
        await voiceSession.save();
        logger.info('New conversation session created', { sessionId, userId: authenticatedUser.userId }, { 
          totalMessages: mongoConversationHistory.length,
          currentIntent: result.value.currentIntent
        });
      }
    } catch (dbError) {
      // Log error but don't fail the request
      logger.error('Failed to save conversation to MongoDB', { 
        sessionId, 
        userId: authenticatedUser.userId 
      }, dbError as Error);
    }
    
    const totalDuration = Date.now() - requestStart;
    logger.info('Voice command processing completed', { 
      sessionId, 
      userId: authenticatedUser.userId
    }, {
      sessionExtended: !isFirstMessage,
      duration: totalDuration
    });

    return NextResponse.json({
      success: true,
      transcription: text,
      intent: result.value.currentIntent,
      message: result.value.dataCollectionReply || 'Command processed',
      executionResult: result.value.executionResult,
      status: result.value.isComplete ? 'completed' : 'pending',
      sessionId,
      duration: totalDuration,
      sessionExpiresIn: '15 minutes',
      // Node-level status information for real-time UI updates
      nodeStatus: {
        currentNode: result.value.currentNode,
        nodeStatus: result.value.nodeStatus,
        nodeProgress: (result.value.nodeProgress || []).slice(-5), // Last 5 nodes for UI display
        nodeStartTime: result.value.nodeStartTime,
        nodeEndTime: result.value.nodeEndTime
      }
    });
    
  } catch (err) {
    const totalDuration = Date.now() - requestStart;
    const error = err as Error;
    
    logger.error('Voice command processing failed', { 
      sessionId: 'unknown'
    }, error, { 
      errorMessage: error.message,
      duration: totalDuration
    });

    return NextResponse.json({ 
      error: 'Voice command processing failed',
      details: error.message,
      code: 'PROCESSING_ERROR',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}


