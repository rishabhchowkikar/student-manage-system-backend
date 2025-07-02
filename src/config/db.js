import mongoose from "mongoose";

const mongoConnectDB = async () => {
  try {
    console.log('🔄 Attempting to connect to MongoDB...');
    
    // Check if MONGO_DB_URL is set
    if (!process.env.MONGO_DB_URL) {
      throw new Error('MONGO_DB_URL environment variable is not set');
    }

    const stateMapping = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

// Function to get connection state as string
const getConnectionState = () => {
  const state = mongoose.connection.readyState;
  return stateMapping[state] || 'unknown'; // Default case if state is invalid
};
    
    console.log('📍 MongoDB URI:', process.env.MONGO_DB_URL.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')); // Hide password in logs
    
    // SIMPLIFIED CONNECTION - Remove all unsupported options
    const connectionString = await mongoose.connect(process.env.MONGO_DB_URL);

    console.log(`✅ MongoDB Connected Successfully!`);
    console.log(`🏠 Host: ${connectionString.connection.host}`);
    console.log(`🗄️ Database: ${connectionString.connection.name}`);
    console.log(`📊 Connection State: ${getConnectionState()}`);
    
    // Add connection event listeners for better monitoring
    mongoose.connection.on('connected', () => {
      console.log('✅ Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ Mongoose connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ Mongoose disconnected from MongoDB');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 Mongoose reconnected to MongoDB');
    });

    // Handle connection interruption
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🔒 MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error(`❌ DB connection failed: ${error.message}`);
    console.error('🔍 Full error details:', error);
    
    // Log specific error types for better debugging
    if (error.name === 'MongoServerSelectionError') {
      console.error('💡 Possible solutions:');
      console.error('   1. Check if MongoDB service is running');
      console.error('   2. Verify your connection string');
      console.error('   3. Check network connectivity');
      console.error('   4. Ensure your IP is whitelisted (for Atlas)');
    }
    
    // Don't exit the process immediately, allow retry
    console.log('🔄 Will retry connection in 5 seconds...');
    setTimeout(() => {
      mongoConnectDB();
    }, 5000);
  }
};



export default mongoConnectDB;
