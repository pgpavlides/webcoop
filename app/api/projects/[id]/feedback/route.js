import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { v4 as uuidv4 } from 'uuid';
import { getProject, getProjectFeedback, saveFeedback } from '@/lib/dynamodb';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Get feedback for a project
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

    // Get feedback from DynamoDB
    const feedback = await getProjectFeedback(id);

    // Return feedback
    return NextResponse.json({ feedback }, { status: 200 });
  } catch (error) {
    console.error('Error getting feedback:', error);
    return NextResponse.json(
      { error: 'Failed to get feedback', details: error.message },
      { status: 500 }
    );
  }
}

// Add feedback to a project
export async function POST(request, { params }) {
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

    // Get request body
    const data = await request.json();
    
    // Validate data
    if (!data.xPercent || !data.yPercent || !data.text) {
      return NextResponse.json(
        { error: 'Invalid feedback data' },
        { status: 400 }
      );
    }
    
    // Create feedback object
    const feedback = {
      id: data.id || uuidv4(),
      projectId: id,
      userId: session.user.email,
      x: data.x,
      y: data.y,
      text: data.text,
      createdAt: data.createdAt || new Date().toISOString()
    };
    
    // Save to DynamoDB
    const savedFeedback = await saveFeedback(feedback);
    
    // Return success
    return NextResponse.json({ feedback: savedFeedback }, { status: 201 });
  } catch (error) {
    console.error('Error saving feedback:', error);
    return NextResponse.json(
      { error: 'Failed to save feedback', details: error.message },
      { status: 500 }
    );
  }
}
