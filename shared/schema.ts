import { sqliteTable, text, integer, real, blob } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const properties = sqliteTable("properties", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  address: text("address").notNull(),
  city: text("city").notNull(),
  province: text("province").notNull(),
  postalCode: text("postal_code"),
  price: integer("price").notNull(),
  bedroom: integer("bedroom"),
  bathrooms: real("bathrooms"),
  squareFeet: integer("square_feet"),
  neighborhood: text("neighborhood"),
  description: text("description"),
  features: text("features"), // JSON string for array
  images: text("images"), // JSON string for array
  latitude: real("latitude"),
  longitude: real("longitude"),
  rating: real("rating"),
  daysOnMarket: integer("days_on_market"),
  status: text("status"), // "new", "price_drop", "open_house", etc.
  yearBuilt: integer("year_built"),
  propertyType: text("property_type"), // "house", "condo", "townhouse"
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const chatMessages = sqliteTable("chat_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: text("session_id").notNull(),
  message: text("message").notNull(),
  isUser: integer("is_user", { mode: "boolean" }).notNull(),
  timestamp: text("timestamp").notNull(),
});

export const userSessions = sqliteTable("user_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: text("session_id").notNull().unique(),
  userLocation: text("user_location"),
  detectedLocation: text("detected_location"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: text("created_at").notNull(),
  lastActivity: text("last_activity").notNull(),
});

export const propertyViews = sqliteTable("property_views", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  propertyId: integer("property_id").notNull(),
  sessionId: text("session_id").notNull(),
  viewedAt: text("viewed_at").notNull(),
  viewDuration: integer("view_duration"), // in seconds
});

export const searchQueries = sqliteTable("search_queries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: text("session_id").notNull(),
  query: text("query").notNull(),
  location: text("location"),
  resultsCount: integer("results_count").notNull(),
  searchedAt: text("searched_at").notNull(),
});

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: text("created_at").notNull(),
});

export const houseproperties = sqliteTable("houseproperties", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  listingId: text("listing_id").notNull().unique(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  province: text("province").notNull(),
  postalCode: text("postal_code"),
  price: integer("price").notNull(),
  originalPrice: integer("original_price"),
  priceChangeDate: text("price_change_date"),
  bedroom: integer("bedroom"),
  bathrooms: real("bathrooms"),
  squareFeet: integer("square_feet"),
  lotSize: integer("lot_size"),
  propertyType: text("property_type"),
  buildingType: text("building_type"),
  ownershipType: text("ownership_type"),
  age: integer("age"),
  description: text("description"),
  features: text("features"), // JSON array
  amenities: text("amenities"), // JSON array
  images: text("images"), // JSON array
  virtualTours: text("virtual_tours"), // JSON array
  latitude: real("latitude"),
  longitude: real("longitude"),
  neighborhood: text("neighborhood"),
  schoolDistrict: text("school_district"),
  zoning: text("zoning"),
  taxes: integer("taxes"),
  strataFee: integer("strata_fee"),
  maintenanceFee: integer("maintenance_fee"),
  yearBuilt: integer("year_built"),
  style: text("style"),
  stories: integer("stories"),
  title: text("title"),
  parkingType: text("parking_type"),
  parkingSpaces: integer("parking_spaces"),
  heatingType: text("heating_type"),
  coolingType: text("cooling_type"),
  fireplace: integer("fireplace", { mode: "boolean" }),
  basement: text("basement"),
  exterior: text("exterior"),
  roof: text("roof"),
  view: text("view"),
  water: text("water"),
  sewer: text("sewer"),
  status: text("status"),
  daysOnMarket: integer("days_on_market"),
  lastUpdated: text("last_updated"),
  mlsNumber: text("mls_number"),
  listingDate: text("listing_date"),
  openHouse: text("open_house"), // JSON array
  agentName: text("agent_name"),
  agentPhone: text("agent_phone"),
  agentCompany: text("agent_company"),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const insertHousePropertySchema = createInsertSchema(houseproperties).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type HouseProperty = typeof houseproperties.$inferSelect;
export type InsertHouseProperty = z.infer<typeof insertHousePropertySchema>;

// Insert schemas
export const insertPropertySchema = createInsertSchema(properties).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
});

export const insertUserSessionSchema = createInsertSchema(userSessions).omit({
  id: true,
});

export const insertPropertyViewSchema = createInsertSchema(propertyViews).omit({
  id: true,
});

export const insertSearchQuerySchema = createInsertSchema(searchQueries).omit({
  id: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

// Tony
export const chatRequestSchema = z.object({
  message: z.string().min(1),
  sessionId: z.string(),
  userLocation: z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string().optional(),
  }).optional(),
  imageData: z.string().optional(), // base64 encoded image
  isVoiceInput: z.boolean().optional(),
});

// Types
export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;
export type PropertyView = typeof propertyViews.$inferSelect;
export type InsertPropertyView = z.infer<typeof insertPropertyViewSchema>;
export type SearchQuery = typeof searchQueries.$inferSelect;
export type InsertSearchQuery = z.infer<typeof insertSearchQuerySchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
