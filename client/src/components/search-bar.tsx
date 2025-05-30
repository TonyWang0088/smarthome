import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Property } from "@shared/schema";

interface SearchBarProps {
  onSearchResults: (properties: Property[]) => void;
  userLocation: string;
  isDetectingLocation: boolean;
}

interface SearchResponse {
  message: any;
  properties: Property[];
  searchPerformed: boolean;
}

export default function SearchBar({ onSearchResults, userLocation, isDetectingLocation }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const searchMutation = useMutation({
    mutationFn: async (query: string): Promise<SearchResponse> => {
      const response = await apiRequest("POST", "/api/chat", {
        message: query,
        sessionId: "search-session",
        userLocation,
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.searchPerformed && data.properties.length > 0) {
        onSearchResults(data.properties);
      }
    },
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      await searchMutation.mutateAsync(searchQuery);
    } catch (error) {
      console.error("Search failed:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  const exampleQueries = [
    "3-bedroom house under $1M",
    "Condos with ocean view",
    "Family homes near good schools",
    "New listings this week",
    "Properties with garage in Kitsilano",
    "Luxury homes with rooftop deck"
  ];

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="space-y-4">
        {/* Main Search Input */}
        <div className="relative">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type="text"
                placeholder="Ask me anything... 'Find me a 3-bedroom house under $1M in Vancouver'"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={searchMutation.isPending}
                className="pl-10 pr-4 py-3 text-base border-2 border-gray-200 focus:border-primary focus:ring-0"
              />
            </div>
            <Button 
              onClick={handleSearch}
              disabled={searchMutation.isPending || !searchQuery.trim()}
              className="bg-primary hover:bg-blue-700 px-6 py-3 h-auto"
            >
              {searchMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Search"
              )}
            </Button>
          </div>
        </div>

        {/* Location Display */}
        <div className="flex items-center text-sm text-gray-600">
          <MapPin size={16} className="mr-1" />
          {isDetectingLocation ? (
            <span>Detecting your location...</span>
          ) : (
            <span>Searching in: {userLocation}</span>
          )}
        </div>

        {/* Example Queries */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Try these examples:</p>
          <div className="flex flex-wrap gap-2">
            {exampleQueries.map((query, index) => (
              <button
                key={index}
                onClick={() => setSearchQuery(query)}
                className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors text-gray-700"
              >
                {query}
              </button>
            ))}
          </div>
        </div>

        {/* Search Status */}
        {searchMutation.isPending && (
          <div className="flex items-center space-x-2 text-sm text-blue-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>AI is processing your request...</span>
          </div>
        )}
      </div>
    </div>
  );
}