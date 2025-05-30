import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "your-api-key-here"
});

interface QueryResponse {
  response: string;
  shouldSearchProperties: boolean;
  searchQuery?: string;
  searchLocation?: string;
  intent: string;
}

export async function processNaturalLanguageQuery(
  userMessage: string, 
  userLocation?: string
): Promise<QueryResponse> {
  try {
    const systemPrompt = `You are a helpful real estate assistant AI. Your job is to help users find properties and answer questions about real estate.

    When users ask about properties, you should:
    1. Determine if they want to search for properties
    2. Extract location information (if not provided, assume Vancouver, BC)
    3. Extract search criteria (price range, bedrooms, features, etc.)
    4. Provide helpful, conversational responses
    5. Be friendly and professional

    User's current location: ${userLocation || "Vancouver, BC"}

    Respond with JSON in this exact format:
    {
      "response": "Your conversational response to the user",
      "shouldSearchProperties": true/false,
      "searchQuery": "search terms if applicable",
      "searchLocation": "location to search if applicable",
      "intent": "search_properties|location_confirmation|general_question|greeting"
    }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    // Ensure we have all required fields
    return {
      response: result.response || "I'm here to help you find properties. What are you looking for?",
      shouldSearchProperties: result.shouldSearchProperties || false,
      searchQuery: result.searchQuery,
      searchLocation: result.searchLocation || userLocation,
      intent: result.intent || "general_question",
    };
  } catch (error) {
    console.error("OpenAI API error:", error);
    
    // Fallback response
    const isPropertyQuery = userMessage.toLowerCase().includes("house") || 
                           userMessage.toLowerCase().includes("property") ||
                           userMessage.toLowerCase().includes("home") ||
                           userMessage.toLowerCase().includes("condo") ||
                           userMessage.toLowerCase().includes("apartment");

    return {
      response: isPropertyQuery 
        ? "I'd be happy to help you find properties! Let me search for available listings in your area."
        : "I'm here to help you with your real estate needs. How can I assist you today?",
      shouldSearchProperties: isPropertyQuery,
      searchQuery: isPropertyQuery ? userMessage : undefined,
      searchLocation: userLocation || "Vancouver",
      intent: isPropertyQuery ? "search_properties" : "general_question",
    };
  }
}
