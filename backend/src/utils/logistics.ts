interface MetroHub {
  city: string;
  lat: number;
  lng: number;
}

const METRO_HUBS: MetroHub[] = [
  { city: "Chennai Hub", lat: 13.0827, lng: 80.2707 },
  { city: "Bengaluru Hub", lat: 12.9716, lng: 77.5946 },
  { city: "Mumbai Hub", lat: 19.076, lng: 72.8777 },
  { city: "Delhi Hub", lat: 28.6139, lng: 77.209 },
  { city: "Hyderabad Hub", lat: 17.385, lng: 78.4867 },
  { city: "Kolkata Hub", lat: 22.5726, lng: 88.3639 },
];

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Fetch live coordinates from Nominatim API
async function fetchCityCoordinates(city: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&countrycodes=in&format=json&limit=1`,
      {
        headers: {
          "User-Agent": "AgenticCommerceEngine/1.0 (contact@yourdomain.com)",
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }
  } catch (error) {
    console.error("Geocoding lookup error:", error);
  }
  return null;
}

export async function calculateDeliveryEstimate(userCity: string): Promise<{
  nearestHub: string;
  distanceKm: number;
  deliveryDays: number;
}> {
  // 1. Fetch real coordinates dynamically
  console.log("LOGISTICS_DEBUG: Calculating estimate for userCity ->", userCity);

  // 1. Fetch real coordinates dynamically
  const coords = (await fetchCityCoordinates(userCity)) || { lat: 13.0827, lng: 80.2707 }; // Fallback to Chennai

  console.log("LOGISTICS_DEBUG: Resolved Coordinates ->", coords);
  let closestHub = METRO_HUBS[0];
  let minDistance = Infinity;

  // 2. Find nearest hub using Haversine
  for (const hub of METRO_HUBS) {
    const dist = haversineDistance(coords.lat, coords.lng, hub.lat, hub.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closestHub = hub;
    }
  }

  const roundedDistance = Math.round(minDistance);
  const deliveryDays = Math.max(1, Math.min(7, 1 + Math.ceil(roundedDistance / 400)));

  return {
    nearestHub: closestHub.city,
    distanceKm: roundedDistance,
    deliveryDays,
  };
}