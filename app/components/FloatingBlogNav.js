"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FloatingBlogNav() {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // If we scroll down (swipe up) by more than 20px, collapse
      if (currentScrollY > lastScrollY + 20) {
        setIsCollapsed(true);
      }
      
      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    
    // Also handle touch swipe for mobile specifically
    let touchStartY = 0;
    const handleTouchStart = (e) => {
      touchStartY = e.touches[0].clientY;
    };
    const handleTouchMove = (e) => {
      const touchEndY = e.touches[0].clientY;
      // If swipe up (finger moves up, Y decreases)
      if (touchStartY - touchEndY > 50) {
        setIsCollapsed(true);
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  const expand = (e) => {
    e.stopPropagation();
    setIsCollapsed(false);
  };

  const navigateToBlogs = () => {
    router.push("/blogs");
  };

  return (
    <div className={`floating-nav-wrap ${isCollapsed ? "floating-nav-icon-mode" : ""}`}>
      {isCollapsed ? (
        <div className="floating-nav-icon" onClick={expand}>
          Blogs
        </div>
      ) : (
        <div className="floating-nav-bar" onClick={navigateToBlogs}>
          <span className="floating-nav-text">Explore our Blogs →</span>
          <button className="floating-nav-btn">View All</button>
        </div>
      )}
    </div>
  );
}
