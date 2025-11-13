require('dotenv').config();
const mongoose = require('mongoose');

async function testDatabaseConnection() {
  console.log('Testing database connection...');
  const MONGODB_URI = process.env.MONGODB_URI;
  
  if (!MONGODB_URI) {
    console.error('Database connection failed: MONGODB_URI must be set within .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI, { bufferCommands: false });
    console.log('Database connection successful!');
    console.log(`Connected to database ${process.env.NODE_ENV} - ${MONGODB_URI}`);
    await mongoose.disconnect();
    console.log('Database disconnected.');
    process.exit(0);
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
}

testDatabaseConnection();