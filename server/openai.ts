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
    const systemPrompt = `You are an expert real estate assistant AI that helps users find properties in Vancouver, BC. You have access to a database with the following properties:

    1. 2847 Oak Street, Kitsilano - $1,250,000 - 4 bed, 3 bath, 2850 sqft house (new listing)
    2. 1456 Fraser Street, Mount Pleasant - $895,000 - 3 bed, 2 bath, 2200 sqft house 
    3. 789 West 15th Avenue, Fairview - $1,680,000 - 5 bed, 4 bath, 3400 sqft townhouse (price drop)
    4. 3201 Dunbar Street, Dunbar-Southlands - $1,125,000 - 4 bed, 3 bath, 2650 sqft house
    5. 1067 Commercial Drive, Grandview-Woodland - $749,000 - 2 bed, 2 bath, 1850 sqft condo (open house)

    When users ask about properties:
    1. Extract specific criteria (bedrooms, price range, location, features, property type)
    2. Create appropriate search terms that match the available properties
    3. Always set shouldSearchProperties to true for property-related queries
    4. Be conversational and helpful

    User's current location: ${userLocation || "Vancouver, BC"}

    Respond with JSON in this exact format:
    {
      "response": "Your helpful conversational response",
      "shouldSearchProperties": true/false,
      "searchQuery": "specific search terms that match property features/descriptions",
      "searchLocation": "specific neighborhood or city to search",
      "intent": "search_properties|location_confirmation|general_question|greeting"
    }

    Examples:
    - "3 bedroom house under $1M" → searchQuery: "3 bedroom house", shouldSearchProperties: true
    - "luxury homes with deck" → searchQuery: "luxury deck", shouldSearchProperties: true
    - "condos in Commercial Drive" → searchQuery: "condo", searchLocation: "Commercial Drive"
    - "new listings" → searchQuery: "new", shouldSearchProperties: true`;

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
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

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
