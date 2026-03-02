// src/components/SwipeableCard.js
import { useState, useRef, useEffect, useCallback } from "react";

const SWIPE_THRESHOLD = 60;   // px to reveal delete
const DELETE_THRESHOLD = 140; // px to auto-delete
const DELETE_BTN_WIDTH = 72;

export default function SwipeableCard({ children, onDelete, onTap, style, hintDelay = 0, archiveMode = true }) {
  const [offset, setOffset] = useState(0);          // current translateX
  const [revealed, setRevealed] = useState(false);  // delete button showing
  const [deleting, setDeleting] = useState(false);
  const startX = useRef(null);
  const startY = useRef(null);
  const isDragging = useRef(false);
  const isScrolling = useRef(false);
  const cardRef = useRef(null);

  // ── Hint animation: briefly slide left then snap back ────────────────────
  useEffect(() => {
    if (hintDelay <= 0) return;
    const timer = setTimeout(() => {
      setOffset(-30);
      const snap = setTimeout(() => setOffset(0), 400);
      return () => clearTimeout(snap);
    }, hintDelay);
    return () => clearTimeout(timer);
  }, [hintDelay]);

  const snapBack = useCallback(() => {
    setOffset(0);
    setRevealed(false);
  }, []);

  const snapOpen = useCallback(() => {
    setOffset(-DELETE_BTN_WIDTH);
    setRevealed(true);
  }, []);

  // Touch handlers
  const onTouchStart = (e) => {
    if (deleting) return;
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isDragging.current = false;
    isScrolling.current = false;
  };

  const onTouchMove = (e) => {
    if (isScrolling.current) return;
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;

    // If moving more vertically than horizontally on first move, treat as scroll
    if (!isDragging.current && Math.abs(dy) > Math.abs(dx)) {
      isScrolling.current = true;
      return;
    }

    // Only left-swipe
    if (dx > 0 && !revealed) return;
    isDragging.current = true;
    e.preventDefault();

    const base = revealed ? -DELETE_BTN_WIDTH : 0;
    const next = Math.min(0, Math.max(-180, base + dx));
    setOffset(next);
  };

  const onTouchEnd = () => {
    if (isScrolling.current || !isDragging.current) return;

    if (offset < -DELETE_THRESHOLD) {
      // Swipe far enough → delete
      setDeleting(true);
      setOffset(-400);
      setTimeout(() => onDelete(), 280);
    } else if (offset < -SWIPE_THRESHOLD) {
      snapOpen();
    } else {
      snapBack();
    }
    isDragging.current = false;
  };

  // Mouse handlers for desktop testing
  const onMouseDown = (e) => {
    if (deleting) return;
    startX.current = e.clientX;
    isDragging.current = false;
  };
  const onMouseMove = useCallback((e) => {
    if (startX.current === null) return;
    const dx = e.clientX - startX.current;
    if (dx > 0 && !revealed) return;
    if (Math.abs(dx) > 5) isDragging.current = true;
    if (!isDragging.current) return;
    const base = revealed ? -DELETE_BTN_WIDTH : 0;
    setOffset(Math.min(0, Math.max(-180, base + dx)));
  }, [revealed]);
  const onMouseUp = useCallback(() => {
    if (!isDragging.current) return;
    if (offset < -DELETE_THRESHOLD) {
      setDeleting(true);
      setOffset(-400);
      setTimeout(() => onDelete(), 280);
    } else if (offset < -SWIPE_THRESHOLD) {
      snapOpen();
    } else {
      snapBack();
    }
    startX.current = null;
    isDragging.current = false;
  }, [offset, onDelete, snapOpen, snapBack]);

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  const handleTap = () => {
    if (isDragging.current) return;
    if (revealed) { snapBack(); return; }
    onTap && onTap();
  };

  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: 16, marginBottom: 10 }}>
      {/* Delete button revealed behind */}
      <div style={{
        position: "absolute", right: 0, top: 0, bottom: 0,
        width: DELETE_BTN_WIDTH,
        background: archiveMode ? "#7BAF8E" : "#E74C3C",
        display: "flex", alignItems: "center", justifyContent: "center",
        borderRadius: "0 16px 16px 0",
        cursor: "pointer",
        opacity: Math.min(1, Math.abs(offset) / DELETE_BTN_WIDTH),
      }} onClick={() => { setDeleting(true); setTimeout(() => onDelete(), 200); }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 22 }}>{archiveMode ? "🗂️" : "🗑️"}</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#fff", marginTop: 2 }}>{archiveMode ? "Archive" : "Delete"}</div>
        </div>
      </div>

      {/* Card itself */}
      <div
        ref={cardRef}
        style={{
          transform: `translateX(${offset}px)`,
          transition: isDragging.current ? "none" : "transform 0.28s cubic-bezier(0.25,0.46,0.45,0.94)",
          opacity: deleting ? 0 : 1,
          ...style,
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onClick={handleTap}
      >
        {children}
      </div>
    </div>
  );
}
