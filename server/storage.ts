import { properties, chatMessages, type Property, type InsertProperty, type ChatMessage, type InsertChatMessage, users, type User, type InsertUser } from "@shared/schema";

export interface IStorage {
  // User methods (existing)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Property methods
  getAllProperties(): Promise<Property[]>;
  getProperty(id: number): Promise<Property | undefined>;
  searchProperties(query: string, location?: string): Promise<Property[]>;
  getPropertiesByLocation(city: string): Promise<Property[]>;
  createProperty(property: InsertProperty): Promise<Property>;
  
  // Chat methods
  getChatMessages(sessionId: string): Promise<ChatMessage[]>;
  addChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private properties: Map<number, Property>;
  private chatMessages: Map<string, ChatMessage[]>;
  private currentUserId: number;
  private currentPropertyId: number;
  private currentMessageId: number;

  constructor() {
    this.users = new Map();
    this.properties = new Map();
    this.chatMessages = new Map();
    this.currentUserId = 1;
    this.currentPropertyId = 1;
    this.currentMessageId = 1;
    
    // Initialize with mock property data
    this.initializeMockData();
  }

  private initializeMockData() {
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
        features: ["2 Car Garage", "Fireplace", "Large Yard", "Home Gym", "Hardwood Floors", "Gourmet Kitchen"],
        images: [
          "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
        ],
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
        features: ["Garden", "Updated Kitchen", "Character Details", "Close to Transit"],
        images: [
          "https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
        ],
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
        features: ["Rooftop Deck", "City Views", "Premium Finishes", "High Ceilings", "Floor-to-ceiling Windows"],
        images: [
          "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
        ],
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
        features: ["Finished Basement", "Beautiful Landscaping", "Quiet Neighborhood", "Near Good Schools"],
        images: [
          "https://images.unsplash.com/photo-1605146769289-440113cc3d00?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
        ],
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
        features: ["Open-plan Living", "Stainless Steel Appliances", "In-suite Laundry", "Urban Location"],
        images: [
          "https://images.unsplash.com/photo-1449844908441-8829872d2607?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
        ],
        latitude: 49.2756,
        longitude: -123.0694,
        rating: 4.5,
        daysOnMarket: 4,
        status: "open_house",
        yearBuilt: 2015,
        propertyType: "condo"
      }
    ];

    mockProperties.forEach(property => {
      this.createProperty(property);
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Property methods
  async getAllProperties(): Promise<Property[]> {
    return Array.from(this.properties.values());
  }

  async getProperty(id: number): Promise<Property | undefined> {
    return this.properties.get(id);
  }

  async searchProperties(query: string, location?: string): Promise<Property[]> {
    const allProperties = Array.from(this.properties.values());
    const searchTerm = query.toLowerCase();
    
    return allProperties.filter(property => {
      const matchesQuery = 
        property.address.toLowerCase().includes(searchTerm) ||
        property.neighborhood.toLowerCase().includes(searchTerm) ||
        property.description.toLowerCase().includes(searchTerm) ||
        property.features.some(feature => feature.toLowerCase().includes(searchTerm));
      
      const matchesLocation = !location || 
        property.city.toLowerCase().includes(location.toLowerCase()) ||
        property.neighborhood.toLowerCase().includes(location.toLowerCase());
      
      return matchesQuery && matchesLocation;
    });
  }

  async getPropertiesByLocation(city: string): Promise<Property[]> {
    const allProperties = Array.from(this.properties.values());
    return allProperties.filter(property => 
      property.city.toLowerCase().includes(city.toLowerCase())
    );
  }

  async createProperty(insertProperty: InsertProperty): Promise<Property> {
    const id = this.currentPropertyId++;
    const property: Property = { ...insertProperty, id };
    this.properties.set(id, property);
    return property;
  }

  // Chat methods
  async getChatMessages(sessionId: string): Promise<ChatMessage[]> {
    return this.chatMessages.get(sessionId) || [];
  }

  async addChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = this.currentMessageId++;
    const message: ChatMessage = { ...insertMessage, id };
    
    if (!this.chatMessages.has(insertMessage.sessionId)) {
      this.chatMessages.set(insertMessage.sessionId, []);
    }
    
    this.chatMessages.get(insertMessage.sessionId)!.push(message);
    return message;
  }
}

export const storage = new MemStorage();
