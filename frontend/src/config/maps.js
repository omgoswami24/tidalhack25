// Google Maps Configuration
// To get your API key:
// 1. Go to https://console.cloud.google.com/
// 2. Create a new project or select existing one
// 3. Enable "Maps JavaScript API" and "Maps Embed API"
// 4. Create credentials > API Key
// 5. Replace 'YOUR_API_KEY_HERE' with your actual API key

export const GOOGLE_MAPS_API_KEY = 'AIzaSyAlEeRnIhuWWtzDYCybVSvIMF9O9NMbygs';

// Fallback: If no API key is provided, we'll use a static map image
export const getStaticMapUrl = (lat, lng, zoom = 15) => {
  return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=400x200&maptype=roadmap&markers=color:red%7C${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`;
};

export const getEmbedMapUrl = (lat, lng, zoom = 15) => {
  if (GOOGLE_MAPS_API_KEY === 'YOUR_API_KEY_HERE') {
    // Return a fallback URL that opens Google Maps directly
    return `https://www.google.com/maps/@${lat},${lng},${zoom}z`;
  }
  return `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_API_KEY}&q=${lat},${lng}&zoom=${zoom}&maptype=roadmap`;
};
