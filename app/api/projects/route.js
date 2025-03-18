import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { v4 as uuidv4 } from 'uuid';
import { createProject, getProjectsByUser } from '@/lib/dynamodb';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Create new project
export async function POST(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'You must be signed in to create a project' },
        { status: 401 }
      );
    }

    // Get request body
    const data = await request.json();
    
    if (!data.name) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      );
    }

    // Create project
    const project = {
      id: uuidv4(),
      name: data.name,
      url: data.url || '',
      createdBy: session.user.email,
      collaborators: []
    };

    // Save to DynamoDB
    const savedProject = await createProject(project);

    // Return success
    return NextResponse.json({ project: savedProject }, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project', details: error.message },
      { status: 500 }
    );
  }
}

// Get projects for current user
export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'You must be signed in to view projects' },
        { status: 401 }
      );
    }

    // Get projects from DynamoDB
    const projects = await getProjectsByUser(session.user.email);

    // Return projects
    return NextResponse.json({ projects }, { status: 200 });
  } catch (error) {
    console.error('Error getting projects:', error);
    return NextResponse.json(
      { error: 'Failed to get projects', details: error.message },
      { status: 500 }
    );
  }
}
