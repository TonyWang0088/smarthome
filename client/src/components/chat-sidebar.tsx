import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
//import { Bot, User, Send } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Bot, User, Send, Mic, MicOff, Camera, X } from "lucide-react";
import { useChat } from "@/hooks/use-chat";
import { Property } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface ChatSidebarProps {
  userLocation?: {
    lat: number;
    lng: number;
    address?: string;
  };
  onPropertiesUpdate?: (properties: any[]) => void;
  onPropertiesFound: (properties: Property[]) => void;
  onMobileMenuClose?: () => void;
}

export default function ChatSidebar({ onPropertiesFound, onPropertiesUpdate, onMobileMenuClose }: ChatSidebarProps) {
  // Tony
  const [inputValue, setInputValue] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  //const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { messages, sendMessage, isLoading, userLocation, isDetectingLocation } = useChat({
    onPropertiesFound,
    onPropertiesUpdate,
    //sessionId: "default-session", // In a real app, this would be user-specific
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // const handleSendMessage = async () => {
  //   if (!inputMessage.trim()) return;
    
  //   await sendMessage(inputMessage);
  //   setInputMessage("");
  //   onMobileMenuClose?.();
  // };
  const handleSendMessage = async () => {
    if ((!inputValue.trim() && !uploadedImage) || isLoading) return;
    
    const message = inputValue.trim() || "Please analyze this image for property search.";
    setInputValue("");
    
    try {
      const response = await sendMessage(message, { 
        imageData: uploadedImage || undefined,
        isVoiceInput: false 
      });
      // if (response.properties && onPropertiesUpdate) {
      //   console.log("Calling onPropertiesUpdate with:", response.properties);
      //   onPropertiesUpdate(response.properties);
      // }
      if (onPropertiesUpdate) {
        console.log("Calling onPropertiesUpdate with:", response.properties || []);
        onPropertiesUpdate(response.properties || []);
      }
      
      // Clear image after sending
      if (uploadedImage) {
        removeImage();
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  const formatTime = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} min ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)} hr ago`;
    return d.toLocaleDateString();
  };
  const quickFilters = [
    "Townhouse", 
    "Condo", 
    "New Listings",
    "Downtown",
    "Have Garage",
    "Under $900K",
  ];

  const handleQuickFilter = (filter: string) => {
    sendMessage(`Show me properties that ${filter}`);
  };
  // Tony
  
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const audioChunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      toast({
        title: "Microphone Error",
        description: "Unable to access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };
  const transcribeAudio = async (audioBlob: Blob) => {
    // For now, we'll use the browser's built-in speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      recognition.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        
        try {
          const response = await sendMessage(transcript, { isVoiceInput: true });
          if (response.properties && onPropertiesUpdate) {
            onPropertiesUpdate(response.properties);
          }
        } catch (error) {
          console.error("Failed to send voice message:", error);
        }
      };
      
      recognition.onerror = () => {
        toast({
          title: "Speech Recognition Error",
          description: "Unable to recognize speech. Please try again.",
          variant: "destructive",
        });
      };
      
      recognition.start();
    } else {
      toast({
        title: "Speech Recognition Not Supported",
        description: "Your browser doesn't support speech recognition.",
        variant: "destructive",
      });
    }
  };
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const base64Data = result.split(',')[1]; // Remove data:image/jpeg;base64, prefix
      setUploadedImage(base64Data);
      setImagePreview(result);
    };
    reader.readAsDataURL(file);
  };
  const removeImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
        {isDetectingLocation ? (
          <p className="text-xs text-blue-600 mt-1">🌍 Detecting your location...</p>
        ) : (
          <p className="text-xs text-gray-500 mt-1">📍 Searching in: {userLocation}</p>
        )}
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
        {messages.map((message) => {
          const isUser = message.isUser;
          return (
            <div 
              key={message.id} 
              className={cn(
                "flex items-start space-x-3",
                isUser && "flex-row-reverse space-x-reverse"
              )}
            >
              <Avatar className="w-8 h-8">
                <AvatarFallback className={isUser ? "bg-slate-200" : "bg-blue-600 text-white"}>
                  {isUser ? <User className="w-4 h-4 text-slate-600" /> : <Bot className="w-4 h-4" />}
                </AvatarFallback>
              </Avatar>
              <div className={cn("flex-1", isUser && "text-right")}>
                <div className={cn(
                  "rounded-lg px-4 py-2",
                  isUser 
                    ? "bg-blue-600 text-white inline-block" 
                    : "bg-slate-100 text-slate-800"
                )}>
                  <p className="text-sm">{message.message}</p>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          );
        })}
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
        {/* Image preview */}
        {imagePreview && (
          <div className="mb-3 relative inline-block">
            <img 
              src={imagePreview} 
              alt="Upload preview" 
              className="max-w-32 max-h-32 rounded-lg border"
            />
            <Button
              onClick={removeImage}
              size="icon"
              variant="destructive"
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}
        <div className="flex space-x-2">
          <Input
            type="text"
            placeholder="Ask about properties, neighborhoods, or market trends..."
            //value={inputMessage}
            //onChange={(e) => setInputMessage(e.target.value)}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            className="flex-1 text-sm"
          />
          {/* Image upload button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <Button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || isRecording}
            size="icon"
            variant="outline"
            title="Upload image"
          >
            <Camera className="w-4 h-4" />
          </Button>
          
          {/* Voice input button */}
          <Button 
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isLoading}
            size="icon"
            variant={isRecording ? "destructive" : "outline"}
            title={isRecording ? "Stop recording" : "Start voice input"}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>
          {/* Send button */}
          {/* <Button 
            onClick={handleSendMessage}
            disabled={isLoading || (!inputValue.trim() && !uploadedImage) || isRecording}
            size="icon"
          >
            <Send className="w-4 h-4" />
          </Button> */}
          
          <Button 
            onClick={handleSendMessage}
            //disabled={isLoading || !inputMessage.trim()}
            disabled={isLoading || (!inputValue.trim() && !uploadedImage) || isRecording}
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
