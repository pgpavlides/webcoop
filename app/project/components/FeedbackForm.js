'use client';

import { X, Save, Trash } from 'lucide-react';

export default function FeedbackForm({ 
  type, 
  feedback, 
  position,
  setFeedback,
  onSave, 
  onCancel, 
  onDelete 
}) {
  const isEditing = type === 'edit';
  
  return (
    <div 
      className="feedback-form"
      style={{ 
        left: `${position.x}px`, 
        top: `${position.y}px` 
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <textarea
        className="w-64 h-32 border border-slate-600 rounded p-3 mb-3 bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        placeholder="Enter your feedback..."
        value={feedback.text}
        onChange={(e) => setFeedback({...feedback, text: e.target.value})}
        autoFocus
      ></textarea>
      <div className="flex justify-between">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <button 
              onClick={onCancel}
              className="flex items-center gap-1 text-rose-400 hover:text-rose-300 transition duration-200"
              title="Cancel"
            >
              <X size={16} />
            </button>
            <button 
              onClick={() => onDelete(feedback.id)}
              className="flex items-center gap-1 text-rose-400 hover:text-rose-300 transition duration-200"
              title="Delete"
            >
              <Trash size={16} />
            </button>
          </div>
        ) : (
          <button 
            onClick={onCancel}
            className="flex items-center gap-1 text-rose-400 hover:text-rose-300 transition duration-200"
          >
            <X size={16} />
            Cancel
          </button>
        )}
        <button 
          onClick={onSave}
          className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition duration-200"
        >
          <Save size={16} />
          Save
        </button>
      </div>
    </div>
  );
}
