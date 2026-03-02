// netlify/functions/search.js
// Web search using Brave Search API (2,000 free queries/month)
// Alternative: use SerpAPI or Serper.dev

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { query, type = "web", count = 10 } = JSON.parse(event.body);

    const apiKey = process.env.BRAVE_SEARCH_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Search API key not configured" }),
      };
    }

    const url = new URL("https://api.search.brave.com/res/v1/web/search");
    url.searchParams.set("q", query);
    url.searchParams.set("count", Math.min(count, 20));
    url.searchParams.set("safesearch", "moderate");

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Search API error: ${response.status}`);
    }

    const data = await response.json();

    // Normalize results
    const results = (data.web?.results || []).map((r) => ({
      title: r.title,
      url: r.url,
      description: r.description,
      age: r.age,
    }));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: true, results, query }),
    };
  } catch (err) {
    console.error("Search error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: err.message }),
    };
  }
};
