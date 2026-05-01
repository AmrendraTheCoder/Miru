"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { dummyBlogs } from "@/lib/blogs";
import BlogDrawer from "@/app/components/BlogDrawer";
import ReactMarkdown from 'react-markdown';

export default function BlogPost() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [blog, setBlog] = useState(null);
  const [selectedSectionIds, setSelectedSectionIds] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    
    const foundBlog = dummyBlogs.find(b => b.id === params.id);
    if (!foundBlog) {
      router.push("/blogs");
      return;
    }
    
    setBlog(foundBlog);
    
    const sectionsParam = searchParams.get("sections");
    if (sectionsParam) {
      setSelectedSectionIds(sectionsParam.split(","));
    } else {
      // Default to all if none provided
      setSelectedSectionIds(foundBlog.sections.map(s => s.id));
    }
  }, [params.id, searchParams]);

  if (!blog) return null;

  const totalReadTime = blog.sections.reduce((acc, curr) => acc + curr.readTime, 0);
  const selectedSections = blog.sections.filter(s => selectedSectionIds.includes(s.id));
  const personalizedReadTime = selectedSections.reduce((acc, curr) => acc + curr.readTime, 0);

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

      <div className="blog-page-wrap">
        <img src={blog.image} alt={blog.headline} className="blog-page-img" />
        
        <h1 className="blog-page-title">{blog.headline}</h1>
        
        <div className="blog-read-time">
          {personalizedReadTime < totalReadTime ? (
            <>
              <span className="blog-read-time-strike">{totalReadTime} min read</span>
              <span className="blog-read-time-actual">{personalizedReadTime} min personalized read</span>
            </>
          ) : (
            <span className="blog-read-time-actual">{totalReadTime} min read</span>
          )}
        </div>

        <div className="blog-section-content">
          {selectedSections.map(section => (
            <div key={section.id}>
              <ReactMarkdown>{section.content}</ReactMarkdown>
            </div>
          ))}
        </div>

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
