import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { 
  properties, 
  chatMessages, 
  userSessions, 
  propertyViews, 
  searchQueries, 
  users,
  type Property,
  type InsertProperty,
  type ChatMessage,
  type InsertChatMessage,
  type UserSession,
  type InsertUserSession,
  type PropertyView,
  type InsertPropertyView,
  type SearchQuery,
  type InsertSearchQuery
} from "@shared/schema";
import { eq, like, and, or, desc } from "drizzle-orm";

// Initialize SQLite database
const sqlite = new Database("database.sqlite");
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite);

// Initialize database tables
export function initializeDatabase() {
  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS properties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      province TEXT NOT NULL,
      postal_code TEXT NOT NULL,
      price INTEGER NOT NULL,
      bedrooms INTEGER NOT NULL,
      bathrooms REAL NOT NULL,
      square_feet INTEGER NOT NULL,
      neighborhood TEXT NOT NULL,
      description TEXT NOT NULL,
      features TEXT NOT NULL,
      images TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      rating REAL NOT NULL,
      days_on_market INTEGER NOT NULL,
      status TEXT NOT NULL,
      year_built INTEGER,
      property_type TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      message TEXT NOT NULL,
      is_user INTEGER NOT NULL,
      timestamp TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL UNIQUE,
      user_location TEXT,
      detected_location TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at TEXT NOT NULL,
      last_activity TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS property_views (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER NOT NULL,
      session_id TEXT NOT NULL,
      viewed_at TEXT NOT NULL,
      view_duration INTEGER
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS search_queries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      query TEXT NOT NULL,
      location TEXT,
      results_count INTEGER NOT NULL,
      searched_at TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);

  // Insert mock data
  insertMockData();
}

function insertMockData() {
  // Check if properties already exist
  const existingProperties = db.select().from(properties).all();
  if (existingProperties.length > 0) {
    return; // Data already exists
  }

  const mockProperties: InsertProperty[] = [
    {
      address: "2847 Oak Street",
      city: "Vancouver",
      province: "BC",
      postalCode: "V6H 4A1",
      price: 1250000,
      bedrooms: 4,
      bathrooms: 3,
      squareFeet: 2850,
      neighborhood: "Kitsilano",
      description: "This stunning modern home in prestigious Kitsilano offers the perfect blend of luxury and comfort. Features include an open-concept layout, gourmet kitchen with premium appliances, hardwood floors throughout, and a private backyard oasis. Walking distance to beaches, parks, and trendy shops.",
      features: JSON.stringify(["2 Car Garage", "Fireplace", "Large Yard", "Home Gym", "Hardwood Floors", "Gourmet Kitchen"]),
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
      ]),
      latitude: 49.2644,
      longitude: -123.1619,
      rating: 4.8,
      daysOnMarket: 3,
      status: "new",
      yearBuilt: 2018,
      propertyType: "house"
    },
    {
      address: "1456 Fraser Street",
      city: "Vancouver",
      province: "BC",
      postalCode: "V5L 2X9",
      price: 895000,
      bedrooms: 3,
      bathrooms: 2,
      squareFeet: 2200,
      neighborhood: "Mount Pleasant",
      description: "Charming family home in vibrant Mount Pleasant. This well-maintained house features original character details, updated kitchen, and a lovely garden. Close to transit, restaurants, and community amenities.",
      features: JSON.stringify(["Garden", "Updated Kitchen", "Character Details", "Close to Transit"]),
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
      ]),
      latitude: 49.2606,
      longitude: -123.1016,
      rating: 4.6,
      daysOnMarket: 7,
      status: "active",
      yearBuilt: 1995,
      propertyType: "house"
    },
    {
      address: "789 West 15th Avenue",
      city: "Vancouver",
      province: "BC",
      postalCode: "V5Z 1R8",
      price: 1680000,
      bedrooms: 5,
      bathrooms: 4,
      squareFeet: 3400,
      neighborhood: "Fairview",
      description: "Luxury contemporary townhouse in desirable Fairview. Features include high ceilings, floor-to-ceiling windows, premium finishes, and a rooftop deck with city views. Walking distance to VGH and downtown.",
      features: JSON.stringify(["Rooftop Deck", "City Views", "Premium Finishes", "High Ceilings", "Floor-to-ceiling Windows"]),
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
      ]),
      latitude: 49.2606,
      longitude: -123.1207,
      rating: 4.9,
      daysOnMarket: 14,
      status: "price_drop",
      yearBuilt: 2020,
      propertyType: "townhouse"
    },
    {
      address: "3201 Dunbar Street",
      city: "Vancouver",
      province: "BC",
      postalCode: "V6S 2A4",
      price: 1125000,
      bedrooms: 4,
      bathrooms: 3,
      squareFeet: 2650,
      neighborhood: "Dunbar-Southlands",
      description: "Elegant family home in quiet Dunbar-Southlands neighborhood. Beautiful landscaping, spacious rooms, and a fully finished basement. Great schools nearby and close to Pacific Spirit Park.",
      features: JSON.stringify(["Finished Basement", "Beautiful Landscaping", "Quiet Neighborhood", "Near Good Schools"]),
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1605146769289-440113cc3d00?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
      ]),
      latitude: 49.2327,
      longitude: -123.1860,
      rating: 4.7,
      daysOnMarket: 5,
      status: "active",
      yearBuilt: 2005,
      propertyType: "house"
    },
    {
      address: "1067 Commercial Drive",
      city: "Vancouver",
      province: "BC",
      postalCode: "V5L 3X1",
      price: 749000,
      bedrooms: 2,
      bathrooms: 2,
      squareFeet: 1850,
      neighborhood: "Grandview-Woodland",
      description: "Modern condo in the heart of Commercial Drive. Open-plan living, stainless steel appliances, and in-suite laundry. Walking distance to cafes, shops, and nightlife. Perfect for urban living.",
      features: JSON.stringify(["Open-plan Living", "Stainless Steel Appliances", "In-suite Laundry", "Urban Location"]),
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1449844908441-8829872d2607?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
      ]),
      latitude: 49.2756,
      longitude: -123.0694,
      rating: 4.5,
      daysOnMarket: 4,
      status: "open_house",
      yearBuilt: 2015,
      propertyType: "condo"
    }
  ];

  // Insert mock properties
  const now = new Date().toISOString();
  for (const property of mockProperties) {
    db.insert(properties).values({
      ...property,
      createdAt: now,
      updatedAt: now
    }).run();
  }
}

// Database operations
export class DatabaseStorage {
  // Property methods
  async getAllProperties(): Promise<Property[]> {
    const results = db.select().from(properties).all();
    return results.map(property => ({
      ...property,
      features: JSON.parse(property.features),
      images: JSON.parse(property.images)
    }));
  }

  async getProperty(id: number): Promise<Property | undefined> {
    const result = db.select().from(properties).where(eq(properties.id, id)).get();
    if (!result) return undefined;
    
    return {
      ...result,
      features: JSON.parse(result.features),
      images: JSON.parse(result.images)
    };
  }

  async searchProperties(query: string, location?: string): Promise<Property[]> {
    const searchTerm = `%${query.toLowerCase()}%`;
    
    let results;
    if (location) {
      const locationTerm = `%${location.toLowerCase()}%`;
      results = db.select().from(properties).where(
        and(
          or(
            like(properties.description, searchTerm),
            like(properties.features, searchTerm),
            like(properties.neighborhood, searchTerm),
            like(properties.address, searchTerm),
            like(properties.propertyType, searchTerm),
            like(properties.status, searchTerm)
          ),
          or(
            like(properties.city, locationTerm),
            like(properties.neighborhood, locationTerm)
          )
        )
      ).all();
    } else {
      results = db.select().from(properties).where(
        or(
          like(properties.description, searchTerm),
          like(properties.features, searchTerm),
          like(properties.neighborhood, searchTerm),
          like(properties.address, searchTerm),
          like(properties.propertyType, searchTerm),
          like(properties.status, searchTerm)
        )
      ).all();
    }

    return results.map(property => ({
      ...property,
      features: JSON.parse(property.features),
      images: JSON.parse(property.images)
    }));
  }

  async getPropertiesByLocation(city: string): Promise<Property[]> {
    const results = db.select().from(properties)
      .where(like(properties.city, `%${city}%`))
      .all();
    return results.map(property => ({
      ...property,
      features: JSON.parse(property.features),
      images: JSON.parse(property.images)
    }));
  }

  async createProperty(property: InsertProperty): Promise<Property> {
    const now = new Date().toISOString();
    const result = db.insert(properties).values({
      ...property,
      features: JSON.stringify(property.features),
      images: JSON.stringify(property.images),
      createdAt: now,
      updatedAt: now
    }).returning().get();

    return {
      ...result,
      features: JSON.parse(result.features),
      images: JSON.parse(result.images)
    };
  }

  // Chat methods
  async getChatMessages(sessionId: string): Promise<ChatMessage[]> {
    return db.select().from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(desc(chatMessages.timestamp))
      .all();
  }

  async addChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    return db.insert(chatMessages).values(message).returning().get();
  }

  // Session methods
  async createOrUpdateSession(session: InsertUserSession): Promise<UserSession> {
    const existing = db.select().from(userSessions)
      .where(eq(userSessions.sessionId, session.sessionId))
      .get();

    if (existing) {
      return db.update(userSessions)
        .set({ ...session, lastActivity: new Date().toISOString() })
        .where(eq(userSessions.sessionId, session.sessionId))
        .returning()
        .get();
    } else {
      return db.insert(userSessions).values({
        ...session,
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      }).returning().get();
    }
  }

  async getSession(sessionId: string): Promise<UserSession | undefined> {
    return db.select().from(userSessions)
      .where(eq(userSessions.sessionId, sessionId))
      .get();
  }

  // Analytics methods
  async recordPropertyView(view: InsertPropertyView): Promise<PropertyView> {
    return db.insert(propertyViews).values({
      ...view,
      viewedAt: new Date().toISOString()
    }).returning().get();
  }

  async recordSearchQuery(query: InsertSearchQuery): Promise<SearchQuery> {
    return db.insert(searchQueries).values({
      ...query,
      searchedAt: new Date().toISOString()
    }).returning().get();
  }
}

export const storage = new DatabaseStorage();