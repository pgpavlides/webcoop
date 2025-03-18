'use client';

// Fetch project data from API
export const fetchProjectData = async (id) => {
  try {
    // Fetch project details
    const response = await fetch(`/api/projects/${id}`);
    
    if (!response.ok) {
      throw new Error('Failed to load project');
    }
    
    const data = await response.json();
    
    return {
      project: data.project,
      error: null
    };
  } catch (error) {
    console.error('Error loading project:', error);
    return {
      project: null,
      error: 'Failed to load project data'
    };
  }
};

// Fetch feedback for a project
export const fetchProjectFeedback = async (id) => {
  try {
    // Fetch feedback for this project
    const response = await fetch(`/api/projects/${id}/feedback`);
    
    if (!response.ok) {
      throw new Error('Failed to load feedback');
    }
    
    const data = await response.json();
    
    return {
      feedback: data.feedback || [],
      error: null
    };
  } catch (error) {
    console.error('Error loading feedback:', error);
    return {
      feedback: [],
      error: 'Failed to load feedback data'
    };
  }
};

// Sample project data for development
export const getSampleProject = (userEmail) => {
  return {
    project: {
      id: 'sample',
      name: 'Sample Project',
      url: 'https://example.com',
      createdBy: userEmail
    },
    feedback: [
      { id: '1', xPercent: 25, yPercent: 20, text: 'Logo should be larger' },
      { id: '2', xPercent: 75, yPercent: 40, text: 'Change this button color' }
    ]
  };
};
