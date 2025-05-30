import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ChatMessage, Property } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { detectUserLocation, formatLocationString } from "@/lib/geolocation";

interface UseChatProps {
  sessionId: string;
  onPropertiesFound?: (properties: Property[]) => void;
}

interface ChatResponse {
  message: ChatMessage;
  properties: Property[];
  searchPerformed: boolean;
}

export function useChat({ sessionId, onPropertiesFound }: UseChatProps) {
  const [userLocation, setUserLocation] = useState<string>("Vancouver");
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Detect user location on component mount
  useEffect(() => {
    const detectLocation = async () => {
      setIsDetectingLocation(true);
      try {
        const location = await detectUserLocation();
        if (location) {
          const locationString = formatLocationString(location);
          setUserLocation(locationString);
        }
      } catch (error) {
        console.warn("Location detection failed:", error);
      } finally {
        setIsDetectingLocation(false);
      }
    };

    detectLocation();
  }, []);

  // Get chat history
  const { data: messages = [] } = useQuery<ChatMessage[]>({
    queryKey: [`/api/chat/${sessionId}`],
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string): Promise<ChatResponse> => {
      const response = await apiRequest("POST", "/api/chat", {
        message,
        sessionId,
        userLocation,
      });
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate chat history to refetch
      queryClient.invalidateQueries({ queryKey: [`/api/chat/${sessionId}`] });
      
      // If properties were found, notify parent component
      if (data.searchPerformed && data.properties.length > 0) {
        onPropertiesFound?.(data.properties);
      }
    },
  });

  const sendMessage = async (message: string) => {
    try {
      await sendMessageMutation.mutateAsync(message);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return {
    messages,
    sendMessage,
    isLoading: sendMessageMutation.isPending,
    userLocation,
    setUserLocation,
    isDetectingLocation,
  };
}
