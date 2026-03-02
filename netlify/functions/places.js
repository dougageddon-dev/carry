// netlify/functions/places.js
// Proxies Google Places API requests to keep API key server-side

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Google Places API key not configured" }),
    };
  }

  try {
    const { action, params } = JSON.parse(event.body);

    let url;
    let queryParams = new URLSearchParams({ key: apiKey });

    if (action === "textsearch") {
      // Search businesses by text query
      url = "https://maps.googleapis.com/maps/api/place/textsearch/json";
      queryParams.set("query", params.query);
      if (params.location) queryParams.set("location", params.location);
      if (params.radius) queryParams.set("radius", params.radius || 10000);
      if (params.type) queryParams.set("type", params.type);
    } else if (action === "nearbysearch") {
      // Search nearby places
      url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json";
      queryParams.set("location", params.location);
      queryParams.set("radius", params.radius || 5000);
      if (params.keyword) queryParams.set("keyword", params.keyword);
      if (params.type) queryParams.set("type", params.type);
    } else if (action === "details") {
      // Get place details
      url = "https://maps.googleapis.com/maps/api/place/details/json";
      queryParams.set("place_id", params.place_id);
      queryParams.set("fields", params.fields || "name,formatted_address,formatted_phone_number,website,opening_hours,rating,reviews");
    } else if (action === "autocomplete") {
      // Autocomplete for address search
      url = "https://maps.googleapis.com/maps/api/place/autocomplete/json";
      queryParams.set("input", params.input);
      if (params.types) queryParams.set("types", params.types);
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: `Unknown action: ${action}` }),
      };
    }

    const response = await fetch(`${url}?${queryParams.toString()}`);
    const data = await response.json();

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: true, ...data }),
    };
  } catch (err) {
    console.error("Places API error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: err.message }),
    };
  }
};
