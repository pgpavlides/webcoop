'use client';

/**
 * Utility to handle iframe scrolling and maintain accurate element positions
 */

// Track iframe scroll position for accurate element positioning
export const setupScrollTracking = (iframe, callback) => {
  if (!iframe || !iframe.contentWindow) return { cleanup: () => {} };
  
  // Get the content window
  const contentWindow = iframe.contentWindow;
  
  // Store initial scroll position
  let scrollX = contentWindow.scrollX || contentWindow.pageXOffset || 0;
  let scrollY = contentWindow.scrollY || contentWindow.pageYOffset || 0;
  
  // Track scroll events
  const handleScroll = () => {
    const newScrollX = contentWindow.scrollX || contentWindow.pageXOffset || 0;
    const newScrollY = contentWindow.scrollY || contentWindow.pageYOffset || 0;
    
    // Calculate scroll delta
    const deltaX = newScrollX - scrollX;
    const deltaY = newScrollY - scrollY;
    
    // Update stored position
    scrollX = newScrollX;
    scrollY = newScrollY;
    
    // Call callback with scroll info
    if (callback && typeof callback === 'function') {
      callback({
        scrollX,
        scrollY,
        deltaX,
        deltaY
      });
    }
  };
  
  // Add event listener
  contentWindow.addEventListener('scroll', handleScroll, { passive: true });
  
  // Return cleanup function
  return {
    cleanup: () => {
      contentWindow.removeEventListener('scroll', handleScroll);
    },
    getScrollPosition: () => ({ scrollX, scrollY })
  };
};

// Function to adjust element position based on scroll
export const adjustPositionForScroll = (originalPosition, initialScroll, currentScroll) => {
  if (!originalPosition || !initialScroll || !currentScroll) return originalPosition;
  
  // Calculate scroll delta
  const deltaX = currentScroll.scrollX - initialScroll.scrollX;
  const deltaY = currentScroll.scrollY - initialScroll.scrollY;
  
  // Adjust position
  return {
    x: originalPosition.x - deltaX,
    y: originalPosition.y - deltaY
  };
};
