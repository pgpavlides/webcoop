'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogOut, Plus } from 'lucide-react';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    // Only redirect to login if definitely not authenticated
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      // Fetch projects
      fetchProjects();
    }
  }, [status, router]);

  // Fetch user's projects
  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      const data = await response.json();
      
      if (response.ok) {
        setProjects(data.projects || []);
      } else {
        console.error('Failed to fetch projects:', data.error);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <p className="text-xl text-white">Loading...</p>
      </div>
    );
  }

  // Show login button for unauthenticated users
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">WebCoop</h1>
          <p className="text-gray-400 mb-6">Your website feedback tool</p>
          
          <div className="space-y-4">
            <Link 
              href="/login" 
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg inline-block"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard for authenticated users
  return (
    <main className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-violet-500 text-transparent bg-clip-text">
            WebCoop
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-300 text-sm hidden md:inline">
              {session?.user?.email}
            </span>
            <Link 
              href="/api/auth/signout"
              className="bg-slate-800 hover:bg-slate-700 text-gray-200 px-3 py-2 rounded-md flex items-center gap-1 transition duration-200 text-sm"
            >
              <LogOut size={16} />
              <span className="hidden md:inline">Sign Out</span>
            </Link>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-16">
          <h2 className="text-2xl font-semibold text-white mb-8">Your Projects</h2>
          
          {projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl">
              {projects.map((project) => (
                <Link 
                  key={project.id}
                  href={`/project/${project.id}`}
                  className="bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg p-6 transition-colors"
                >
                  <h3 className="text-xl font-medium text-white mb-2">{project.name}</h3>
                  <p className="text-gray-400 text-sm">{project.url}</p>
                </Link>
              ))}
              
              <Link
                href="/create-project"
                className="bg-slate-800 rounded-lg border border-slate-700 border-dashed hover:border-cyan-800/40 hover:bg-slate-800/80 transition-colors flex flex-col items-center justify-center h-full text-gray-400 hover:text-cyan-400 p-6"
              >
                <div className="w-12 h-12 rounded-full bg-slate-700/50 flex items-center justify-center mb-3">
                  <Plus size={24} />
                </div>
                <span className="font-medium">New Project</span>
              </Link>
            </div>
          ) : (
            <div className="text-center">
              <div className="bg-slate-800/50 rounded-lg p-12 border border-slate-700 border-dashed mb-8">
                <div className="w-16 h-16 mx-auto rounded-full bg-slate-700/50 flex items-center justify-center mb-4">
                  <Plus size={30} className="text-gray-400" />
                </div>
                <p className="text-gray-400 mb-6">You don't have any projects yet</p>
                <Link
                  href="/create-project"
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-6 py-3 rounded-md transition duration-200 flex items-center gap-2 mx-auto inline-flex"
                >
                  <Plus size={20} />
                  Create Your First Project
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
