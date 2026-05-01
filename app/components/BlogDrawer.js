"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { blogOptions } from "@/lib/blogs";

export default function BlogDrawer({ isOpen, onClose, blog, initialSections = [] }) {
  const router = useRouter();
  
  // Default to all options selected if none provided
  const [selected, setSelected] = useState(
    initialSections.length > 0 ? initialSections : blogOptions.map(opt => opt.id)
  );

  // Update selected when drawer opens if we want to reset or something, 
  // but usually we just keep the state.
  useEffect(() => {
    if (isOpen && initialSections.length > 0) {
      setSelected(initialSections);
    } else if (isOpen && selected.length === 0) {
      setSelected(blogOptions.map(opt => opt.id));
    }
  }, [isOpen, initialSections]);

  const toggleSection = (id) => {
    setSelected(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleGoToBlog = () => {
    if (selected.length === 0 || !blog) return;
    const query = selected.join(",");
    router.push(`/blogs/${blog.id}?sections=${query}`);
    onClose();
  };

  if (!blog) return null;

  return (
    <>
      <div 
        className={`blog-drawer-backdrop ${isOpen ? "open" : ""}`} 
        onClick={onClose}
        style={{ pointerEvents: isOpen ? "auto" : "none" }}
      />
      
      <div className={`blog-drawer-content ${isOpen ? "open" : ""}`}>
        <div className="blog-drawer-header">
          <img src={blog.image} alt={blog.headline} className="blog-drawer-img" />
          <button className="blog-drawer-close" onClick={onClose}>×</button>
        </div>
        
        <div className="blog-drawer-body">
          <h2 className="blog-drawer-title">{blog.headline}</h2>
          <p className="blog-drawer-desc">{blog.description}</p>
          
          <h3 className="blog-drawer-section-title">What do you want from today's blog?</h3>
          <div className="blog-drawer-options">
            {blogOptions.map(opt => (
              <label key={opt.id} className="blog-drawer-option">
                <input 
                  type="checkbox" 
                  className="blog-drawer-checkbox"
                  checked={selected.includes(opt.id)}
                  onChange={() => toggleSection(opt.id)}
                />
                <span className="blog-drawer-option-label">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
        
        <div className="blog-drawer-footer">
          <button 
            className="blog-drawer-cta"
            disabled={selected.length === 0}
            onClick={handleGoToBlog}
          >
            {selected.length === 0 ? "Select at least one section" : "Go to Blog"}
          </button>
        </div>
      </div>
    </>
  );
}
