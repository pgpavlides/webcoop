/**
 * Chrome DevTools-like inspector for WebCoop
 * Provides element inspection, highlighting, and precise positioning of feedback dots
 */

// Generate a unique selector for an element
export const getUniqueSelector = (element) => {
  // If the element has an ID, use that
  if (element.id) {
    return `#${element.id}`;
  }
  
  // If element has a class, try using that with element type
  if (element.className && typeof element.className === 'string') {
    const classes = element.className.split(' ');
    if (classes.length > 0 && classes[0]) {
      const selector = `${element.tagName.toLowerCase()}.${classes[0]}`;
      
      // Check if this selector is unique
      try {
        const doc = element.ownerDocument;
        const matchingElements = doc.querySelectorAll(selector);
        
        if (matchingElements.length === 1) {
          return selector;
        }
      } catch (error) {
        console.error('Error checking selector uniqueness:', error);
      }
    }
  }
  
  // Try a more specific approach with nth-child
  try {
    let selector = element.tagName.toLowerCase();
    const parent = element.parentNode;
    
    if (parent && parent.children.length > 1) {
      // Find index among siblings of same type
      let index = 0;
      for (let i = 0; i < parent.children.length; i++) {
        if (parent.children[i].tagName === element.tagName) {
          index++;
        }
        if (parent.children[i] === element) {
          break;
        }
      }
      
      // Add the nth-of-type
      selector += `:nth-of-type(${index})`;
      
      // Create the full selector with parent info
      if (parent.tagName !== 'BODY') {
        const parentSelector = getUniqueSelector(parent);
        selector = `${parentSelector} > ${selector}`;
      }
      
      return selector;
    }
  } catch (error) {
    console.error('Error creating nth-child selector:', error);
  }
  
  // Fallback: Just return the element tag
  return element.tagName.toLowerCase();
};

// Get a human-readable description of the element (like Chrome DevTools)
export const getElementDescription = (element) => {
  let description = element.tagName.toLowerCase();
  
  // Add ID if present
  if (element.id) {
    description += `#${element.id}`;
  }
  
  // Add class if present
  if (element.className && typeof element.className === 'string' && element.className.trim()) {
    const className = element.className.trim().split(' ')[0];
    if (className) {
      description += `.${className}`;
    }
  }
  
  // Add dimensions
  const rect = element.getBoundingClientRect();
  description += ` (${Math.round(rect.width)}×${Math.round(rect.height)})`;
  
  return description;
};

// Setup the element inspector within an iframe
export const setupElementInspector = (iframe, callbackFns) => {
  if (!iframe) {
    console.error('Invalid iframe reference');
    return { cleanup: () => {} };
  }
  
  // Try to access iframe content
  let iframeDoc, iframeWin;
  try {
    iframeWin = iframe.contentWindow;
    iframeDoc = iframe.contentDocument || iframeWin.document;
    
    if (!iframeDoc || !iframeWin) {
      console.error('Cannot access iframe content - might be due to cross-origin restrictions');
      return { cleanup: () => {} };
    }
  } catch (err) {
    console.error('Error accessing iframe content:', err);
    return { cleanup: () => {} };
  }
  
  console.log('Successfully accessed iframe document for inspector');
  
  const { 
    onElementSelect, 
    onElementHighlight,
    onInspectorReady 
  } = callbackFns || {};
  
  // Already defined earlier, remove this line
  
  // Add highlight styles (similar to Chrome DevTools)
  const styleEl = iframeDoc.createElement('style');
  styleEl.textContent = `
    .webcoop-highlight {
      outline: 3px dashed #38bdf8 !important;
      outline-offset: 2px !important;
      box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.3) !important;
      background-color: rgba(56, 189, 248, 0.2) !important;
      transition: all 0.1s ease !important;
    }
    
    .webcoop-target {
      outline: 3px solid #ef4444 !important;
      outline-offset: 2px !important;
      box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.3) !important;
      background-color: rgba(239, 68, 68, 0.2) !important;
    }

    /* Prevent pointer events on highlight overlay */
    .webcoop-overlay-highlight {
      position: absolute;
      background-color: transparent;
      border: 3px dashed #38bdf8;
      box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.3);
      pointer-events: none;
      z-index: 9999;
    }
  `;
  iframeDoc.head.appendChild(styleEl);
  
  // Track current elements
  let highlightedElement = null;
  let targetElement = null;
  let isScrolling = false;
  let scrollTimeout = null;
  
  // Create tooltip element (like Chrome's element tooltip)
  const tooltip = iframeDoc.createElement('div');
  tooltip.style.cssText = `
    position: fixed;
    background-color: #2a2a2a;
    color: white;
    font-family: monospace;
    font-size: 12px;
    padding: 4px 8px;
    border-radius: 4px;
    z-index: 9999;
    pointer-events: none;
    display: none;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
    white-space: nowrap;
  `;
  iframeDoc.body.appendChild(tooltip);
  
  // Mouse move handler for highlighting
  const handleMouseMove = (e) => {
    // Disable highlighting during scrolling
    if (isScrolling) return;
    
    // Remove previous highlight
    if (highlightedElement) {
      highlightedElement.classList.remove('webcoop-highlight');
      highlightedElement = null;
    }
    
    // Hide tooltip by default
    tooltip.style.display = 'none';
    
    // Log mouse position for debugging
    if (e.clientX % 100 === 0) { // Only log occasionally to reduce spam
      console.log('Mouse position in iframe:', e.clientX, e.clientY);
    }
    
    try {
      // Get element under cursor (ignoring the tooltip itself)
      const element = iframeDoc.elementFromPoint(e.clientX, e.clientY);
      
      if (!element) {
        console.log('No element found at position', e.clientX, e.clientY);
        return;
      }
      
      if (element && element !== tooltip && element.tagName !== 'HTML' && element.tagName !== 'BODY') {
        // Log element found (occasionally)
        if (e.clientX % 300 === 0) {
          console.log('Element under cursor:', element.tagName, element.className);
        }
        
        highlightedElement = element;
        element.classList.add('webcoop-highlight');
        
        // Update and show tooltip (like Chrome Inspector)
        tooltip.textContent = getElementDescription(element);
        tooltip.style.display = 'block';
        tooltip.style.left = `${e.clientX + 15}px`;
        tooltip.style.top = `${e.clientY + 15}px`;
        
        // Keep tooltip on screen
        const tooltipRect = tooltip.getBoundingClientRect();
        const viewportWidth = iframeWin.innerWidth;
        const viewportHeight = iframeWin.innerHeight;
        
        if (tooltipRect.right > viewportWidth) {
          tooltip.style.left = `${e.clientX - tooltipRect.width - 15}px`;
        }
        
        if (tooltipRect.bottom > viewportHeight) {
          tooltip.style.top = `${e.clientY - tooltipRect.height - 15}px`;
        }
        
        // Callback if needed
        if (onElementHighlight && typeof onElementHighlight === 'function') {
          onElementHighlight(element);
        }
      }
    } catch (err) {
      console.error('Error during element highlighting:', err);
    }
  };
  
  // Click handler for selection
  const handleClick = (e) => {
    // Only handle if left mouse button and not during scrolling
    if (e.button !== 0 || isScrolling) return;
    
    // If we're clicking on a non-element area, ignore
    if (!highlightedElement) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Remove previous target styling
    if (targetElement) {
      targetElement.classList.remove('webcoop-target');
    }
    
    // Update target element
    targetElement = highlightedElement;
    targetElement.classList.remove('webcoop-highlight');
    targetElement.classList.add('webcoop-target');
    
    // Generate unique selector
    const selector = getUniqueSelector(targetElement);
    
    // Calculate element position and dimensions
    const rect = targetElement.getBoundingClientRect();
    const iframeRect = iframe.getBoundingClientRect();
    
    // Get relative position of the click within the element
    const relXPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const relYPercent = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Get current scroll position
    const scrollX = iframeWin.scrollX || iframeWin.pageXOffset;
    const scrollY = iframeWin.scrollY || iframeWin.pageYOffset;
    
    // Prepare element data for callback
    const elementData = {
      element: targetElement,
      elementSelector: selector,
      rect: rect,
      relXPercent,
      relYPercent,
      scrollX,
      scrollY,
      // Absolute position
      x: rect.left + relXPercent * rect.width / 100,
      y: rect.top + relYPercent * rect.height / 100
    };
    
    // Call the callback if provided
    if (onElementSelect && typeof onElementSelect === 'function') {
      onElementSelect(elementData);
    }
  };
  
  // Handle scroll events
  const handleScroll = () => {
    // Hide tooltip during scroll
    tooltip.style.display = 'none';
    
    // Set scrolling flag to temporarily disable highlighting
    isScrolling = true;
    
    // Clear existing timeout
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }
    
    // Reset scrolling flag after a short delay
    scrollTimeout = setTimeout(() => {
      isScrolling = false;
    }, 150);
  };
  
  // Re-enable page interactions on keydown
  const handleKeyDown = (e) => {
    // Escape key exits target selection
    if (e.key === 'Escape') {
      if (targetElement) {
        targetElement.classList.remove('webcoop-target');
        targetElement = null;
      }
    }
  };
  
  // Add event listeners to iframe document
  iframeDoc.addEventListener('mousemove', handleMouseMove);
  iframeDoc.addEventListener('click', handleClick);
  iframeWin.addEventListener('scroll', handleScroll);
  iframeDoc.addEventListener('keydown', handleKeyDown);
  
  // Notify when inspector is ready
  if (onInspectorReady && typeof onInspectorReady === 'function') {
    onInspectorReady();
  }
  
  // Return cleanup function
  return {
    cleanup: () => {
      // Remove event listeners
      iframeDoc.removeEventListener('mousemove', handleMouseMove);
      iframeDoc.removeEventListener('click', handleClick);
      iframeWin.removeEventListener('scroll', handleScroll);
      iframeDoc.removeEventListener('keydown', handleKeyDown);
      
      // Remove styles and elements
      if (styleEl.parentNode) {
        styleEl.parentNode.removeChild(styleEl);
      }
      
      if (tooltip.parentNode) {
        tooltip.parentNode.removeChild(tooltip);
      }
      
      // Clean up highlighted elements
      if (highlightedElement) {
        highlightedElement.classList.remove('webcoop-highlight');
      }
      
      if (targetElement) {
        targetElement.classList.remove('webcoop-target');
      }
      
      // Clear any remaining highlights
      const highlights = iframeDoc.querySelectorAll('.webcoop-highlight, .webcoop-target');
      highlights.forEach(el => {
        el.classList.remove('webcoop-highlight', 'webcoop-target');
      });
    }
  };
};

// Calculate position for feedback indicators, handling scroll and resize
export const calculateFeedbackPosition = (iframe, feedbackItem) => {
  if (!iframe || !iframe.contentWindow || !iframe.contentDocument) {
    return { x: 0, y: 0 };
  }
  
  // If this feedback has element selector info, try to position based on that
  if (feedbackItem.elementSelector) {
    try {
      const iframeDocument = iframe.contentWindow.document;
      const element = iframeDocument.querySelector(feedbackItem.elementSelector);
      
      if (element) {
        // Get the element's position
        const elementRect = element.getBoundingClientRect();
        
        // Calculate the absolute position based on relative percentages within the element
        const x = elementRect.left + (elementRect.width * feedbackItem.relXPercent / 100);
        const y = elementRect.top + (elementRect.height * feedbackItem.relYPercent / 100);
        
        return { x, y };
      }
    } catch (error) {
      console.error('Error positioning element-attached feedback:', error);
    }
  }
  
  // Fallback to percentage-based positioning if element not found
  const iframeRect = iframe.getBoundingClientRect();
  const x = (feedbackItem.xPercent / 100) * iframeRect.width;
  const y = (feedbackItem.yPercent / 100) * iframeRect.height;
  
  return { x, y };
};

// Calculate the best position for feedback form
export const calculateFeedbackFormPosition = (iframe, targetElement) => {
  try {
    if (!targetElement || !iframe) return { top: 0, left: 0 };
    
    const rect = targetElement.getBoundingClientRect();
    const iframeRect = iframe.getBoundingClientRect();
    
    // Coordinates relative to the iframe
    let left = rect.left + rect.width + 10; // Place to the right of the element
    let top = rect.top;
    
    // Check if we're too close to the right edge, if so, place to the left
    if (left + 300 > iframeRect.width) { // 300px is approx form width
      left = Math.max(10, rect.left - 300 - 10);
    }
    
    // Make sure the form is visible vertically
    const formHeight = 200; // Approx form height
    if (top + formHeight > iframeRect.height) {
      top = Math.max(10, iframeRect.height - formHeight - 10);
    }
    
    return { top, left };
  } catch (error) {
    console.error('Error calculating form position:', error);
    return { top: 100, left: 100 }; // Fallback position
  }
};
