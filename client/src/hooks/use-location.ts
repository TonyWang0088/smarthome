import { useState, useEffect } from "react";
import { detectUserLocation, type LocationData, type GeolocationError, getLocationErrorMessage } from "@/lib/geolocation";

export function useLocation() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLocation = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const locationData = await detectUserLocation();
      setLocation(locationData);
    } catch (err) {
      const error = err as GeolocationError;
      setError(getLocationErrorMessage(error));
      
      // Fallback to Vancouver, BC
      setLocation({
        city: "Vancouver",
        region: "British Columbia",
        country: "Canada",
        latitude: 49.2827,
        longitude: -123.1207,
        address: "Vancouver, BC (Default)"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLocation();
  }, []);

  return {
    location,
    isLoading,
    error,
    refetch: fetchLocation
  };
}
