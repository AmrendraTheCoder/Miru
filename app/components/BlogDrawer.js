"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BlogDrawer({ isOpen, onClose, blog }) {
  const router = useRouter();
  const [selected, setSelected] = useState(new Set());
  const [isVisible, setIsVisible] = useState(false);

  // Reset selection when blog changes
  useEffect(() => {
    if (blog) setSelected(new Set());
  }, [blog?.id]);

  // Handle open/close animation
  useEffect(() => {
    if (isOpen) {
      // Mount first, then animate in on next frame
      setIsVisible(true);
    } else {
      // Animate out, then unmount
      const t = setTimeout(() => setIsVisible(false), 380);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  if (!isVisible || !blog) return null;

  const totalReadTime = blog.sections.reduce((a, s) => a + s.readTimeMinutes, 0);
  const selectedReadTime = blog.sections
    .filter((_, i) => selected.has(i))
    .reduce((a, s) => a + s.readTimeMinutes, 0);

  const toggleSection = (index) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === blog.sections.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(blog.sections.map((_, i) => i)));
    }
  };

  const allSelected = selected.size === blog.sections.length;
  const noneSelected = selected.size === 0;

  const handleGoToBlog = () => {
    if (noneSelected) return;
    const sectionsParam = allSelected
      ? "all"
      : [...selected].sort().join(",");
    router.push(`/blogs/${blog.id}?sections=${sectionsParam}`);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`drawer-backdrop ${isOpen ? "open" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom sheet */}
      <div
        className={`drawer-sheet ${isOpen ? "open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={`Preview: ${blog.headline}`}
      >
        {/* Drag handle */}
        <div className="drawer-handle" />

        <div className="drawer-scroll">
          {/* 1. Blog image */}
          <img
            src={blog.image}
            alt={blog.headline}
            className="drawer-img"
            loading="lazy"
          />

          {/* 2. Headline */}
          <h2 className="drawer-headline">{blog.headline}</h2>

          {/* 3. Description */}
          <p className="drawer-desc">{blog.description}</p>

          {/* Read time preview */}
          {!noneSelected && (
            <div className="drawer-read-preview">
              {allSelected || selected.size === 0 ? (
                <span>{totalReadTime} min read</span>
              ) : (
                <>
                  <span className="drawer-read-strike">{totalReadTime} min</span>
                  <span className="drawer-read-custom">{selectedReadTime} min personalized</span>
                </>
              )}
            </div>
          )}

          {/* 4. Section preference selector */}
          <div className="drawer-prefs">
            <div className="drawer-prefs-label">What do you want to read?</div>

            {/* "Read everything" option */}
            <label className={`drawer-check-item drawer-check-all ${allSelected ? "checked" : ""}`}>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="drawer-check-input"
              />
              <span className="drawer-check-box" aria-hidden="true">
                {allSelected ? "✓" : ""}
              </span>
              <span className="drawer-check-text">I want to read everything</span>
            </label>

            {/* Divider */}
            <div className="drawer-prefs-or">or pick sections</div>

            {/* 5 section checkboxes */}
            {blog.sections.map((section, i) => {
              const isChecked = selected.has(i);
              return (
                <label
                  key={i}
                  className={`drawer-check-item ${isChecked ? "checked" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleSection(i)}
                    className="drawer-check-input"
                  />
                  <span className="drawer-check-box" aria-hidden="true">
                    {isChecked ? "✓" : ""}
                  </span>
                  <span className="drawer-check-text">
                    {section.title}
                    <span className="drawer-check-meta">{section.readTimeMinutes} min</span>
                  </span>
                </label>
              );
            })}
          </div>

          {/* 5. Go to Blog button */}
          <button
            className={`drawer-go-btn ${noneSelected ? "disabled" : ""}`}
            onClick={handleGoToBlog}
            disabled={noneSelected}
            aria-disabled={noneSelected}
          >
            {noneSelected ? "Select at least one section" : "Go to Blog →"}
          </button>
        </div>
      </div>
    </>
  );
}
