'use client';

import { useState, useEffect } from 'react';

export default function LoadingHelper({ loadingTime = 5000 }) {
  const [showHelp, setShowHelp] = useState(false);
  const [devBypass, setDevBypass] = useState(false);
  
  useEffect(() => {
    // Check if we have the dev bypass flag
    const hasDevBypass = localStorage.getItem('dev-bypass') === 'true';
    setDevBypass(hasDevBypass);
    
    // Show help if loading takes too long
    const timer = setTimeout(() => {
      setShowHelp(true);
    }, loadingTime);
    
    return () => clearTimeout(timer);
  }, [loadingTime]);
  
  // Enable the dev bypass
  const enableDevBypass = () => {
    localStorage.setItem('dev-bypass', 'true');
    setDevBypass(true);
    window.location.reload();
  };
  
  // Reset all local storage
  const resetStorage = () => {
    localStorage.clear();
    sessionStorage.clear();
    document.cookie.split(";").forEach(cookie => {
      const [name] = cookie.trim().split("=");
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });
    window.location.reload();
  };
  
  if (!showHelp) return null;
  
  return (
    <div className="fixed bottom-4 right-4 bg-white text-black p-4 rounded-lg shadow-lg max-w-sm z-50 text-sm">
      <h3 className="font-bold mb-2">Stuck at loading?</h3>
      
      <p className="mb-2">Try these solutions:</p>
      
      <div className="space-y-2">
        <button 
          onClick={resetStorage}
          className="w-full py-1.5 px-3 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Clear Browser Data
        </button>
        
        <button 
          onClick={enableDevBypass}
          className={`w-full py-1.5 px-3 rounded ${
            devBypass 
              ? 'bg-green-100 text-green-800 cursor-default' 
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
          disabled={devBypass}
        >
          {devBypass ? 'Dev Bypass Active' : 'Enable Dev Bypass'}
        </button>
      </div>
      
      <div className="mt-3 text-xs text-gray-600">
        <p>Or try running these commands:</p>
        <code className="bg-gray-100 block p-1 mt-1">node reset-app.js</code>
        <code className="bg-gray-100 block p-1 mt-1">npm run fresh</code>
      </div>
    </div>
  );
}
