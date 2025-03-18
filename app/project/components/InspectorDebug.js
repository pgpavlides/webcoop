'use client';

import { useState, useEffect } from 'react';

export default function InspectorDebug({ iframeRef, editMode }) {
  const [debugging, setDebugging] = useState(false);
  const [iframeInfo, setIframeInfo] = useState({
    ready: false,
    accessError: null,
    crossOrigin: false,
    url: '',
    status: 'Not loaded'
  });
  
  // Toggle debugging
  const toggleDebugging = () => {
    setDebugging(!debugging);
  };
  
  // Check iframe status
  useEffect(() => {
    if (!iframeRef?.current) return;
    
    const checkStatus = () => {
      try {
        const iframe = iframeRef.current;
        const contentWindow = iframe.contentWindow;
        const iframeDoc = iframe.contentDocument || (contentWindow ? contentWindow.document : null);
        
        // Gather information
        const info = {
          url: iframe.src,
          ready: !!iframeDoc && iframeDoc.readyState === 'complete',
          accessError: null,
          crossOrigin: false,
          status: 'Loading'
        };
        
        // Try to access document to check for cross-origin issues
        try {
          if (contentWindow && contentWindow.location.href) {
            info.status = 'Loaded';
            
            // Try to access DOM
            if (iframeDoc && iframeDoc.body) {
              info.domAccessible = true;
            } else {
              info.domAccessible = false;
            }
          } else {
            info.crossOrigin = true;
            info.status = 'Cross-origin restricted';
          }
        } catch (err) {
          info.accessError = err.toString();
          info.crossOrigin = true;
          info.status = 'Cross-origin restricted';
        }
        
        setIframeInfo(info);
      } catch (err) {
        setIframeInfo({
          ready: false,
          accessError: err.toString(),
          crossOrigin: false,
          url: iframeRef.current?.src || 'unknown',
          status: 'Error checking status'
        });
      }
    };
    
    // Initial check
    checkStatus();
    
    // Check again when iframe loads
    const handleLoad = () => {
      checkStatus();
    };
    
    iframeRef.current.addEventListener('load', handleLoad);
    
    return () => {
      if (iframeRef.current) {
        iframeRef.current.removeEventListener('load', handleLoad);
      }
    };
  }, [iframeRef, debugging]);
  
  if (!debugging) {
    return (
      <button 
        onClick={toggleDebugging}
        className="fixed bottom-2 right-2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-30 hover:opacity-100 z-50"
      >
        Debug
      </button>
    );
  }
  
  return (
    <div className="fixed bottom-2 right-2 w-80 bg-slate-800 text-white text-xs p-3 rounded-md shadow-lg z-50 max-h-80 overflow-auto">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">Inspector Debug</h3>
        <button onClick={toggleDebugging} className="text-gray-400 hover:text-white">×</button>
      </div>
      
      <div className="space-y-2">
        <div>
          <span className="font-semibold">Status:</span> 
          <span className={iframeInfo.status === 'Loaded' ? 'text-green-400' : 'text-yellow-400'}>
            {iframeInfo.status}
          </span>
        </div>
        
        <div>
          <span className="font-semibold">Edit Mode:</span> 
          <span className={editMode ? 'text-green-400' : 'text-gray-400'}>
            {editMode ? 'ON' : 'OFF'}
          </span>
        </div>
        
        <div>
          <span className="font-semibold">DOM Access:</span> 
          <span className={iframeInfo.domAccessible ? 'text-green-400' : 'text-rose-400'}>
            {iframeInfo.domAccessible ? 'Yes' : 'No'}
          </span>
        </div>
        
        <div>
          <span className="font-semibold">Cross-Origin:</span> 
          <span className={iframeInfo.crossOrigin ? 'text-rose-400' : 'text-green-400'}>
            {iframeInfo.crossOrigin ? 'Yes (Restricted)' : 'No'}
          </span>
        </div>
        
        <div>
          <span className="font-semibold">URL:</span> 
          <span className="text-gray-300 break-all">
            {iframeInfo.url || 'unknown'}
          </span>
        </div>
        
        {iframeInfo.accessError && (
          <div>
            <span className="font-semibold text-rose-400">Error:</span> 
            <span className="text-rose-300 break-all">
              {iframeInfo.accessError}
            </span>
          </div>
        )}
      </div>
      
      <div className="mt-3 border-t border-slate-700 pt-2">
        <div className="text-gray-400 italic">
          If cross-origin is restricted, use direct mode or click-based selection.
        </div>
      </div>
    </div>
  );
}
