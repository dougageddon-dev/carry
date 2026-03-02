// netlify/functions/debug.js — DELETE THIS AFTER FIXING
exports.handler = async () => {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  return {
    statusCode: 200,
    body: JSON.stringify({
      hasKey: !!key,
      keyLength: key ? key.length : 0,
      keyPrefix: key ? key.slice(0, 6) + "..." : "NOT SET",
      allEnvKeys: Object.keys(process.env).filter(k => k.includes("GOOGLE")),
    }),
  };
};
