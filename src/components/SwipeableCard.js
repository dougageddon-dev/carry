// src/components/SwipeableCard.js
import { useState, useRef, useEffect, useCallback } from "react";

const REVEAL_THRESHOLD = 55;
const DELETE_THRESHOLD = 130;
const BTN_WIDTH = 76;

export default function SwipeableCard({
  children, onDelete, onTap, style,
  hintDelay = 0, archiveMode = true,
}) {
  const [offset, setOffset] = useState(0);
  const [snapped, setSnapped] = useState(false);
  const [animating, setAnimating] = useState(true);
  const [exiting, setExiting] = useState(false);

  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const didDrag = useRef(false);
  const isScrollGesture = useRef(false);
  const offsetRef = useRef(0); // track offset without re-render lag
  const snappedRef = useRef(false);

  // keep refs in sync
  useEffect(() => { offsetRef.current = offset; }, [offset]);
  useEffect(() => { snappedRef.current = snapped; }, [snapped]);

  // Hint animation
  useEffect(() => {
    if (!hintDelay) return;
    const t = setTimeout(() => {
      setAnimating(true);
      setOffset(-28);
      const t2 = setTimeout(() => setOffset(0), 420);
      return () => clearTimeout(t2);
    }, hintDelay);
    return () => clearTimeout(t);
  }, [hintDelay]);

  const snapClose = useCallback(() => {
    setAnimating(true); setOffset(0); setSnapped(false);
  }, []);

  const snapOpen = useCallback(() => {
    setAnimating(true); setOffset(-BTN_WIDTH); setSnapped(true);
  }, []);

  const doArchive = useCallback(() => {
    setAnimating(true); setExiting(true); setOffset(-400);
    setTimeout(() => onDelete(), 260);
  }, [onDelete]);

  const onTouchStart = useCallback((e) => {
    if (exiting) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    didDrag.current = false;
    isScrollGesture.current = false;
    setAnimating(false);
  }, [exiting]);

  const onTouchMove = useCallback((e) => {
    if (exiting || isScrollGesture.current) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;

    // Determine intent on first real movement
    if (!didDrag.current) {
      if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
      if (Math.abs(dy) >= Math.abs(dx)) {
        isScrollGesture.current = true;
        setAnimating(true);
        return;
      }
      didDrag.current = true;
    }

    e.preventDefault();
    const base = snappedRef.current ? -BTN_WIDTH : 0;
    const next = Math.min(6, Math.max(-200, base + dx));
    setOffset(next);
  }, [exiting]);

  const onTouchEnd = useCallback(() => {
    if (exiting) return;
    setAnimating(true);

    if (isScrollGesture.current || !didDrag.current) {
      // Was a tap or a scroll — don't snap
      if (!isScrollGesture.current) {
        if (snappedRef.current) snapClose();
        else onTap?.();
      }
      return;
    }

    const cur = offsetRef.current;
    if (cur < -DELETE_THRESHOLD) doArchive();
    else if (cur < -REVEAL_THRESHOLD) snapOpen();
    else snapClose();

    didDrag.current = false;
  }, [exiting, snapClose, snapOpen, doArchive, onTap]);

  const color = archiveMode ? "#5A9E72" : "#C0392B";
  const btnOpacity = Math.min(1, Math.abs(offset) / (BTN_WIDTH * 0.6));

  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: 16, marginBottom: 10 }}>
      {/* Archive/delete button */}
      <div onClick={doArchive} style={{
        position: "absolute", right: 0, top: 0, bottom: 0, width: BTN_WIDTH,
        background: color, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 3,
        borderRadius: "0 16px 16px 0", cursor: "pointer", opacity: btnOpacity,
      }}>
        <span style={{ fontSize: 22 }}>{archiveMode ? "🗂️" : "🗑️"}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>
          {archiveMode ? "Archive" : "Delete"}
        </span>
      </div>

      {/* Card */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
        onClick={() => {
          if (!didDrag.current) {
            if (snappedRef.current) snapClose();
            else onTap?.();
          }
        }}
        style={{
          transform: `translateX(${offset}px)`,
          transition: animating ? "transform 0.26s cubic-bezier(0.25,0.46,0.45,0.94)" : "none",
          opacity: exiting ? 0 : 1,
          willChange: "transform",
          touchAction: "pan-y", // allow vertical scroll, intercept horizontal in JS
          ...style,
        }}
      >
        {children}
      </div>
    </div>
  );
}
