// netlify/functions/claude.js
// Serverless function — keeps API key secure on server side

const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CARRY_SYSTEM_PROMPT = `You are an AI assistant built into "carry." — a parenting mental load sharing app.
Your role is to help the primary organizer (usually a mom) manage schedules, kids' info, medical details, 
camp searches, and communicate relevant info to co-parents (usually dads).

You have access to:
- Kids' profiles (names, ages, schools, doctors, medications, allergies, activities)
- Family schedules and upcoming events
- Reminders and deadlines

Your tone is: warm, organized, practical, and supportive. Never preachy.

When generating messages to send to the co-parent:
- Be concise and clear — dads need the key facts fast
- Use friendly language, not clinical
- Include relevant logistics (times, locations, what to bring)
- Add emoji sparingly for readability

When searching for camps/activities:
- Summarize key details: age range, dates, price, location
- Flag if spots are limited
- Suggest 2-3 options max unless asked for more

Always respond in JSON when the request_type is "structured", plain text otherwise.`;

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const body = JSON.parse(event.body);
    const { messages, systemContext, requestType = "chat", maxTokens = 1024 } = body;

    // Build the full system prompt with optional family context
    const fullSystem = systemContext
      ? `${CARRY_SYSTEM_PROMPT}\n\n--- FAMILY CONTEXT ---\n${systemContext}`
      : CARRY_SYSTEM_PROMPT;

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      system: fullSystem,
      messages: messages,
    });

    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");

    // If structured, try to parse JSON
    if (requestType === "structured") {
      try {
        const clean = text.replace(/```json|```/g, "").trim();
        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ success: true, data: JSON.parse(clean), raw: text }),
        };
      } catch {
        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ success: true, data: null, raw: text }),
        };
      }
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: true, message: text }),
    };
  } catch (err) {
    console.error("Claude API error:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: false, error: err.message }),
    };
  }
};
