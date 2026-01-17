export interface PlaceDetails {
  place_id: string;
  name: string;
  formatted_address: string;
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  opening_hours?: {
    open_now?: boolean;
    weekday_text?: string[];
  };
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types?: string[];
  website?: string;
  formatted_phone_number?: string;
}

export interface DistanceResult {
  origin: string;
  destination: string;
  distance: {
    text: string;
    value: number; // in meters
  };
  duration: {
    text: string;
    value: number; // in seconds
  };
  status: string;
}

/**
 * Search for places using Google Places API (Text Search)
 */
export async function searchPlaces(
  query: string,
  location?: string
): Promise<PlaceDetails[]> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error('Google Maps API key not configured');
  }

  const params = new URLSearchParams({
    query,
    key: apiKey,
  });

  if (location) {
    params.append('location', location);
    params.append('radius', '5000'); // 5km radius
  }

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/textsearch/json?${params.toString()}`
  );

  const data = await response.json();

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(`Places API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
  }

  return data.results || [];
}

/**
 * Get detailed information about a specific place
 */
export async function getPlaceDetails(placeId: string): Promise<PlaceDetails> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error('Google Maps API key not configured');
  }

  const params = new URLSearchParams({
    place_id: placeId,
    fields: 'place_id,name,formatted_address,rating,user_ratings_total,price_level,opening_hours,geometry,types,website,formatted_phone_number',
    key: apiKey,
  });

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`
  );

  const data = await response.json();

  if (data.status !== 'OK') {
    throw new Error(`Place Details API error: ${data.status}`);
  }

  return data.result;
}

/**
 * Calculate distance and duration between multiple locations
 */
export async function getDistanceMatrix(
  origins: string[],
  destinations: string[],
  mode: 'driving' | 'walking' | 'transit' | 'bicycling' = 'driving'
): Promise<DistanceResult[]> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error('Google Maps API key not configured');
  }

  const params = new URLSearchParams({
    origins: origins.join('|'),
    destinations: destinations.join('|'),
    mode,
    key: apiKey,
  });

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/distancematrix/json?${params.toString()}`
  );

  const data = await response.json();

  if (data.status !== 'OK') {
    throw new Error(`Distance Matrix API error: ${data.status}`);
  }

  const results: DistanceResult[] = [];
  data.rows.forEach((row: any, i: number) => {
    row.elements.forEach((element: any, j: number) => {
      results.push({
        origin: origins[i],
        destination: destinations[j],
        distance: element.distance,
        duration: element.duration,
        status: element.status,
      });
    });
  });

  return results;
}

/**
 * Generate a static map URL with markers
 */
export function getStaticMapUrl(
  locations: Array<{ lat: number; lng: number; label?: string }>,
  width: number = 600,
  height: number = 400
): string {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error('Google Maps API key not configured');
  }

  const markers = locations.map((loc, i) => {
    const label = loc.label || String.fromCharCode(65 + i); // A, B, C...
    return `markers=label:${label}|${loc.lat},${loc.lng}`;
  }).join('&');

  return `https://maps.googleapis.com/maps/api/staticmap?${markers}&size=${width}x${height}&key=${apiKey}`;
}

/**
 * Generate a directions map URL
 */
export function getDirectionsUrl(
  origin: string,
  destination: string,
  waypoints?: string[]
): string {
  const params = new URLSearchParams({
    api: '1',
    origin,
    destination,
  });

  if (waypoints && waypoints.length > 0) {
    params.append('waypoints', waypoints.join('|'));
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
