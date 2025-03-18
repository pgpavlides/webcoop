'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function InvitePage({ params }) {
  const { id } = params;
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project');
  const { data: session, status } = useSession();
  const router = useRouter();
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // In a real app, you would fetch the invitation data from DynamoDB
    // For demo purposes, we'll just create mock data
    const fetchInvitation = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data
        if (id) {
          setInvitation({
            id: id,
            projectId: projectId || 'sample',
            createdBy: 'user@example.com',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            used: false
          });
        } else {
          setError('Invalid invitation');
        }
      } catch (error) {
        setError('Failed to load invitation');
      } finally {
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [id, projectId]);

  const acceptInvitation = async () => {
    if (!session) {
      // Save invitation info and redirect to login
      // In a real app, you would store this in localStorage or a cookie
      router.push('/login');
      return;
    }

    try {
      setLoading(true);
      
      // In a real app, you would call your API to add the user as a collaborator
      // and mark the invitation as used in DynamoDB
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirect to the project page
      router.push(`/project/${invitation.projectId}`);
    } catch (error) {
      setError('Failed to accept invitation');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <p className="text-xl">Loading invitation...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="max-w-md w-full text-center bg-slate-800 p-8 rounded-lg shadow-lg border border-slate-700">
          <h2 className="text-2xl font-bold text-rose-500 mb-4">Error</h2>
          <p className="mb-6 text-gray-300">{error}</p>
          <Link href="/" className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-6 py-3 rounded-lg inline-block transition duration-200">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="max-w-md w-full bg-slate-800 rounded-lg shadow-lg p-8 border border-slate-700">
        <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-violet-500 text-transparent bg-clip-text">Project Invitation</h2>
        
        <p className="mb-6 text-gray-300">
          You have been invited to collaborate on project <span className="font-semibold text-cyan-400">{invitation.projectId}</span>.
        </p>
        
        <p className="mb-6 text-gray-300">
          {session ? (
            `You'll be able to view the project and provide feedback.`
          ) : (
            `Please sign in to accept the invitation.`
          )}
        </p>
        
        <div className="flex justify-center">
          <button
            onClick={acceptInvitation}
            disabled={loading}
            className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg disabled:opacity-50 transition duration-200 font-medium"
          >
            {session ? 'Accept Invitation' : 'Sign in to Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
