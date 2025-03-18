# WebCoop - Website Feedback Tool

A simple, collaborative feedback tool for web projects built with Next.js and AWS.

## Tech Stack

- **Frontend**: Next.js
- **Backend**: Next.js API routes (with potential AWS Lambda functions)
- **Database**: DynamoDB
- **Authentication**: NextAuth.js
- **Visual Feedback**: HTML2Canvas
- **Deployment**: AWS Amplify

## Features

- User authentication
- Project creation
- Visual feedback on websites
- Collaboration through invitation links
- Task tracking based on feedback

## Getting Started

### Prerequisites

- Node.js 16.8+ installed
- AWS account with configured credentials
- DynamoDB tables set up (Projects, Feedback, Invitations)

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure your environment variables by creating a `.env.local` file based on the provided template
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser

### DynamoDB Table Setup

You'll need to create the following tables in AWS DynamoDB:

#### Projects Table
- Partition Key: `id` (String)
- Attributes:
  - name (String)
  - url (String)
  - createdBy (String)
  - createdAt (String)
  - updatedAt (String)
  - collaborators (List)

#### Feedback Table
- Partition Key: `id` (String)
- Attributes:
  - projectId (String)
  - userId (String)
  - x (Number)
  - y (Number)
  - text (String)
  - createdAt (String)
  - screenshot (Binary, optional)

#### Invitations Table
- Partition Key: `id` (String)
- Attributes:
  - projectId (String)
  - createdBy (String)
  - createdAt (String)
  - expiresAt (String)
  - used (Boolean)

## Deployment

This project is designed to be deployed using AWS Amplify:

1. Connect your repository to AWS Amplify
2. Configure the build settings
3. Set up environment variables
4. Deploy

## Demo Account

For demo purposes, you can use:
- Email: user@example.com
- Password: password

## Next Steps

- Implement real-time collaboration using WebSockets
- Add task tracking features
- Enhance the visual feedback mechanism
- Implement file uploads for additional context
