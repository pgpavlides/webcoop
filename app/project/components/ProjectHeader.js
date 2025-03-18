'use client';

import Link from 'next/link';
import { ArrowLeft, Edit, Eye } from 'lucide-react';

export default function ProjectHeader({ projectName, editMode, toggleEditMode }) {
  return (
    <header className="bg-slate-800 shadow-md border-b border-slate-700 py-3">
      <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link 
            href="/"
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-lg font-medium text-white">
            {projectName}
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={toggleEditMode}
            className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-1.5 transition duration-200 ${
              editMode 
                ? 'bg-cyan-600 text-white' 
                : 'bg-slate-700 text-gray-200 hover:bg-slate-600'
            }`}
          >
            {editMode ? (
              <>
                <Eye size={16} />
                <span className="hidden sm:inline">View Mode</span>
              </>
            ) : (
              <>
                <Edit size={16} />
                <span className="hidden sm:inline">Edit Mode</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
