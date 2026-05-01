"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { dummyBlogs } from "@/lib/blogs";
import BlogDrawer from "@/app/components/BlogDrawer";

export default function BlogsListing() {
  const router = useRouter();
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleBlogClick = (blog) => {
    setSelectedBlog(blog);
    setIsDrawerOpen(true);
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
            <button className="nav-tab active" onClick={() => router.push("/blogs")}>Blogs</button>
            <button className="nav-tab" onClick={() => router.push("/")}>Back to App</button>
          </nav>
        </div>
      </div>

      <div className="blog-list-wrap">
        <h1 className="blog-list-title">Explore Miru Insights</h1>
        
        <div className="blog-list-grid">
          {dummyBlogs.map(blog => {
            const totalReadTime = blog.sections.reduce((acc, curr) => acc + curr.readTime, 0);
            
            return (
              <div 
                key={blog.id} 
                className="blog-card"
                onClick={() => handleBlogClick(blog)}
              >
                <img src={blog.image} alt={blog.headline} className="blog-card-img" />
                <div className="blog-card-body">
                  <h2 className="blog-card-title">{blog.headline}</h2>
                  <p className="blog-card-desc">{blog.description}</p>
                  <div className="blog-card-meta">
                    {totalReadTime} min total read
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <BlogDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        blog={selectedBlog}
      />
    </div>
  );
}
