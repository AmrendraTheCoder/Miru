"use client";
import { useState, useEffect } from "react";
import { dummyBlogs } from "@/lib/blogs";

export default function BlogTicker({ onBlogClick }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animState, setAnimState] = useState("active"); // "enter", "active", "exit"

  useEffect(() => {
    // 5 second cycle:
    // 0s -> "active" (headline is visible)
    // 4.4s -> "exit" (starts sliding out)
    // 5.0s -> increment index, set to "enter" (starts sliding in)
    // 5.1s -> "active" (slides into view)

    const cycleInterval = setInterval(() => {
      setAnimState("exit");
      
      setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % dummyBlogs.length);
        setAnimState("enter");
        
        // Small delay to allow React to render the "enter" state before moving to "active"
        setTimeout(() => {
          setAnimState("active");
        }, 50);
      }, 600); // 600ms matches the CSS transition duration
      
    }, 5000);

    return () => clearInterval(cycleInterval);
  }, []);

  return (
    <div className="ticker-wrap" aria-label="Blog Ticker">
      <div className="blog-ticker-track">
        {dummyBlogs.map((blog, idx) => {
          // Determine class based on index
          let className = "blog-ticker-item";
          if (idx === currentIndex) {
            className += ` ${animState}`;
          } else if (
            (idx === currentIndex - 1) || 
            (currentIndex === 0 && idx === dummyBlogs.length - 1)
          ) {
            // Previous item might still be exiting
            if (animState === "enter") {
              className += " exit";
            } else {
               className += " exit"; // Just keep it off-screen left
               // Actually we want it to stay out of sight unless it's the active one exiting.
               // Let's rely on standard 'enter' / 'exit' classes
            }
          } else {
             // By default, non-active items should just be in 'enter' state (off-screen right)
             // to prepare for when they become active.
             className += " enter";
          }

          // A simpler approach for the classes:
          let itemClass = "blog-ticker-item";
          if (idx === currentIndex) {
            itemClass += ` ${animState}`;
          } else if (idx === (currentIndex === 0 ? dummyBlogs.length - 1 : currentIndex - 1)) {
            itemClass += " exit"; // Previous item stays on the left
          } else {
            itemClass += " enter"; // Next items wait on the right
          }

          return (
            <div 
              key={blog.id} 
              className={itemClass}
              onClick={() => onBlogClick(blog)}
            >
              {blog.headline}
            </div>
          );
        })}
      </div>
    </div>
  );
}
