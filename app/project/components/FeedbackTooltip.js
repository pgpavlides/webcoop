'use client';

export default function FeedbackTooltip({ feedback, position }) {
  if (!feedback) return null;
  
  return (
    <div 
      className="absolute bg-slate-800 text-white p-3 rounded shadow-lg z-50 max-w-xs border border-slate-700"
      style={{
        left: `${position.x + 15}px`,
        top: `${position.y + 15}px`
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <p>{feedback.text}</p>
      <div className="text-xs text-gray-400 mt-2">
        Added by {feedback.userId || 'Client'}
      </div>
    </div>
  );
}
