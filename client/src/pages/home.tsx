import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import ChatSidebar from "@/components/chat-sidebar";
import PropertyGrid from "@/components/property-grid";
import PropertyModal from "@/components/property-modal";
import SearchBar from "@/components/search-bar";
import { Property } from "@shared/schema";
import { Home as HomeIcon, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChat } from "@/hooks/use-chat";
import { useLocation } from "@/hooks/use-location";

export default function Home() {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  //const [selectedProperty, setSelectedProperty] = useState<Property[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState(null);
  // State to store search results that will be displayed in PropertyGrid
  // This state is updated via the onPropertiesFound callback passed to ChatSidebar
  const [searchResults, setSearchResults] = useState<Property[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Get location info for search bar
  const { userLocation, isDetectingLocation } = useChat({
    sessionId: "home-session",
    onPropertiesFound: setSearchResults,
    userLocation: location || undefined
  });

  // Fetch all properties
  const { data: propertiesData, isLoading: isLoadingProperties } = useQuery({
    queryKey: ["/api/properties"],
    queryFn: async () => {
      const response = await fetch("/api/properties");
      return await response.json();
    },
    staleTime: 300000, // 5 minutes
  });

//  // Fetch properties based on location with 100m radius using new API
//   const { data: propertiesData, isLoading: isLoadingProperties } = useQuery({
//     queryKey: ["/api/properties/search-by-location", location],
//     queryFn: async () => {
//       if (!location || !location.longitude || !location.latitude) {
//         const response = await fetch("/api/properties");
//         return await response.json();
//       }
      
//       const response = await fetch("/api/properties/search-by-location", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           lat: location.latitude,
//           lng: location.longitude,
//           radius: 100 // 100 meters radius
//         }),
//       });
//       return await response.json();
//     },
//     staleTime: 300000, // 5 minutes
//   });

  useEffect(() => {
    if (propertiesData) {
      setProperties(propertiesData);
    }
  }, [propertiesData]);

  // handle properties changed
  const handlePropertiesUpdate = (newProperties: Property[]) => {
    console.log("Received new properties:", newProperties);
    console.log("Previous properties state:", properties);
    setProperties(newProperties);
    console.log("Properties state after update:", newProperties);
  };

  useEffect(() => {
    console.log("Properties state changed:", properties);
  }, [properties]);
  return (
    <div className="min-h-screen bg-neutral">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <HomeIcon className="text-white text-lg" size={20} />
              </div>
              <h1 className="text-xl font-bold">Smart Home</h1>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <a href="#" className="text-gray-600 hover:text-primary transition-colors">Buy</a>
              <a href="#" className="text-gray-600 hover:text-primary transition-colors">Sell</a>
              <a href="#" className="text-gray-600 hover:text-primary transition-colors">Market</a>
              <Button className="bg-primary text-white hover:bg-blue-700">
                Sign In
              </Button>
            </nav>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </header>

      {/* Search Bar Section */}
      {/* <div className="bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SearchBar 
            onSearchResults={setSearchResults}
            userLocation={userLocation}
            isDetectingLocation={isDetectingLocation}
          />
        </div>
      </div> */}

      <div className="flex h-[calc(100vh-12rem)]">
        {/* Chat Sidebar */}
        <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:block w-full md:w-96 bg-white border-r border-gray-200`}>
          <ChatSidebar 
            userLocation={location || undefined}
            onPropertiesFound={setSearchResults}
            onPropertiesUpdate={handlePropertiesUpdate}
            onMobileMenuClose={() => setIsMobileMenuOpen(false)}
          />
        </div>

        {/* Property Grid */}
        <div className={`${isMobileMenuOpen ? 'hidden' : 'block'} md:block flex-1`}>
          {/*
            PropertyGrid receives both:
            - properties: main list from API
            - searchResults: filtered results from ChatSidebar interactions
          */}
          <PropertyGrid
            properties={properties} // Main properties list
            isLoading={isLoadingProperties}
            searchResults={searchResults} // Results from onPropertiesFound callbacks
            onPropertySelect={setSelectedProperty}
          />
        </div>
      </div>

      {/* Property Modal */}
      {selectedProperty && (
        <PropertyModal
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
        />
      )}
    </div>
  );
}
