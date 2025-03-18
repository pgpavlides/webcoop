/**
 * A simple, direct element inspector implementation
 */

export function injectInspector(iframe, callback) {
  if (!iframe || !iframe.contentWindow) {
    console.error('Invalid iframe reference');
    return { cleanup: () => {} };
  }

  try {
    // Get iframe document
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    if (!iframeDoc) {
      console.error('Cannot access iframe document');
      return { cleanup: () => {} };
    }
    
    // Create and inject our inspector styles
    const style = document.createElement('style');
    style.id = 'webcoop-inspector-styles';
    style.textContent = `
      .webcoop-highlight {
        outline: 3px dashed #38bdf8 !important;
        outline-offset: 2px !important;
        background-color: rgba(56, 189, 248, 0.2) !important;
      }
      
      .webcoop-selected {
        outline: 3px solid #ef4444 !important;
        outline-offset: 2px !important;
        background-color: rgba(239, 68, 68, 0.2) !important;
      }
    `;
    iframeDoc.head.appendChild(style);
    
    // Track state
    let highlightedElement = null;
    
    // Add event listeners directly to the iframe document
    function handleMouseOver(e) {
      // Skip if target is HTML or BODY
      if (e.target === iframeDoc.documentElement || e.target === iframeDoc.body) {
        return;
      }
      
      // Remove previous highlight
      if (highlightedElement && highlightedElement !== e.target) {
        highlightedElement.classList.remove('webcoop-highlight');
      }
      
      // Highlight current element
      highlightedElement = e.target;
      highlightedElement.classList.add('webcoop-highlight');
    }
    
    function handleMouseOut(e) {
      // Only remove highlight if the mouse is leaving the element we highlighted
      if (e.target === highlightedElement) {
        e.target.classList.remove('webcoop-highlight');
        highlightedElement = null;
      }
    }
    
    function handleClick(e) {
      // Prevent default behavior
      e.preventDefault();
      e.stopPropagation();
      
      // Don't do anything if clicking on HTML or BODY
      if (e.target === iframeDoc.documentElement || e.target === iframeDoc.body) {
        return;
      }
      
      // Get element position and size
      const rect = e.target.getBoundingClientRect();
      const scrollX = iframe.contentWindow.scrollX || iframe.contentWindow.pageXOffset;
      const scrollY = iframe.contentWindow.scrollY || iframe.contentWindow.pageYOffset;
      
      // Add selected class
      if (highlightedElement) {
        highlightedElement.classList.remove('webcoop-highlight');
      }
      e.target.classList.add('webcoop-selected');
      
      // Call the callback with element data
      if (callback) {
        const elementData = {
          element: e.target,
          tagName: e.target.tagName,
          className: e.target.className,
          id: e.target.id,
          rect: rect,
          x: rect.left + rect.width/2 + scrollX,
          y: rect.top + rect.height/2 + scrollY
        };
        
        callback(elementData);
        
        // Remove the selected class after a short delay
        setTimeout(() => {
          e.target.classList.remove('webcoop-selected');
        }, 500);
      }
    }
    
    // Add the event listeners
    iframeDoc.addEventListener('mouseover', handleMouseOver, true);
    iframeDoc.addEventListener('mouseout', handleMouseOut, true);
    iframeDoc.addEventListener('click', handleClick, true);
    
    // Return cleanup function
    return {
      cleanup: () => {
        try {
          // Remove event listeners
          iframeDoc.removeEventListener('mouseover', handleMouseOver, true);
          iframeDoc.removeEventListener('mouseout', handleMouseOut, true);
          iframeDoc.removeEventListener('click', handleClick, true);
          
          // Remove style
          if (style.parentNode) {
            style.parentNode.removeChild(style);
          }
          
          // Remove any remaining highlights
          const highlighted = iframeDoc.querySelectorAll('.webcoop-highlight, .webcoop-selected');
          highlighted.forEach(el => {
            el.classList.remove('webcoop-highlight', 'webcoop-selected');
          });
        } catch (err) {
          console.error('Error during inspector cleanup:', err);
        }
      }
    };
  } catch (err) {
    console.error('Error setting up simple inspector:', err);
    return { cleanup: () => {} };
  }
}
