'use client';

import { useState, useEffect } from 'react';

export default function ManualSelector({ 
  active, 
  iframeRef, 
  containerRef, 
  onSelect, 
  onCancel 
}) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [crosshair, setCrosshair] = useState({ visible: false, x: 0, y: 0 });
  const [mode, setMode] = useState('position'); // 'position' or 'rectangle'
  const [selection, setSelection] = useState(null);
  
  // Set up manual selection mode
  useEffect(() => {
    if (!active || !containerRef.current) return;
    
    // Make iframe container have crosshair cursor
    containerRef.current.classList.add('inspect-cursor');
    
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      
      // Get position relative to container
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Update crosshair
      setCrosshair({
        visible: true,
        x,
        y
      });
      
      // In rectangle mode, update selection
      if (mode === 'rectangle' && selection) {
        setSelection({
          ...selection,
          width: x - selection.x,
          height: y - selection.y
        });
      }
    };
    
    const handleMouseDown = (e) => {
      if (!containerRef.current) return;
      e.preventDefault();
      
      // Get position relative to container
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      if (mode === 'position') {
        // Direct positioning mode - just select this position
        setPosition({ x, y });
        
        // Notify parent
        onSelect({
          x,
          y,
          xPercent: (x / rect.width) * 100,
          yPercent: (y / rect.height) * 100
        });
      } else {
        // Rectangle selection mode - start selection
        setSelection({
          x,
          y,
          width: 0,
          height: 0
        });
      }
    };
    
    const handleMouseUp = (e) => {
      if (mode === 'rectangle' && selection) {
        // Normalize rectangle (in case of negative width/height)
        const normalizedSelection = normalizeRectangle(selection);
        
        // Calculate center point of selection
        const centerX = normalizedSelection.x + normalizedSelection.width / 2;
        const centerY = normalizedSelection.y + normalizedSelection.height / 2;
        
        // Get container dimensions
        const rect = containerRef.current.getBoundingClientRect();
        
        // Notify parent
        onSelect({
          x: centerX,
          y: centerY,
          xPercent: (centerX / rect.width) * 100,
          yPercent: (centerY / rect.height) * 100,
          rectangle: normalizedSelection
        });
        
        // Reset selection
        setSelection(null);
      }
    };
    
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCancel();
      } else if (e.key === 'r') {
        // Toggle between position and rectangle mode
        setMode(mode === 'position' ? 'rectangle' : 'position');
        setSelection(null);
      }
    };
    
    // Add event listeners
    containerRef.current.addEventListener('mousemove', handleMouseMove);
    containerRef.current.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);
    
    // Clean up
    return () => {
      if (containerRef.current) {
        containerRef.current.classList.remove('inspect-cursor');
        containerRef.current.removeEventListener('mousemove', handleMouseMove);
        containerRef.current.removeEventListener('mousedown', handleMouseDown);
      }
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [active, containerRef, mode, selection, onSelect, onCancel]);
  
  // Normalize rectangle (ensure positive width/height)
  const normalizeRectangle = (rect) => {
    let { x, y, width, height } = rect;
    
    if (width < 0) {
      x = x + width;
      width = Math.abs(width);
    }
    
    if (height < 0) {
      y = y + height;
      height = Math.abs(height);
    }
    
    return { x, y, width, height };
  };
  
  if (!active) return null;
  
  return (
    <div className="absolute inset-0 z-50 pointer-events-none">
      {/* Crosshair */}
      {crosshair.visible && (
        <>
          <div 
            className="absolute border-l border-red-500" 
            style={{ 
              left: crosshair.x, 
              top: 0, 
              height: '100%', 
              width: 0 
            }}
          />
          <div 
            className="absolute border-t border-red-500" 
            style={{ 
              left: 0, 
              top: crosshair.y, 
              width: '100%', 
              height: 0 
            }}
          />
        </>
      )}
      
      {/* Selection rectangle */}
      {selection && (
        <div 
          className="absolute border-2 border-red-500 bg-red-500 bg-opacity-10"
          style={{
            left: selection.x,
            top: selection.y,
            width: selection.width,
            height: selection.height
          }}
        />
      )}
      
      {/* Instructions */}
      <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white px-4 py-2 rounded-md z-50 opacity-90">
        <div className="text-sm font-medium">
          Manual Selection Mode: {mode === 'position' ? 'Position' : 'Rectangle'}
        </div>
        <div className="text-xs text-gray-300 mt-1">
          Press <span className="bg-slate-700 px-1 rounded">ESC</span> to cancel, 
          <span className="bg-slate-700 px-1 rounded ml-1">R</span> to toggle mode
        </div>
      </div>
    </div>
  );
}
