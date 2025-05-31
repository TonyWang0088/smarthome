import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertChatMessageSchema, type Property } from "@shared/schema";
import { processNaturalLanguageQuery } from "./openai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all properties
  app.get("/api/properties", async (req, res) => {
    try {
      const properties = await storage.getAllProperties();
      res.json(properties);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch properties" });
    }
  });

  // Get property by ID
  app.get("/api/properties/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const property = await storage.getProperty(id);
      
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      // Record property view for analytics
      const sessionId = req.headers['x-session-id'] as string || 'anonymous';
      if (storage.recordPropertyView) {
        await storage.recordPropertyView({
          propertyId: id,
          sessionId,
          viewedAt: new Date().toISOString(),
        });
      }
      
      res.json(property);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch property" });
    }
  });

  // Search properties
  app.get("/api/properties/search/:query", async (req, res) => {
    try {
      const { query } = req.params;
      const { location } = req.query;
      
      const properties = await storage.searchProperties(
        query, 
        location as string
      );
      
      res.json(properties);
    } catch (error) {
      res.status(500).json({ message: "Failed to search properties" });
    }
  });

  // Get properties by location
  app.get("/api/properties/location/:city", async (req, res) => {
    try {
      const { city } = req.params;
      const properties = await storage.getPropertiesByLocation(city);
      res.json(properties);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch properties by location" });
    }
  });

  // Chat endpoint - process natural language queries
  app.post("/api/chat", async (req, res) => {
    try {
      const chatRequestSchema = z.object({
        message: z.string().min(1),
        sessionId: z.string().min(1),
        userLocation: z.string().optional(),
      });

      const { message, sessionId, userLocation } = chatRequestSchema.parse(req.body);

      // Update session information
      if (storage.createOrUpdateSession) {
        await storage.createOrUpdateSession({
          sessionId,
          userLocation,
          detectedLocation: userLocation,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          createdAt: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
        });
      }

      // Save user message
      await storage.addChatMessage({
        sessionId,
        message,
        isUser: true,
        timestamp: new Date().toISOString(),
      });

      // Process with OpenAI and get response
      const aiResponse = await processNaturalLanguageQuery(message, userLocation);

      // Save AI response
      const aiMessage = await storage.addChatMessage({
        sessionId,
        message: aiResponse.response,
        isUser: false,
        timestamp: new Date().toISOString(),
      });
      console.log("OpenAI raw response:", aiResponse);
      // If AI response includes property search, fetch matching properties
      let properties: Property[] = [];
      if (aiResponse.shouldSearchProperties) {
        if (aiResponse.searchQuery) {
          properties = await storage.searchProperties(aiResponse.searchQuery, userLocation);
        } else if (aiResponse.searchLocation) {
          properties = await storage.getPropertiesByLocation(aiResponse.searchLocation);
        }

        // Record search query for analytics
        if (storage.recordSearchQuery) {
          await storage.recordSearchQuery({
            sessionId,
            query: aiResponse.searchQuery || message,
            location: aiResponse.searchLocation || userLocation,
            resultsCount: properties.length,
            searchedAt: new Date().toISOString(),
          });
        }
      }

      res.json({
        message: aiMessage,
        properties,
        searchPerformed: aiResponse.shouldSearchProperties,
      });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });

  // Get chat history
  app.get("/api/chat/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const messages = await storage.getChatMessages(sessionId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chat history" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
