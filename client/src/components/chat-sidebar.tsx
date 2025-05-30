import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Bot, User, Send } from "lucide-react";
import { useChat } from "@/hooks/use-chat";
import { Property } from "@shared/schema";

interface ChatSidebarProps {
  onPropertiesFound: (properties: Property[]) => void;
  onMobileMenuClose?: () => void;
}

export default function ChatSidebar({ onPropertiesFound, onMobileMenuClose }: ChatSidebarProps) {
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { messages, sendMessage, isLoading } = useChat({
    onPropertiesFound,
    sessionId: "default-session", // In a real app, this would be user-specific
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    await sendMessage(inputMessage);
    setInputMessage("");
    onMobileMenuClose?.();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickFilters = [
    "Under $800K",
    "3+ Bedrooms", 
    "New Listings",
    "Downtown",
    "With Garage"
  ];

  const handleQuickFilter = (filter: string) => {
    sendMessage(`Show me properties that are ${filter}`);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-secondary flex items-center">
          <Bot className="text-primary mr-2" size={20} />
          AI Assistant
        </h2>
        <p className="text-sm text-gray-600 mt-1">Ask me anything about properties!</p>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
              <Bot className="text-white" size={16} />
            </div>
            <div className="bg-gray-100 rounded-lg px-4 py-2 max-w-xs">
              <p className="text-sm text-gray-800">
                Hi! I'm your AI real estate assistant. I can help you find properties based on your location and preferences. What would you like to know?
              </p>
            </div>
          </div>
        )}
        
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-3 ${message.isUser ? 'justify-end' : ''}`}
          >
            {!message.isUser && (
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="text-white" size={16} />
              </div>
            )}
            
            <div className={`rounded-lg px-4 py-2 max-w-xs ${
              message.isUser 
                ? 'bg-primary text-white' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              <p className="text-sm">{message.message}</p>
            </div>
            
            {message.isUser && (
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="text-gray-600" size={16} />
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
              <Bot className="text-white" size={16} />
            </div>
            <div className="bg-gray-100 rounded-lg px-4 py-2 max-w-xs">
              <p className="text-sm text-gray-800">Thinking...</p>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <Input
            type="text"
            placeholder="Ask about properties, neighborhoods, or market trends..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            className="flex-1 text-sm"
          />
          <Button 
            onClick={handleSendMessage}
            disabled={isLoading || !inputMessage.trim()}
            className="bg-primary hover:bg-blue-700"
          >
            <Send size={16} />
          </Button>
        </div>
        
        <div className="mt-2 flex flex-wrap gap-2">
          {quickFilters.map((filter) => (
            <Badge
              key={filter}
              variant="secondary"
              className="cursor-pointer hover:bg-gray-200 transition-colors"
              onClick={() => handleQuickFilter(filter)}
            >
              {filter}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
