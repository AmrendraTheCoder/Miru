"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BlogDrawer from "@/app/components/BlogDrawer";

export default function BlogPostClient({ blog, sectionsParam }) {
  const router = useRouter();
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Parse sections param on mount / change
  useEffect(() => {
    if (!blog) return;
    if (!sectionsParam || sectionsParam === "all") {
      // All sections
      setSelectedIndices(blog.sections.map((_, i) => i));
    } else {
      const parsed = sectionsParam
        .split(",")
        .map(Number)
        .filter((n) => !isNaN(n) && n >= 0 && n < blog.sections.length);
      setSelectedIndices(parsed.length > 0 ? parsed : blog.sections.map((_, i) => i));
    }
  }, [sectionsParam, blog?.id]);

  if (!blog) return null;

  const totalReadTime = blog.sections.reduce((a, s) => a + s.readTimeMinutes, 0);
  const selectedSections = blog.sections.filter((_, i) => selectedIndices.includes(i));
  const personalizedReadTime = selectedSections.reduce((a, s) => a + s.readTimeMinutes, 0);
  const allSelected = selectedIndices.length === blog.sections.length;

  return (
    <div className="sp-root">
      {/* Header */}
      <div className="header">
        <div className="header-inner">
          <a className="header-logo" href="/">
            <span className="header-logo-box">M</span>
            Miru
          </a>
          <nav className="header-nav">
            <button className="nav-tab" onClick={() => router.push("/blogs")}>← Blogs</button>
          </nav>
        </div>
      </div>

      <article className="blog-page-wrap">
        {/* Hero image */}
        <img
          src={blog.image}
          alt={blog.headline}
          className="blog-page-img"
        />

        {/* Title */}
        <h1 className="blog-page-title">{blog.headline}</h1>

        {/* Personalized read time */}
        <div className="blog-read-time">
          {allSelected ? (
            <span className="blog-read-actual">{totalReadTime} min read</span>
          ) : (
            <>
              <span className="blog-read-strike">{totalReadTime} min read</span>
              <span className="blog-read-actual">{personalizedReadTime} min personalized read</span>
            </>
          )}
        </div>

        {/* Selected section tags */}
        <div className="blog-section-tags">
          {blog.sections.map((s, i) => (
            <span
              key={i}
              className={`blog-section-tag ${selectedIndices.includes(i) ? "active" : "inactive"}`}
            >
              {s.title}
            </span>
          ))}
        </div>

        {/* Content sections — only selected ones */}
        <div className="blog-content">
          {selectedSections.length === 0 ? (
            <div className="blog-empty">
              <p>No sections selected.</p>
              <button className="drawer-go-btn" onClick={() => setIsDrawerOpen(true)}>
                Pick Sections
              </button>
            </div>
          ) : (
            selectedSections.map((section, i) => (
              <section key={i} className="blog-section">
                <h2 className="blog-section-title">{section.title}</h2>
                <p className="blog-section-body">{section.content}</p>
                <div className="blog-section-readtime">{section.readTimeMinutes} min read</div>
              </section>
            ))
          )}
        </div>

        {/* Change preferences button */}
        <button
          className="blog-prefs-btn"
          onClick={() => setIsDrawerOpen(true)}
          aria-label="Change reading preferences"
        >
          ✦ Change Preferences
        </button>
      </article>

      {/* Preference drawer */}
      <BlogDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        blog={blog}
      />
    </div>
  );
}
