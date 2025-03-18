import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { getProject, deleteProject } from '@/lib/dynamodb';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Get a single project
export async function GET(request, { params }) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    
    // Get project from DynamoDB
    const project = await getProject(id);
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    // Check if user has access to this project
    if (project.createdBy !== session.user.email && 
        (!project.collaborators || !project.collaborators.includes(session.user.email))) {
      return NextResponse.json(
        { error: 'You do not have access to this project' },
        { status: 403 }
      );
    }

    // Return project
    return NextResponse.json({ project }, { status: 200 });
  } catch (error) {
    console.error('Error getting project:', error);
    return NextResponse.json(
      { error: 'Failed to get project', details: error.message },
      { status: 500 }
    );
  }
}

// Delete a project
export async function DELETE(request, { params }) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    
    // Get project to check ownership
    const project = await getProject(id);
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    // Only the creator can delete a project
    if (project.createdBy !== session.user.email) {
      return NextResponse.json(
        { error: 'Only the project creator can delete a project' },
        { status: 403 }
      );
    }

    // Delete the project
    await deleteProject(id);

    // Return success
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project', details: error.message },
      { status: 500 }
    );
  }
}
