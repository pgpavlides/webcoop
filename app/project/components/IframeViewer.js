'use client';

import { forwardRef, useEffect, useState } from 'react';
import { setupElementInspector } from '@/lib/inspector';
import { setupDirectInspector } from '@/lib/directInspector';

const IframeViewer = forwardRef(({ 
  url, 
  editMode, 
  onElementSelect
}, ref) => {
  const [inspectorMode, setInspectorMode] = useState('standard'); // 'standard' or 'direct'
  
  // Set up the inspector when in edit mode
  useEffect(() => {
    let inspectorCleanup = null;
    
    if (editMode && ref.current) {
      console.log('Setting up inspector in iframe viewer');
      
      // Need to make sure the iframe is fully loaded
      const setupInspectorWhenReady = () => {
        try {
          // Try to access iframe content
          const iframeDoc = ref.current.contentDocument || ref.current.contentWindow.document;
          
          if (!iframeDoc) {
            console.log('Iframe document not ready yet');
            setTimeout(setupInspectorWhenReady, 100);
            return;
          }
          
          // First try standard inspector
          if (inspectorMode === 'standard') {
            try {
              // Try standard inspector first
              console.log('Attempting standard inspector setup');
              const { cleanup } = setupElementInspector(ref.current, {
                onElementSelect,
                onInspectorReady: () => console.log('Standard inspector ready')
              });
              
              inspectorCleanup = cleanup;
              console.log('Standard inspector setup complete');
            } catch (err) {
              console.error('Standard inspector failed, falling back to direct:', err);
              setInspectorMode('direct');
              // Will retry on next render with direct mode
            }
          } else {
            // Use direct DOM injection approach
            console.log('Setting up direct DOM inspector');
            const { cleanup } = setupDirectInspector(ref.current, onElementSelect);
            inspectorCleanup = cleanup;
            console.log('Direct inspector setup complete');
          }
        } catch (err) {
          console.error('Error setting up inspector:', err);
          // Try again after delay
          setTimeout(setupInspectorWhenReady, 100);
        }
      };
      
      // Check if iframe is loaded
      if (ref.current.contentDocument && ref.current.contentDocument.readyState === 'complete') {
        setupInspectorWhenReady();
      } else {
        // Wait for iframe to load
        ref.current.addEventListener('load', setupInspectorWhenReady);
      }
    }
    
    // Cleanup on unmount or when edit mode changes
    return () => {
      if (inspectorCleanup) {
        console.log('Cleaning up inspector');
        inspectorCleanup();
      }
    };
  }, [editMode, ref, onElementSelect, inspectorMode]);

  // Add fallback toggle button if standard inspector fails
  const toggleInspectorMode = () => {
    const newMode = inspectorMode === 'standard' ? 'direct' : 'standard';
    console.log(`Switching inspector mode to: ${newMode}`);
    setInspectorMode(newMode);
  };

  return (
    <>
      <iframe
        ref={ref}
        src={url || 'about:blank'}
        className="w-full border-0"
        style={{ height: 'calc(100vh - 8rem)', display: 'block' }}
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        title="Website Preview"
        loading="eager"
      />
      
      {/* Inspector mode toggle button (shown only during debugging) */}
      {editMode && (
        <button
          onClick={toggleInspectorMode}
          className="absolute top-0 right-0 bg-slate-800 text-white text-xs px-2 py-1 m-1 rounded z-50"
          style={{ opacity: 0.5 }}
        >
          {inspectorMode === 'standard' ? 'Switch to Direct' : 'Switch to Standard'}
        </button>
      )}
    </>
  );
});

export default IframeViewer;
