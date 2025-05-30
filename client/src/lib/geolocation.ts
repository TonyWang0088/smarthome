// Location detection utilities
export interface LocationData {
  city: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
}

export async function detectUserLocation(): Promise<LocationData | null> {
  try {
    // First try browser geolocation API
    if ('geolocation' in navigator) {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        });
      });

      // Use reverse geocoding to get city information
      const { latitude, longitude } = position.coords;
      const locationData = await reverseGeocode(latitude, longitude);
      
      if (locationData) {
        return {
          ...locationData,
          latitude,
          longitude
        };
      }
    }

    // Fallback to IP-based location
    return await getLocationFromIP();
  } catch (error) {
    console.warn('Location detection failed:', error);
    return null;
  }
}

async function reverseGeocode(lat: number, lng: number): Promise<Pick<LocationData, 'city' | 'region' | 'country'> | null> {
  try {
    // Using a free geocoding service
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
    );
    
    if (!response.ok) throw new Error('Geocoding failed');
    
    const data = await response.json();
    
    return {
      city: data.city || data.locality || 'Unknown',
      region: data.principalSubdivision || data.countryName || 'Unknown',
      country: data.countryName || 'Unknown'
    };
  } catch (error) {
    console.warn('Reverse geocoding failed:', error);
    return null;
  }
}

async function getLocationFromIP(): Promise<LocationData | null> {
  try {
    // Using a free IP geolocation service
    const response = await fetch('https://ipapi.co/json/');
    
    if (!response.ok) throw new Error('IP location failed');
    
    const data = await response.json();
    
    return {
      city: data.city || 'Unknown',
      region: data.region || 'Unknown', 
      country: data.country_name || 'Unknown',
      latitude: data.latitude || 0,
      longitude: data.longitude || 0
    };
  } catch (error) {
    console.warn('IP-based location detection failed:', error);
    return null;
  }
}

export function formatLocationString(location: LocationData): string {
  if (location.city && location.region) {
    return `${location.city}, ${location.region}`;
  } else if (location.city) {
    return location.city;
  } else if (location.region) {
    return location.region;
  } else {
    return 'Unknown Location';
  }
}