// netlify/functions/places.js
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "GOOGLE_PLACES_API_KEY environment variable is not set" }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON body" }) };
  }

  const { action, params } = body;

  try {
    let url;
    const queryParams = new URLSearchParams({ key: apiKey });

    if (action === "textsearch") {
      url = "https://maps.googleapis.com/maps/api/place/textsearch/json";
      queryParams.set("query", params.query);
      if (params.location) queryParams.set("location", params.location);
      if (params.radius) queryParams.set("radius", String(params.radius));
      if (params.type) queryParams.set("type", params.type);
    } else if (action === "nearbysearch") {
      url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json";
      queryParams.set("location", params.location);
      queryParams.set("radius", String(params.radius || 5000));
      if (params.keyword) queryParams.set("keyword", params.keyword);
      if (params.type) queryParams.set("type", params.type);
    } else if (action === "details") {
      url = "https://maps.googleapis.com/maps/api/place/details/json";
      queryParams.set("place_id", params.place_id);
      queryParams.set("fields", params.fields || "name,formatted_address,formatted_phone_number,website,opening_hours,rating,user_ratings_total,price_level,types");
    } else if (action === "autocomplete") {
      url = "https://maps.googleapis.com/maps/api/place/autocomplete/json";
      queryParams.set("input", params.input);
      if (params.types) queryParams.set("types", params.types);
    } else if (action === "geocode") {
      url = "https://maps.googleapis.com/maps/api/geocode/json";
      queryParams.set("address", params.address);
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: `Unknown action: ${action}` }),
      };
    }

    const response = await fetch(`${url}?${queryParams.toString()}`);
    const data = await response.json();

    // Pass Google's response through directly (includes status, results, error_message)
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(data),
    };
  } catch (err) {
    console.error("Places function error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
