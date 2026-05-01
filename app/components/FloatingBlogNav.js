"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function FloatingBlogNav() {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navRef = useRef(null);
  const interBubbleRef = useRef(null);

  useEffect(() => {
    const interBubble = interBubbleRef.current;
    const nav = navRef.current;
    if (!interBubble || !nav) return;

    let curX = 0;
    let curY = 0;
    let tgX = 0;
    let tgY = 0;
    let animationFrameId;

    const move = () => {
      curX += (tgX - curX) / 20;
      curY += (tgY - curY) / 20;
      interBubble.style.transform = `translate(${Math.round(curX)}px, ${Math.round(curY)}px)`;
      animationFrameId = requestAnimationFrame(move);
    };

    const handleMouseMove = (event) => {
      const rect = nav.getBoundingClientRect();
      // Calculate mouse position relative to the nav container
      tgX = event.clientX - rect.left;
      tgY = event.clientY - rect.top;
    };

    window.addEventListener('mousemove', handleMouseMove);
    move();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isCollapsed]);

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
        <div className="floating-nav-icon" ref={navRef} onClick={expand}>
          {/* Animated Background Elements */}
          <div className="nav-gradients-container">
            <div className="nav-g1"></div>
            <div className="nav-g2"></div>
            <div className="nav-g3"></div>
            <div className="nav-g4"></div>
            <div className="nav-g5"></div>
            <div className="nav-interactive" ref={interBubbleRef}></div>
          </div>
          <svg className="nav-noiseBg" viewBox="0 0 100 100" xmlns='http://www.w3.org/2000/svg' preserveAspectRatio="none">
            <rect width='100%' height='100%' filter='url(#noiseFilterBg)' />
          </svg>
          
          {/* Nav Content */}
          <div className="floating-nav-content">
            Blogs
          </div>
        </div>
      ) : (
        <div className="floating-nav-bar" ref={navRef} onClick={navigateToBlogs}>
          {/* Animated Background Elements */}
          <div className="nav-gradients-container">
            <div className="nav-g1"></div>
            <div className="nav-g2"></div>
            <div className="nav-g3"></div>
            <div className="nav-g4"></div>
            <div className="nav-g5"></div>
            <div className="nav-interactive" ref={interBubbleRef}></div>
          </div>
          <svg className="nav-noiseBg" viewBox="0 0 100 100" xmlns='http://www.w3.org/2000/svg' preserveAspectRatio="none">
            <filter id='noiseFilterBg'>
              <feTurbulence type='fractalNoise' baseFrequency='0.6' stitchTiles='stitch' />
            </filter>
            <rect width='100%' height='100%' filter='url(#noiseFilterBg)' />
          </svg>
          
          {/* Nav Content */}
          <div className="floating-nav-content">
            <span className="floating-nav-text">Explore our Blogs →</span>
          </div>
        </div>
      )}
      
      {/* SVG Filters (Must always be in DOM) */}
      <svg xmlns="http://www.w3.org/2000/svg" className="nav-svgBlur" style={{ display: 'none' }}>
        <defs>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8" result="goo" />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>
    </div>
  );
}
