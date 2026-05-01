"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BlogDrawer from "@/app/components/BlogDrawer";

// react-markdown is optional — render plain text fallback if not installed
let ReactMarkdown;
try { ReactMarkdown = require("react-markdown").default; } catch {}

export default function BlogPostClient({ blog, sectionsParam }) {
  const router = useRouter();
  const [selectedSectionIds, setSelectedSectionIds] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    if (sectionsParam) {
      setSelectedSectionIds(sectionsParam.split(",").filter(Boolean));
    } else {
      setSelectedSectionIds(blog.sections.map((s) => s.id));
    }
  }, [sectionsParam, blog.id]);

  const totalReadTime = blog.sections.reduce(
    (acc, curr) => acc + curr.readTime,
    0
  );
  const selectedSections = blog.sections.filter((s) =>
    selectedSectionIds.includes(s.id)
  );
  const personalizedReadTime = selectedSections.reduce(
    (acc, curr) => acc + curr.readTime,
    0
  );

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
            <button
              className="nav-tab"
              onClick={() => router.push("/blogs")}
            >
              ← All Blogs
            </button>
            <button className="nav-tab" onClick={() => router.push("/")}>
              Back to App
            </button>
          </nav>
        </div>
      </div>

      <div className="blog-page-wrap">
        <img
          src={blog.image}
          alt={blog.headline}
          className="blog-page-img"
        />

        <h1 className="blog-page-title">{blog.headline}</h1>

        <div className="blog-read-time">
          {personalizedReadTime < totalReadTime ? (
            <>
              <span className="blog-read-time-strike">
                {totalReadTime} min read
              </span>
              <span className="blog-read-time-actual">
                {personalizedReadTime} min personalized read
              </span>
            </>
          ) : (
            <span className="blog-read-time-actual">
              {totalReadTime} min read
            </span>
          )}
        </div>

        <div className="blog-section-content">
          {selectedSections.map((section) => (
            <div key={section.id}>
              {ReactMarkdown ? (
                <ReactMarkdown>{section.content}</ReactMarkdown>
              ) : (
                <p style={{ whiteSpace: "pre-wrap" }}>{section.content}</p>
              )}
            </div>
          ))}
        </div>

        {selectedSections.length === 0 && (
          <div className="empty-wrap">
            <div className="empty-title">No sections selected</div>
            <div className="empty-desc">
              Click &quot;Change Preferences&quot; to pick what you want to
              read.
            </div>
          </div>
        )}

        <button
          className="blog-preferences-btn"
          onClick={() => setIsDrawerOpen(true)}
        >
          Change Preferences
        </button>
      </div>

      <BlogDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        blog={blog}
        initialSections={selectedSectionIds}
      />
    </div>
  );
}
