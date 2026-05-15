import { GoogleGenerativeAI } from '@google/generative-ai';
import { formatDetailedIntentsForPrompt } from './langGraph/config/availableIntents';

export interface WhisperTranscriptionResult {
  text: string;
  language: string;
  confidence: number;
}

export interface VoiceCommandIntent {
  intent: string;
  confidence: number;
  parameters: Record<string, any>;
  original_text: string;
  user_id?: string; // Clerk user ID for authentication
  // Extended for relevance checking
  isRelevant?: boolean;
  response?: string;
  reason?: string;
}

export interface IntentContinuityResult {
  isSame: boolean;
  newData?: Record<string, any>;
}

export class OpenAIService {
  private gemini: GoogleGenerativeAI;
  private isMockMode: boolean = false;
  
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY is missing. Operating in Mock Mode.');
      this.isMockMode = true;
      this.gemini = new GoogleGenerativeAI('dummy');
    } else {
      this.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
  }
  
  async transcribeAudio(audioBlob: Blob): Promise<WhisperTranscriptionResult> {
    if (this.isMockMode) {
      await new Promise(r => setTimeout(r, 1000));
      return {
        text: "I want to apply for 3 days of annual leave starting next Monday",
        language: 'en',
        confidence: 0.99
      };
    }

    try {
      const model = this.gemini.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      const buffer = await audioBlob.arrayBuffer();
      const base64Audio = Buffer.from(buffer).toString('base64');
      
      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: audioBlob.type || 'audio/webm',
            data: base64Audio
          }
        },
        { text: "Transcribe the following audio accurately. Return only the transcription text, nothing else." }
      ]);
      
      return {
        text: result.response.text().trim(),
        language: 'en',
        confidence: 0.99
      };
    } catch (error) {
      throw new Error(`Transcription failed: ${error}`);
    }
  }
  
  async extractIntent(transcribedText: string, userContext?: any): Promise<VoiceCommandIntent> {
    const intentExtractionPrompt = `
You are an intelligent HR assistant that first determines if a message is related to HR functionality, and if so, extracts the appropriate intent and parameters.

STEP 1: RELEVANCE CHECK
First, determine if this message is related to HR/workplace functionality:

HR-RELATED TOPICS:
- Leave requests (sick leave, annual leave, personal leave, maternity/paternity)
- Attendance (clock in/out, view attendance history, team attendance)
- Team management (view team leaves, team attendance, approvals)
- Employee data (profile, education, experience, notifications)
- Work scheduling and time tracking

NON-HR TOPICS:
- Weather, news, general knowledge
- Personal non-work matters
- Technical support unrelated to HR
- chit-chat, jokes, or casual conversation

MESSAGE: "${transcribedText}"

Is this message related to HR functionality? Consider the context and intent.

If NOT HR-related, return this JSON:
{
  "isRelevant": false,
  "reason": "Message not related to HR functionality",
  "response": "Hey! I am your HR assistant. I can help you with leave requests, attendance tracking, team management, and employee data. Please let me know what you'd like help with!"
}

If HR-related, proceed to STEP 2.

STEP 2: INTENT EXTRACTION
Available HR commands and their parameters:
${formatDetailedIntentsForPrompt()}

Extract the intent and map the user's request to the appropriate HR command structure. Extract relevant parameters from the user's natural language input.

IMPORTANT RULES:
- Use EXACT parameter names from the commands above (camelCase format)
- For leave: use leaveType, startDate, endDate (NOT leave_type, start_date, end_date)
- For attendance: use timestamp, action (NOT time_stamp)
- Do not extract system identifiers like user_id, team_id, or location from voice commands - these will be retrieved from session context or browser APIs
- Return high confidence (0.8+) for clear HR commands

Return ONLY valid JSON (no markdown, no explanations) with:
{
  "isRelevant": true,
  "intent": "command_name",
  "confidence": 0.95,
  "parameters": {
    "parameter_name": "extracted_value"
  },
  "original_text": "user's original request"
}

CRITICAL:
- confidence MUST be a decimal number (e.g., 0.95, 0.87, 0.92) NOT text
- Return ONLY the JSON object, nothing else
- Use double quotes for all strings

Examples:
Input: "Hey, what is the weather today?"
Output: {"isRelevant": false, "reason": "Weather query not related to HR", "response": "Hey! I am your HR assistant. I can help you with leave requests, attendance tracking, team management, and employee data. Please let me know what you'd like help with!"}

Input: "Can you clock me in?"
Output: {"isRelevant": true, "intent": "clock_in", "confidence": 0.98, "parameters": {}, "original_text": "Can you clock me in?"}

Input: "I want to apply for 3 days of annual leave starting next Monday"
Output: {"isRelevant": true, "intent": "apply_leave", "confidence": 0.97, "parameters": {"startDate": "next Monday", "endDate": "next Wednesday", "leaveType": "annual"}, "original_text": "I want to apply for 3 days of annual leave starting next Monday"}

Input: "Show my attendance for this month"
Output: {"isRelevant": true, "intent": "view_attendance_history", "confidence": 0.95, "parameters": {"dateRange": "this month"}, "original_text": "Show my attendance for this month"}
`;

    if (this.isMockMode) {
      await new Promise(r => setTimeout(r, 500));
      return {
        isRelevant: true,
        intent: "apply_leave",
        confidence: 0.97,
        parameters: { startDate: "next Monday", endDate: "next Wednesday", leaveType: "annual" },
        original_text: transcribedText,
        user_id: userContext?.userId
      };
    }

    try {
      const model = this.gemini.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: { responseMimeType: 'application/json' }
      });
      
      const result = await model.generateContent(`${intentExtractionPrompt}\n\nUser Message: "${transcribedText}"`);
      const responseContent = result.response.text();
      
      if (!responseContent) {
        throw new Error('No response content received from Gemini');
      }
      
      // Try to extract JSON from the response
      let intentData;
      try {
        // Look for JSON content in the response
        const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          intentData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON content found in response');
        }
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError);
        console.log('Raw response:', responseContent);
        
        // Re-throw error - no fallback
        throw new Error('Failed to parse intent JSON response');
      }
      
      // Add user context if available
      if (userContext?.userId) {
        intentData.user_id = userContext.userId;
      }
      
      return intentData;
    } catch (error) {
      console.error('Gemini intent extraction failed:', error);
      throw new Error('Failed to understand command intent');
    }
  }
  
  // Method to check if Gemini service is properly configured
  isConfigured(): boolean {
    return !!process.env.GEMINI_API_KEY;
  }
  
  // Method to get API configuration status
  getConfigurationStatus(): { apiKey: boolean; organization: boolean } {
    return {
      apiKey: !!process.env.GEMINI_API_KEY,
      organization: false
    };
  }
  
  // Method to validate API key (optional - can be used to test connectivity)
  async validateAPIKey(): Promise<boolean> {
    try {
      const model = this.gemini.getGenerativeModel({ model: "gemini-2.5-flash" });
      await model.generateContent("test");
      return true;
    } catch (error) {
      console.error('Gemini API key validation failed:', error);
      return false;
    }
  }

  // Generate intelligent data collection replies
  async generateDataCollectionReply(
    intent: string,
    currentData: Record<string, unknown>,
    missingFields: string[],
    userContext: any,
    parameterConfig?: any
  ): Promise<string> {
    // Build context about what we have
    const hasData = Object.keys(currentData).length > 0;
    const dataContext = hasData 
      ? `So far you know: ${JSON.stringify(currentData, null, 2)}`
      : "This is the first interaction for this request.";
    
    const prompt = `
You are a friendly, conversational HR assistant helping with ${parameterConfig?.description || 'a request'}.

Context:
- Intent: ${intent} (${parameterConfig?.description || 'Process request'})
- ${dataContext}
- Still need: ${missingFields.join(', ')}
- Current Date: ${userContext.currentDate || new Date().toISOString()}
- Current Time: ${userContext.currentTime || new Date().toLocaleTimeString()}

Your task: Generate a NATURAL, CONVERSATIONAL response that smoothly asks for the missing information.

IMPORTANT GUIDELINES:
- DO NOT use bullet points or lists unless absolutely necessary
- DO NOT say "I have:" or "I'm missing:" - instead weave the information naturally into the conversation
- Be concise and friendly, like talking to a colleague
- Focus on what you NEED, not on listing what you already have
- Use natural transitions and varied sentence structures
- Suggest helpful options when appropriate for the missing fields

Examples of GOOD responses:
- "What type of leave would you like to apply for? Common options are sick leave, vacation, or personal leave."
- "Got it! Which dates are you looking to take off?"
- "Sure, I can help with that. What reason should I include for the request?"

Examples of BAD responses (avoid these patterns):
- "I can help you apply for leave. I have: - Start date: tomorrow..."
- "I'm missing the leave type. Please tell me..."
- Using bullet points to list information

Generate a response now:`;

    try {
      const model = this.gemini.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(prompt);
      return result.response.text() || "I need some additional information to process your request.";
    } catch (error) {
      console.error('Error generating data collection reply:', error);
      return "I need some additional information to process your request. Please provide the missing details.";
    }
  }

  async normalizeSubjectiveInformation(
    data: Record<string, any>,
    context: {
      currentDate: string;
      currentTime: string;
      timezone: string;
      dayOfWeek: string;
      intent: string;
    }
  ): Promise<Record<string, any>> {
    // Parse current date to get month info
    const currentDateObj = new Date(context.currentDate);
    const currentMonthName = currentDateObj.toLocaleString('en-US', { month: 'long' });
    const nextMonthDate = new Date(currentDateObj);
    nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
    const nextMonthName = nextMonthDate.toLocaleString('en-US', { month: 'long' });
    const lastMonthDate = new Date(currentDateObj);
    lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
    const lastMonthName = lastMonthDate.toLocaleString('en-US', { month: 'long' });
    
    const prompt = `Normalize subjective dates to YYYY-MM-DD format.

CONTEXT: Today is ${context.dayOfWeek}, ${context.currentDate.split('T')[0]}

INPUT: ${JSON.stringify(data)}

RULES:
- "tomorrow" → next day (YYYY-MM-DD)
- "today" → current date (YYYY-MM-DD)  
- "next Friday" → next Friday (YYYY-MM-DD)
- "this Friday" → this week's Friday (YYYY-MM-DD)
- Keep existing YYYY-MM-DD dates unchanged
- Return ALL fields, preserve non-date fields

OUTPUT: Valid JSON only

Example:
{"startDate": "next Friday", "endDate": "next Friday"} 
→ {"startDate": "2025-10-10", "endDate": "2025-10-10"}`;

    try {
      const model = this.gemini.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: { responseMimeType: 'application/json' }
      });
      const result = await model.generateContent(prompt);
      const content = result.response.text();
      
      if (!content) {
        console.error('No content in normalization response');
        return data; // Return original if no response
      }

      console.log('Normalization response:', content);

      // Parse the JSON response
      const normalized = JSON.parse(content);
      console.log('Parsed normalized data:', normalized);
      return normalized;

    } catch (error) {
      console.error('Error normalizing subjective information:', error);
      console.error('Original data that failed to normalize:', data);
      return data; // Return original data on error
    }
  }

  /**
   * Format conversation history for intent continuity analysis
   * Returns simple "Agent: message" and "User: message" format without metadata
   */
  private formatConversationHistoryForContinuity(conversationHistory: any[]): string {
    if (!conversationHistory || conversationHistory.length === 0) {
      return 'No previous conversation';
    }

    const formattedMessages: string[] = [];

    for (const message of conversationHistory) {
      const role = message.type === 'user' ? 'User' : 'Agent';
      const content = message.content || message.rawTranscribedText || '';

      if (content.trim()) {
        formattedMessages.push(`${role}: ${content}`);
      }
    }

    return formattedMessages.join('\n');
  }

  /**
   * Check if a message is relevant to HR functionality
   */
  async checkRelevance(message: string, context?: any): Promise<{
    isRelevant: boolean;
    confidence: number;
    response?: string;
    reasoning?: string;
  }> {
    const currentIntentContext = context?.currentIntent ? `
IMPORTANT CONTEXT:
The user is currently in the middle of: ${context.currentIntent.replace('_', ' ')}
${context.requiredData && Object.keys(context.requiredData).length > 0 ? `Already collected: ${JSON.stringify(context.requiredData, null, 2)}` : ''}
${context.missingParameters?.length > 0 ? `Still needed: ${context.missingParameters.join(', ')}` : ''}
` : '';

    const relevancePrompt = `
You are an HR assistant relevance checker. Determine if this message is related to HR/workplace functionality.

HR-RELATED TOPICS:
- Leave requests (sick leave, annual leave, personal leave, maternity/paternity)
- Attendance (clock in/out, view attendance history, team attendance)
- Team management (view team leaves, team attendance, approvals)
- Employee data (profile, education, experience, notifications)
- Work scheduling and time tracking

NON-HR TOPICS:
- Weather, news, general knowledge
- Personal non-work matters
- Technical support unrelated to HR
- chit-chat, jokes, or casual conversation

MESSAGE: "${message}"

${context?.conversationContext ? `
CONVERSATION CONTEXT (last 3 messages):
${context.conversationContext.map((msg: any) => `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content || msg.rawTranscribedText || ''}`).join('\n')}
` : ''}

${currentIntentContext}

Is this message related to HR functionality? Consider the conversation context.

**CRITICAL FOR RESPONSE GENERATION:**
- If message is irrelevant BUT user has an active intent, acknowledge the ongoing task
- Response format: "I didn't quite catch that. We're currently [active task]. Could you please [what's needed]?"
- If no active intent and irrelevant: Politely redirect to HR topics

Return JSON:
{
  "isRelevant": true/false,
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation",
  "response": "Contextual response acknowledging active task if any"
}
`;

    if (this.isMockMode) {
      return {
        isRelevant: true,
        confidence: 0.95,
        response: undefined,
        reasoning: "Mock mode assumes relevance"
      };
    }

    try {
      const model = this.gemini.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: { responseMimeType: 'application/json' }
      });
      
      const geminiResult = await model.generateContent(relevancePrompt);
      const content = geminiResult.response.text();
      
      if (!content) {
        console.error('[ERROR] Empty content in Gemini response.');
        throw new Error('No response content received from Gemini');
      }

      const parsed = JSON.parse(content);

      return {
        isRelevant: parsed.isRelevant || false,
        confidence: parsed.confidence || 0.5,
        response: parsed.response,
        reasoning: parsed.reasoning
      };

    } catch (error) {
      console.error('Error checking relevance:', error);
      // Default to relevant on error to avoid breaking the flow
      return {
        isRelevant: true,
        confidence: 0.5,
        reasoning: 'Error in relevance checking'
      };
    }
  }

  async checkIntentContinuity(
    currentText: string,
    previousIntent: string,
    conversationHistory: any[],
    requiredData?: Record<string, unknown>
  ): Promise<IntentContinuityResult> {
    // Format conversation history as simple chat messages
    const formattedHistory = this.formatConversationHistoryForContinuity(conversationHistory?.slice(-6) || []);

    const prompt = `
You are analyzing whether a user's current message continues the SAME intent as the previous turn or starts a NEW intent.

Previous Intent: ${previousIntent}
Current Message: "${currentText}"

ALREADY COLLECTED DATA (will be preserved automatically):
${JSON.stringify(requiredData || {}, null, 2)}

Recent Conversation:
${formattedHistory}

Your ONLY jobs:
1) Is this the SAME intent? → set "isSame": true/false
2) If SAME, extract ONLY the NEW parameters from the current message → put them in "newData"

CRITICAL RULES:
- The already collected data above will be PRESERVED automatically
- In "newData", ONLY include parameters explicitly mentioned in the CURRENT message
- Do NOT re-extract parameters from previous messages
- Do NOT include an "intent" field
- For leave applications: use leaveType, startDate, endDate (camelCase)
- For attendance: use timestamp, action (camelCase)
- Always use camelCase parameter names that match the intent requirements

Return STRICT JSON:
{
  "isSame": true | false,
  "newData": { }
}

Examples:
Current: "Apply sick leave for me" (previous collected: startDate, endDate) → {"isSame": true, "newData": {"leaveType": "sick"}}
Current: "for tomorrow" → {"isSame": true, "newData": {"startDate": "tomorrow", "endDate": "tomorrow"}}
Current: "clock me in" (different intent) → {"isSame": false, "newData": {}}
`;

    if (this.isMockMode) {
      return {
        isSame: true,
        newData: {}
      };
    }

    try {
      const model = this.gemini.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: { responseMimeType: 'application/json' }
      });
      
      const result = await model.generateContent(`${prompt}\n\nCurrent Message: "${currentText}"`);
      const responseContent = result.response.text();
      
      if (!responseContent) {
        throw new Error('No response content received from Gemini');
      }
      
      // Try to extract JSON from the response
      let continuityData;
      try {
        const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          continuityData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON content found in response');
        }
      } catch (parseError) {
        console.error('Failed to parse continuity JSON response:', parseError);
        console.log('Raw response:', responseContent);
        
        // Fallback: assume continuation
        return {
          isSame: true,
          newData: {}
        };
      }
      
      return continuityData;
    } catch (error) {
      console.error('Error checking intent continuity:', error);
      // Fallback: assume continuation
      return {
        isSame: true,
        newData: {}
      };
    }
  }
}
