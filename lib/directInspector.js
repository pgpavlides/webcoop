'use client';

/**
 * Direct DOM inspection by injecting script into iframe
 * This is a backup approach when standard inspector doesn't work
 */

// Setup direct inspector by injecting script into iframe content
export const setupDirectInspector = (iframe, onElementSelect) => {
  if (!iframe || !iframe.contentWindow) {
    console.error('Invalid iframe reference');
    return { cleanup: () => {} };
  }
  
  try {
    // Create a script element to inject
    const script = document.createElement('script');
    script.id = 'webcoop-inspector-script';
    
    // Define the script content
    script.textContent = `
      (function() {
        console.log('WebCoop inspector script injected');
        
        // Add styles
        const style = document.createElement('style');
        style.id = 'webcoop-inspector-styles';
        style.textContent = \`
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
        \`;
        document.head.appendChild(style);
        
        // Track state
        let highlightedElement = null;
        let isInspecting = true;
        
        // Generate unique selector
        function getUniqueSelector(element) {
          if (!element) return '';
          if (element.id) return '#' + element.id;
          
          let selector = element.tagName.toLowerCase();
          
          if (element.className) {
            const classes = element.className.split(' ');
            if (classes.length > 0 && classes[0]) {
              selector += '.' + classes[0];
            }
          }
          
          return selector;
        }
        
        // Handle mousemove
        function handleMouseMove(e) {
          if (!isInspecting) return;
          
          // Clear previous highlight
          if (highlightedElement) {
            highlightedElement.classList.remove('webcoop-highlight');
            highlightedElement = null;
          }
          
          // Get element under cursor
          const element = document.elementFromPoint(e.clientX, e.clientY);
          if (element && element.tagName !== 'HTML' && element.tagName !== 'BODY') {
            highlightedElement = element;
            element.classList.add('webcoop-highlight');
          }
        }
        
        // Handle click
        function handleClick(e) {
          if (!isInspecting) return;
          
          // Get element under cursor
          const element = document.elementFromPoint(e.clientX, e.clientY);
          if (element && element.tagName !== 'HTML' && element.tagName !== 'BODY') {
            e.preventDefault();
            e.stopPropagation();
            
            // Remove previous highlight
            if (highlightedElement) {
              highlightedElement.classList.remove('webcoop-highlight');
            }
            
            // Highlight the selected element
            element.classList.add('webcoop-target');
            
            // Get element details
            const rect = element.getBoundingClientRect();
            const scrollX = window.scrollX || window.pageXOffset;
            const scrollY = window.scrollY || window.pageYOffset;
            
            // Calculate relative position within element
            const relX = (e.clientX - rect.left) / rect.width * 100;
            const relY = (e.clientY - rect.top) / rect.height * 100;
            
            // Send selection message to parent
            window.parent.postMessage({
              type: 'webcoop-element-selected',
              data: {
                selector: getUniqueSelector(element),
                tag: element.tagName.toLowerCase(),
                className: element.className,
                relXPercent: relX,
                relYPercent: relY,
                x: rect.left + (rect.width * relX / 100) + scrollX,
                y: rect.top + (rect.height * relY / 100) + scrollY,
                width: rect.width,
                height: rect.height
              }
            }, '*');
            
            // Remove highlight after a delay
            setTimeout(() => {
              element.classList.remove('webcoop-target');
            }, 500);
          }
        }
        
        // Add event listeners
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('click', handleClick);
        
        // Expose cleanup method
        window.webcoopCleanupInspector = function() {
          isInspecting = false;
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('click', handleClick);
          
          // Remove any highlighting
          const highlighted = document.querySelectorAll('.webcoop-highlight, .webcoop-target');
          highlighted.forEach(el => {
            el.classList.remove('webcoop-highlight', 'webcoop-target');
          });
          
          // Remove the style
          const style = document.getElementById('webcoop-inspector-styles');
          if (style) style.remove();
          
          console.log('WebCoop inspector cleaned up');
        };
        
        console.log('WebCoop inspector initialized');
      })();
    `;
    
    // Inject the script into the iframe document
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.body.appendChild(script);
    
    // Listen for messages from the iframe
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'webcoop-element-selected') {
        if (onElementSelect && typeof onElementSelect === 'function') {
          onElementSelect(event.data.data);
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    // Return cleanup function
    return {
      cleanup: () => {
        // Remove message listener
        window.removeEventListener('message', handleMessage);
        
        // Call cleanup function in iframe
        try {
          if (iframe.contentWindow && iframe.contentWindow.webcoopCleanupInspector) {
            iframe.contentWindow.webcoopCleanupInspector();
          }
          
          // Remove the script
          const injectedScript = iframeDoc.getElementById('webcoop-inspector-script');
          if (injectedScript) {
            injectedScript.remove();
          }
        } catch (err) {
          console.error('Error cleaning up direct inspector:', err);
        }
      }
    };
  } catch (err) {
    console.error('Error setting up direct inspector:', err);
    return { cleanup: () => {} };
  }
};
