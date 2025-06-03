import { useState, useCallback, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChatMessage, Property } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

import { LocationData, detectUserLocation, formatLocationString } from "@/lib/geolocation";
import { sendChatMessage, getChatHistory, type ChatRequest } from "@/lib/openai";
import { nanoid } from "nanoid";
// Tony
// interface UseChatProps {
//   sessionId: string;
//   onPropertiesFound?: (properties: Property[]) => void;
// }
interface UseChatProps {
  sessionId?: string;
  userLocation?: LocationData,
  onPropertiesFound?: (properties: Property[]) => void;
  onPropertiesUpdate?: (properties: Property[]) => void;
}

interface ChatResponse {
  message: ChatMessage;
  properties: Property[];
  searchPerformed: boolean;
}

//export function useChat({ sessionId, onPropertiesFound }: UseChatProps) {
export function useChat(options: UseChatProps = {}) {
  // Tony
  const [sessionId] = useState(options.sessionId || nanoid());
  const queryClient = useQueryClient();

  const [userLocation, setUserLocation] = useState<string>("Vancouver");
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationCache, setLocationCache] = useState<LocationData | null>(null);
  const onPropertiesFound = options.onPropertiesFound;

  const detectLocation = useCallback(async () => {
    setIsDetectingLocation(true);
    try {
      if (locationCache) {
        setUserLocation(locationCache.address);
        return locationCache;
      }
      
      const location = await detectUserLocation();
      if (location) {
        setUserLocation(location.address);
        setLocationCache(location);
        return location;
      }
    } catch (error) {
      console.warn("Location detection failed:", error);
    } finally {
      setIsDetectingLocation(false);
    }
    return null;
  }, [locationCache]);

  // Get chat history
  const { data: chatHistory = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ["/api/chat", sessionId],
    queryFn: () => getChatHistory(sessionId),
    staleTime: 0,
  });

  // Tony
  // const sendMessageMutation = useMutation({
  //   mutationFn: async (message: string): Promise<ChatResponse> => {
  //     const response = await apiRequest("POST", "/api/chat", {
  //       message,
  //       sessionId,
  //       userLocation,
  //     });
  //     return response.json();
  //   },
  //   onSuccess: (data) => {
  //     // Invalidate chat history to refetch
  //     queryClient.invalidateQueries({ queryKey: [`/api/chat/${sessionId}`] });
      
  //     // If properties were found, notify parent component
  //     if (data.searchPerformed && data.properties.length > 0) {
  //       onPropertiesFound?.(data.properties);
  //     }
  //   },
  // });
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ message, imageData, isVoiceInput }: { message: string; imageData?: string; isVoiceInput?: boolean }) => {
      const request: ChatRequest = {
        message,
        sessionId,
        userLocation: options.userLocation,
        imageData,
        isVoiceInput,
      };
      return sendChatMessage(request);
    },
    onSuccess: (data) => {
      // Invalidate chat history to refetch
      queryClient.invalidateQueries({ queryKey: ["/api/chat", sessionId] });
      // If properties were found, notify parent component
      if (data.properties.length >= 0) {
        onPropertiesFound?.(data.properties);
        options.onPropertiesUpdate?.(data.properties);
      }
    },
  });
  // const sendMessage = async (message: string) => {
  //   try {
  //     await sendMessageMutation.mutateAsync(message);
  //   } catch (error) {
  //     console.error("Failed to send message:", error);
  //   }
  // };
  const sendMessage = useCallback(
    (message: string, options?: { imageData?: string; isVoiceInput?: boolean }) => {
      return sendMessageMutation.mutateAsync({ 
        message, 
        imageData: options?.imageData, 
        isVoiceInput: options?.isVoiceInput 
      });
    },
    [sendMessageMutation]
  );
  const isLoading = sendMessageMutation.isPending;
  const error = sendMessageMutation.error;
  // Removed automatic location detection on mount
  // to improve initial load performance
  // Detect user location on component mount
  // useEffect(() => {
  //   //console.log("[DEBUG2]");
  //   const detectLocation = async () => {
  //     //console.log("[DEBUG3]");
  //     setIsDetectingLocation(true);
  //     try {
  //       const location = await detectUserLocation();
  //       console.log("[DEBUG]", location);
  //       if (location) {
  //         // const locationString = formatLocationString(location);
  //         // setUserLocation(locationString);
  //         setUserLocation(location.address)
  //       }
  //     } catch (error) {
  //       console.warn("Location detection failed:", error);
  //     } finally {
  //       setIsDetectingLocation(false);
  //     }
  //   };

  //   detectLocation();
  // }, []);
  // return {
  //   messages,
  //   sendMessage,
  //   isLoading: sendMessageMutation.isPending,
  //   userLocation,
  //   setUserLocation,
  //   isDetectingLocation,
  // };
  return {
    sessionId,
    messages: chatHistory.reverse(),
    sendMessage,
    isLoading: sendMessageMutation.isPending,
    userLocation,
    setUserLocation,
    isDetectingLocation,
    detectLocation, // Expose manual location detection
    isLoadingHistory,
    error,
  };
}
