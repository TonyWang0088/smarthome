import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Star, Heart, Map } from "lucide-react";
import { Property } from "@shared/schema";

interface PropertyGridProps {
  properties: Property[];
  isLoading?: boolean;
  searchResults: Property[];
  onPropertySelect: (property: Property) => void;
}

export default function PropertyGrid({ properties, isLoading, searchResults, onPropertySelect }: PropertyGridProps) {
  // Tony
  // const { data: allProperties = [], isLoading } = useQuery<Property[]>({
  //   queryKey: ["/api/properties"],
  // });

  //const properties = searchResults.length > 0 ? searchResults : allProperties;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return <Badge className="bg-accent text-white">New Listing</Badge>;
      case "price_drop":
        return <Badge className="bg-red-500 text-white">Price Drop</Badge>;
      case "open_house":
        return <Badge className="bg-purple-500 text-white">Open House</Badge>;
      default:
        return null;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
                  <div className="w-full h-48 bg-gray-300" />
                  <div className="p-4 space-y-3">
                    <div className="h-6 bg-gray-300 rounded w-3/4" />
                    <div className="h-4 bg-gray-300 rounded w-1/2" />
                    <div className="h-4 bg-gray-300 rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Determine which properties to display
  console.log('Received props - properties:', properties.length, 'searchResults:', searchResults?.length || 0);
  
  // Track if search was actually triggered
  const hasSearchTriggered = searchResults !== undefined;
  
  const displayProperties = hasSearchTriggered ? (searchResults || []) : properties;
  const displayCount = displayProperties.length;
  console.log('Displaying:', displayCount, 'properties', 
             hasSearchTriggered ? '(search results)' : '(all properties)');

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Search Bar & Filters */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold">
                {hasSearchTriggered ? "Search Results" : "Properties in Vancouver"}
              </h3>
              <Badge className="bg-primary text-white">
                {displayCount} Results
              </Badge>
            </div>
            <div className="flex items-center space-x-3">
              <Select defaultValue="newest">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Sort by: Newest</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="sqft">Square Feet</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="flex items-center space-x-1">
                <Map size={16} />
                <span>Map View</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Property Listings */}
      <div className="p-4">
        <div className="max-w-6xl mx-auto">
          {displayCount === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {!hasSearchTriggered ? 
                  "No properties available" : 
                  "No properties match your search criteria"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayProperties.map((property) => (
                <Card
                  key={property.id}
                  className="overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                  onClick={() => onPropertySelect(property)}
                >
                  <div className="relative">
                    <img
                      src={property.images[0]}
                      alt={`Property at ${property.address}`}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      {getStatusBadge(property.status)}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-3 right-3 bg-white bg-opacity-90 hover:bg-opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle favorite toggle
                      }}
                    >
                      <Heart className="h-4 w-4 text-gray-400 hover:text-red-500" />
                    </Button>
                  </div>
                  
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-xl">
                        {formatPrice(property.price)}
                      </h4>
                      <span className="text-sm text-gray-500">
                        {property.daysOnMarket} {property.daysOnMarket === 1 ? 'day' : 'days'} ago
                      </span>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-3">
                      {property.bedroom} bd | {property.bathrooms} ba | {property.squareFeet.toLocaleString()} sqft
                    </p>
                    
                    <p className="text-gray-800 text-sm mb-3 truncate">
                      {property.address}, {property.city}, {property.province} {property.postalCode}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center">
                        <MapPin className="mr-1" size={12} />
                        {property.neighborhood}
                      </span>
                      <span className="flex items-center">
                        <Star className="mr-1 text-yellow-400" size={12} fill="currentColor" />
                        {property.rating}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
