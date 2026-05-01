"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BlogDrawer from "@/app/components/BlogDrawer";

export default function BlogsListingClient({ blogs }) {
  const router = useRouter();
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const openDrawer = (blog) => {
    setSelectedBlog(blog);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };

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
            <button className="nav-tab" onClick={() => router.push("/")}>← App</button>
          </nav>
        </div>
      </div>

      <div className="blog-list-wrap">
        <div className="blog-list-header">
          <h1 className="blog-list-title">Miru Insights</h1>
          <p className="blog-list-subtitle">
            Deep-dive reads on startup funding, founder playbooks, and market intelligence.
          </p>
        </div>

        <div className="blog-list-grid">
          {blogs.map((blog) => {
            const totalReadTime = blog.sections.reduce(
              (acc, s) => acc + s.readTimeMinutes, 0
            );

            return (
              <article
                key={blog.id}
                className="blog-card"
                onClick={() => openDrawer(blog)}
                role="button"
                tabIndex={0}
                aria-label={`Preview: ${blog.headline}`}
                onKeyDown={(e) => e.key === "Enter" && openDrawer(blog)}
              >
                <img
                  src={blog.image}
                  alt={blog.headline}
                  className="blog-card-img"
                  loading="lazy"
                />
                <div className="blog-card-body">
                  <h2 className="blog-card-title">{blog.headline}</h2>
                  <p className="blog-card-desc">{blog.description}</p>
                  <div className="blog-card-footer">
                    <span className="blog-card-meta">{totalReadTime} min read</span>
                    <span className="blog-card-sections">{blog.sections.length} sections</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <BlogDrawer
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
        blog={selectedBlog}
      />
    </div>
  );
}
