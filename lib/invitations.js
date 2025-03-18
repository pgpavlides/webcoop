import { v4 as uuidv4 } from 'uuid';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

// Initialize AWS SDK
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

// Create an invitation
export const createInvitation = async (projectId, createdBy) => {
  const dynamoDB = initDynamoDB();
  const invitationId = uuidv4();
  
  const params = {
    TableName: process.env.DYNAMODB_INVITATIONS_TABLE || 'Invitations',
    Item: {
      id: invitationId,
      projectId: projectId,
      createdBy: createdBy,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Expires in 7 days
      used: false
    }
  };

  await dynamoDB.send(new PutCommand(params));
  return params.Item;
};

// Get an invitation by ID
export const getInvitation = async (invitationId) => {
  const dynamoDB = initDynamoDB();
  const params = {
    TableName: process.env.DYNAMODB_INVITATIONS_TABLE || 'Invitations',
    Key: {
      id: invitationId
    }
  };

  const result = await dynamoDB.send(new GetCommand(params));
  return result.Item;
};

// Mark invitation as used
export const useInvitation = async (invitationId) => {
  const dynamoDB = initDynamoDB();
  const params = {
    TableName: process.env.DYNAMODB_INVITATIONS_TABLE || 'Invitations',
    Key: {
      id: invitationId
    },
    UpdateExpression: 'set used = :used',
    ExpressionAttributeValues: {
      ':used': true
    },
    ReturnValues: 'ALL_NEW'
  };

  const result = await dynamoDB.send(new UpdateCommand(params));
  return result.Attributes;
};

// Generate invitation link
export const generateInvitationLink = (invitationId, baseUrl = process.env.NEXTAUTH_URL) => {
  return `${baseUrl}/invite/${invitationId}`;
};
