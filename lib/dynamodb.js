import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand, UpdateCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

// Initialize AWS SDK
// In production, use environment variables
const initDynamoDB = () => {
  // For local development (replace with your AWS configuration)
  const client = new DynamoDBClient({
    region: process.env.REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.ACCESS_KEY_ID || '',
      secretAccessKey: process.env.SECRET_ACCESS_KEY || ''
    }
  });

  return DynamoDBDocumentClient.from(client);
};

// Create or get a project
export const createProject = async (project) => {
  const dynamoDB = initDynamoDB();
  const params = {
    TableName: process.env.DYNAMODB_PROJECTS_TABLE || 'Projects',
    Item: {
      id: project.id,
      name: project.name,
      createdBy: project.createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      url: project.url || '',
      collaborators: project.collaborators || []
    }
  };

  await dynamoDB.send(new PutCommand(params));
  return params.Item;
};

// Get a project by ID
export const getProject = async (projectId) => {
  const dynamoDB = initDynamoDB();
  const params = {
    TableName: process.env.DYNAMODB_PROJECTS_TABLE || 'Projects',
    Key: {
      id: projectId
    }
  };

  const result = await dynamoDB.send(new GetCommand(params));
  return result.Item;
};

// Get projects by user ID
export const getProjectsByUser = async (userId) => {
  const dynamoDB = initDynamoDB();
  const params = {
    TableName: process.env.DYNAMODB_PROJECTS_TABLE || 'Projects',
    FilterExpression: 'createdBy = :userId OR contains(collaborators, :userId)',
    ExpressionAttributeValues: {
      ':userId': userId
    }
  };

  const result = await dynamoDB.send(new ScanCommand(params));
  return result.Items;
};

// Add a collaborator to a project
export const addCollaborator = async (projectId, userId) => {
  const dynamoDB = initDynamoDB();
  const params = {
    TableName: process.env.DYNAMODB_PROJECTS_TABLE || 'Projects',
    Key: {
      id: projectId
    },
    UpdateExpression: 'set collaborators = list_append(if_not_exists(collaborators, :empty_list), :userId), updatedAt = :updatedAt',
    ExpressionAttributeValues: {
      ':userId': [userId],
      ':empty_list': [],
      ':updatedAt': new Date().toISOString()
    },
    ReturnValues: 'ALL_NEW'
  };

  const result = await dynamoDB.send(new UpdateCommand(params));
  return result.Attributes;
};

// Save feedback for a project
export const saveFeedback = async (feedback) => {
  const dynamoDB = initDynamoDB();
  const params = {
    TableName: process.env.DYNAMODB_FEEDBACK_TABLE || 'Feedback',
    Item: {
      id: feedback.id,
      projectId: feedback.projectId,
      userId: feedback.userId,
      xPercent: feedback.xPercent,
      yPercent: feedback.yPercent,
      text: feedback.text,
      createdAt: new Date().toISOString(),
      screenshot: feedback.screenshot || null,
      // Add element targeting information if available
      ...(feedback.elementSelector && {
        elementSelector: feedback.elementSelector,
        relXPercent: feedback.relXPercent,
        relYPercent: feedback.relYPercent
      })
    }
  };

  await dynamoDB.send(new PutCommand(params));
  return params.Item;
};

// Get feedback for a project
export const getProjectFeedback = async (projectId) => {
  const dynamoDB = initDynamoDB();
  const params = {
    TableName: process.env.DYNAMODB_FEEDBACK_TABLE || 'Feedback',
    FilterExpression: 'projectId = :projectId',
    ExpressionAttributeValues: {
      ':projectId': projectId
    }
  };

  const result = await dynamoDB.send(new ScanCommand(params));
  return result.Items;
};

// Delete a project
export const deleteProject = async (projectId) => {
  const dynamoDB = initDynamoDB();
  const params = {
    TableName: process.env.DYNAMODB_PROJECTS_TABLE || 'Projects',
    Key: {
      id: projectId
    }
  };

  await dynamoDB.send(new DeleteCommand(params));
  
  // Also delete all feedback associated with this project
  // First, get all feedback for this project
  const feedbackParams = {
    TableName: process.env.DYNAMODB_FEEDBACK_TABLE || 'Feedback',
    FilterExpression: 'projectId = :projectId',
    ExpressionAttributeValues: {
      ':projectId': projectId
    }
  };

  const result = await dynamoDB.send(new ScanCommand(feedbackParams));
  
  // Then delete each feedback item
  const feedbackItems = result.Items || [];
  const feedbackDeletions = feedbackItems.map(item => {
    const deleteParams = {
      TableName: process.env.DYNAMODB_FEEDBACK_TABLE || 'Feedback',
      Key: {
        id: item.id
      }
    };
    return dynamoDB.send(new DeleteCommand(deleteParams));
  });
  
  // Wait for all deletions to complete
  if (feedbackDeletions.length > 0) {
    await Promise.all(feedbackDeletions);
  }
  
  return { success: true };
};

// Delete a feedback item
export const deleteFeedbackItem = async (feedbackId) => {
  const dynamoDB = initDynamoDB();
  const params = {
    TableName: process.env.DYNAMODB_FEEDBACK_TABLE || 'Feedback',
    Key: {
      id: feedbackId
    }
  };

  await dynamoDB.send(new DeleteCommand(params));
  return { success: true };
};
