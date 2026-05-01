"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { blogs } from "@/lib/blogs";

export default function BlogTicker({ onBlogClick }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animState, setAnimState] = useState("active"); // "active" | "exit-left" | "exit-right" | "enter-right" | "enter-left"
  const [isAnimating, setIsAnimating] = useState(false);

  // Drag/swipe state
  const dragStartX = useRef(null);
  const isDragging = useRef(false);
  const timerRef = useRef(null);

  const goTo = useCallback((nextIndex, direction = "left") => {
    if (isAnimating) return;
    setIsAnimating(true);

    // Exit current slide in the specified direction
    setAnimState(direction === "left" ? "exit-left" : "exit-right");

    setTimeout(() => {
      setCurrentIndex(nextIndex);
      setAnimState(direction === "left" ? "enter-right" : "enter-left");

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimState("active");
          setTimeout(() => setIsAnimating(false), 500);
        });
      });
    }, 450);
  }, [isAnimating]);

  const goNext = useCallback(() => {
    const next = (currentIndex + 1) % blogs.length;
    goTo(next, "left");
  }, [currentIndex, goTo]);

  const goPrev = useCallback(() => {
    const prev = (currentIndex - 1 + blogs.length) % blogs.length;
    goTo(prev, "right");
  }, [currentIndex, goTo]);

  // Auto-advance timer
  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      goNext();
    }, 5000);
  }, [goNext]);

  useEffect(() => {
    resetTimer();
    return () => clearInterval(timerRef.current);
  }, [resetTimer]);

  // Touch handlers
  const handleTouchStart = (e) => {
    dragStartX.current = e.touches[0].clientX;
    isDragging.current = true;
  };

  const handleTouchEnd = (e) => {
    if (!isDragging.current || dragStartX.current === null) return;
    const delta = dragStartX.current - e.changedTouches[0].clientX;
    isDragging.current = false;
    dragStartX.current = null;

    if (Math.abs(delta) > 40) {
      resetTimer();
      delta > 0 ? goNext() : goPrev();
    }
  };

  // Mouse drag handlers (desktop)
  const handleMouseDown = (e) => {
    dragStartX.current = e.clientX;
    isDragging.current = true;
  };

  const handleMouseUp = (e) => {
    if (!isDragging.current || dragStartX.current === null) return;
    const delta = dragStartX.current - e.clientX;
    isDragging.current = false;
    dragStartX.current = null;

    if (Math.abs(delta) > 40) {
      resetTimer();
      delta > 0 ? goNext() : goPrev();
    }
  };

  const handleMouseLeave = () => {
    isDragging.current = false;
    dragStartX.current = null;
  };

  const handleClick = (e) => {
    // Only fire click if not a drag
    if (Math.abs(dragStartX.current) > 0) return;
    onBlogClick?.(blogs[currentIndex]);
  };

  const blog = blogs[currentIndex];

  return (
    <div className="ticker-wrap">
      {/* Slide track */}
      <div
        className="ticker-track"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <div
          className={`ticker-headline ${animState}`}
          onClick={handleClick}
          role="button"
          tabIndex={0}
          aria-label={`Read blog: ${blog.headline}`}
          onKeyDown={(e) => e.key === "Enter" && onBlogClick?.(blog)}
        >
          <span className="ticker-label">Miru Insights</span>
          <span className="ticker-text">{blog.headline}</span>
          <span className="ticker-cta">Read →</span>
        </div>
      </div>

      {/* Dot indicators */}
      <div className="ticker-dots" aria-hidden="true">
        {blogs.map((_, i) => (
          <button
            key={i}
            className={`ticker-dot ${i === currentIndex ? "active" : ""}`}
            onClick={() => {
              resetTimer();
              goTo(i, i > currentIndex ? "left" : "right");
            }}
            aria-label={`Go to blog ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
