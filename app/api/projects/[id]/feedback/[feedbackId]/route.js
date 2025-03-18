import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { getProject, getProjectFeedback, saveFeedback, deleteFeedbackItem } from '@/lib/dynamodb';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Get specific feedback
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

    const { id, feedbackId } = params;
    
    // Check if project exists and user has access
    const project = await getProject(id);
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    if (project.createdBy !== session.user.email && 
        (!project.collaborators || !project.collaborators.includes(session.user.email))) {
      return NextResponse.json(
        { error: 'You do not have access to this project' },
        { status: 403 }
      );
    }

    // Get all feedback for the project
    const allFeedback = await getProjectFeedback(id);
    
    // Find the specific feedback item
    const feedback = allFeedback.find(item => item.id === feedbackId);
    
    if (!feedback) {
      return NextResponse.json(
        { error: 'Feedback not found' },
        { status: 404 }
      );
    }

    // Return the feedback
    return NextResponse.json({ feedback }, { status: 200 });
  } catch (error) {
    console.error('Error getting feedback:', error);
    return NextResponse.json(
      { error: 'Failed to get feedback', details: error.message },
      { status: 500 }
    );
  }
}

// Update feedback
export async function PUT(request, { params }) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id, feedbackId } = params;
    
    // Check if project exists and user has access
    const project = await getProject(id);
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    if (project.createdBy !== session.user.email && 
        (!project.collaborators || !project.collaborators.includes(session.user.email))) {
      return NextResponse.json(
        { error: 'You do not have access to this project' },
        { status: 403 }
      );
    }

    // Get request body with updated feedback
    const data = await request.json();
    
    // Update feedback - ensure it has the correct ID
    data.id = feedbackId;
    data.projectId = id;
    
    // Save the updated feedback
    await saveFeedback(data);
    
    // Return success
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error updating feedback:', error);
    return NextResponse.json(
      { error: 'Failed to update feedback', details: error.message },
      { status: 500 }
    );
  }
}

// Delete feedback
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

    const { id, feedbackId } = params;
    
    // Check if project exists and user has access
    const project = await getProject(id);
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    if (project.createdBy !== session.user.email && 
        (!project.collaborators || !project.collaborators.includes(session.user.email))) {
      return NextResponse.json(
        { error: 'You do not have access to this project' },
        { status: 403 }
      );
    }

    // Delete the feedback
    await deleteFeedbackItem(feedbackId);
    
    // Return success
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    return NextResponse.json(
      { error: 'Failed to delete feedback', details: error.message },
      { status: 500 }
    );
  }
}
