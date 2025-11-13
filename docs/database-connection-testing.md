# Database Connection Testing Guide

This guide provides step-by-step instructions for testing the MongoDB database connection in the Stock Market App.

## Prerequisites

- Node.js installed on your system
- Access to the project repository
- MongoDB Atlas account credentials (already configured in the .env file)

## Testing the Database Connection

### Method 1: Using the Standalone Test Script

1. Open a terminal window
2. Navigate to the project root directory:
   ```
   cd /path/to/stockmarket_app
   ```
3. Run the standalone database test script:
   ```
   node scripts/standalone-db-test.js
   ```
4. Check the output:
   - If successful, you'll see: "Database connection successful!" followed by connection details
   - If unsuccessful, you'll see an error message explaining what went wrong

### Method 2: Testing in the Application

1. Start the development server:
   ```
   npm run dev
   ```
2. Check the console output for database connection messages
3. If the application starts without database-related errors, the connection is working

### Method 3: Using MongoDB Compass

1. Install MongoDB Compass (if not already installed)
2. Open MongoDB Compass
3. Use the connection string from your .env file:
   ```
   mongodb+srv://cassandracook:04wmR9ILzaB6Mjbf@cluster0.xm7dh5w.mongodb.net/?appName=Cluster0
   ```
4. Click "Connect"
5. If successful, you'll see your database clusters and collections

## Troubleshooting

If you encounter connection issues:

1. Verify that the MONGODB_URI in your .env file is correct
2. Check your network connection
3. Ensure your IP address is whitelisted in MongoDB Atlas
4. Verify that your MongoDB Atlas account is active
5. Check if the database user credentials are correct

## Security Note

The connection string in the .env file contains sensitive credentials. Never commit this file to version control or share it publicly.