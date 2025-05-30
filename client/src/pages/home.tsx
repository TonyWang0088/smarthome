import { useState } from "react";
import ChatSidebar from "@/components/chat-sidebar";
import PropertyGrid from "@/components/property-grid";
import PropertyModal from "@/components/property-modal";
import { Property } from "@shared/schema";
import { Home as HomeIcon, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [searchResults, setSearchResults] = useState<Property[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
              <h1 className="text-xl font-bold text-secondary">HomeFinder AI</h1>
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

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Chat Sidebar */}
        <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:block w-full md:w-96 bg-white border-r border-gray-200`}>
          <ChatSidebar 
            onPropertiesFound={setSearchResults}
            onMobileMenuClose={() => setIsMobileMenuOpen(false)}
          />
        </div>

        {/* Property Grid */}
        <div className={`${isMobileMenuOpen ? 'hidden' : 'block'} md:block flex-1`}>
          <PropertyGrid 
            searchResults={searchResults}
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
