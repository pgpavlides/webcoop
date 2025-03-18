'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function CreateProject() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [projectName, setProjectName] = useState('');
  const [projectUrl, setProjectUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Check authentication
  if (status === 'unauthenticated') {
    router.push('/login');
  }

  // Create a new project
  const handleCreateProject = async (e) => {
    e.preventDefault();
    
    if (!projectName.trim()) {
      setError('Project name is required');
      return;
    }

    if (!projectUrl.trim()) {
      setError('Website URL is required');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: projectName,
          url: projectUrl
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Save project data to localStorage as a fallback
        try {
          const projectData = {
            id: data.project.id,
            name: projectName,
            url: projectUrl
          };
          
          // Get existing projects or init empty array
          const existingProjects = JSON.parse(localStorage.getItem('webcoop-projects') || '[]');
          existingProjects.push(projectData);
          
          // Save back to localStorage
          localStorage.setItem('webcoop-projects', JSON.stringify(existingProjects));
        } catch (e) {
          console.error('Error saving to localStorage:', e);
        }
        
        router.push('/');
      } else {
        setError(data.error || 'Failed to create project');
        console.error('Failed to create project:', data.error);
      }
    } catch (error) {
      setError('An unexpected error occurred');
      console.error('Error creating project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <p className="text-xl text-white">Loading...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center mb-8">
          <Link 
            href="/"
            className="text-gray-400 hover:text-white mr-4"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-white">
            Create New Project
          </h1>
        </div>

        <div className="max-w-md mx-auto bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-6 border border-slate-700 shadow-lg">
          {error && (
            <div className="bg-rose-900/50 border border-rose-600 text-rose-200 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleCreateProject} className="space-y-4">
            <div>
              <label htmlFor="project-name" className="block text-gray-300 text-sm mb-1">
                Project Name
              </label>
              <input 
                id="project-name"
                type="text" 
                placeholder="My Website" 
                className="w-full border border-slate-600 rounded px-3 py-2 bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label htmlFor="website-url" className="block text-gray-300 text-sm mb-1">
                Website URL
              </label>
              <input 
                id="website-url"
                type="url" 
                placeholder="https://example.com" 
                className="w-full border border-slate-600 rounded px-3 py-2 bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                value={projectUrl}
                onChange={(e) => setProjectUrl(e.target.value)}
                required
              />
            </div>
            
            <div className="pt-2 flex justify-end">
              <Link
                href="/"
                className="bg-slate-700 text-gray-300 px-4 py-2 rounded mr-2 hover:bg-slate-600 transition-colors"
              >
                Cancel
              </Link>
              <button 
                type="submit"
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-4 py-2 rounded disabled:opacity-50 transition duration-200"
                disabled={isLoading}
              >
                {isLoading ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
