// src/components/AIAssistant.js
import { useState, useRef, useEffect } from "react";
import { useClaude } from "../hooks/useClaude";
import { useApp } from "../lib/AppContext";

const QUICK_PROMPTS = [
  "What's on the schedule this week?",
  "Draft a message for Marcus about today",
  "What medications does Theo need today?",
  "Remind me what's due this week",
];

export default function AIAssistant({ onClose }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm your carry. assistant. I know your family's schedule, the kids' info, and can help you draft messages for Marcus. What do you need?" }
  ]);
  const { ask, loading } = useClaude();
  const { getFamilyContext } = useApp();
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text) => {
    if (!text.trim()) return;
    const userMsg = { role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    setInput("");

    // Build full conversation history for Claude
    const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));

    const result = await ask(
      text,
      getFamilyContext(),
      { messages: history }
    );

    if (result?.message) {
      setMessages((m) => [...m, { role: "assistant", content: result.message }]);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.panel}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.aiDot} />
            <span style={styles.headerTitle}>carry. AI</span>
          </div>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        {/* Messages */}
        <div style={styles.messages}>
          {messages.map((m, i) => (
            <div key={i} style={m.role === "user" ? styles.userBubble : styles.aiBubble}>
              {m.content}
            </div>
          ))}
          {loading && (
            <div style={styles.aiBubble}>
              <span style={styles.typing}>●●●</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick prompts */}
        {messages.length <= 1 && (
          <div style={styles.quickPrompts}>
            {QUICK_PROMPTS.map((q) => (
              <button key={q} style={styles.quickBtn} onClick={() => send(q)}>{q}</button>
            ))}
          </div>
        )}

        {/* Input */}
        <div style={styles.inputRow}>
          <input
            style={styles.input}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about your family..."
            onKeyDown={(e) => e.key === "Enter" && send(input)}
          />
          <button style={styles.sendBtn} onClick={() => send(input)} disabled={loading}>
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" },
  panel: { width: "100%", maxWidth: 430, background: "#FDF8F3", borderRadius: "20px 20px 0 0", height: "70vh", display: "flex", flexDirection: "column", overflow: "hidden" },
  header: { padding: "16px 20px", borderBottom: "1px solid #F5EDE0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff" },
  headerLeft: { display: "flex", alignItems: "center", gap: 8 },
  aiDot: { width: 8, height: 8, borderRadius: "50%", background: "#E8825A", boxShadow: "0 0 0 3px #F2C4A8" },
  headerTitle: { fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 700, color: "#2A1F1A" },
  closeBtn: { border: "none", background: "none", fontSize: 18, cursor: "pointer", color: "#8C7B72" },
  messages: { flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 10 },
  aiBubble: { background: "#fff", border: "1px solid #F5EDE0", borderRadius: "4px 16px 16px 16px", padding: "10px 14px", fontSize: 14, color: "#2A1F1A", lineHeight: 1.5, maxWidth: "85%", alignSelf: "flex-start" },
  userBubble: { background: "#E8825A", borderRadius: "16px 4px 16px 16px", padding: "10px 14px", fontSize: 14, color: "#fff", lineHeight: 1.5, maxWidth: "85%", alignSelf: "flex-end" },
  typing: { letterSpacing: 4, color: "#8C7B72", fontSize: 12 },
  quickPrompts: { padding: "0 16px 12px", display: "flex", flexDirection: "column", gap: 6 },
  quickBtn: { background: "#F5EDE0", border: "none", borderRadius: 10, padding: "9px 14px", fontSize: 13, color: "#2A1F1A", cursor: "pointer", textAlign: "left", fontFamily: "inherit" },
  inputRow: { padding: "12px 16px 28px", display: "flex", gap: 8, background: "#fff", borderTop: "1px solid #F5EDE0" },
  input: { flex: 1, border: "1.5px solid #F5EDE0", borderRadius: 12, padding: "10px 14px", fontSize: 14, fontFamily: "inherit", outline: "none", background: "#FDF8F3", color: "#2A1F1A" },
  sendBtn: { width: 40, height: 40, borderRadius: "50%", background: "#E8825A", border: "none", color: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
};
