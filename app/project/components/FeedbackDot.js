'use client';

import { useState } from 'react';
import { calculateFeedbackPosition } from '@/lib/inspector';

export default function FeedbackDot({ 
  item, 
  iframeRef, 
  containerSize,
  editMode, 
  showFeedbackDetails, 
  hideFeedbackDetails, 
  startEditingFeedback 
}) {
  const getPosition = () => {
    if (item.elementSelector && iframeRef.current) {
      return calculateFeedbackPosition(iframeRef.current, item);
    }
    
    // Fallback to percentage-based positioning
    const x = (item.xPercent / 100) * containerSize.width;
    const y = (item.yPercent / 100) * containerSize.height;
    return { x, y };
  };

  const position = getPosition();

  const handleClick = (e) => {
    if (editMode) {
      startEditingFeedback(item, e);
    } else {
      e.stopPropagation();
      showFeedbackDetails(item);
    }
  };

  return (
    <div
      className="feedback-dot"
      style={{ 
        left: `${position.x}px`, 
        top: `${position.y}px` 
      }}
      onMouseEnter={() => !editMode && showFeedbackDetails(item)}
      onMouseLeave={() => !editMode && hideFeedbackDetails()}
      onClick={handleClick}
    />
  );
}
