// src/hooks/useClaude.js
import { useState, useCallback } from "react";
import { askClaude } from "../lib/api";

export function useClaude() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const ask = useCallback(async (userMessage, systemContext, options = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await askClaude({
        messages: [{ role: "user", content: userMessage }],
        systemContext,
        ...options,
      });
      return result;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const chat = useCallback(async (messages, systemContext, options = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await askClaude({ messages, systemContext, ...options });
      return result;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { ask, chat, loading, error };
}
