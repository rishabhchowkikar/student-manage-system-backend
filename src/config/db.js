import mongoose from "mongoose";

const mongoConnectDB = async () => {
  try {
    const connectionString = await mongoose.connect(process.env.MONGO_DB_URL);
    console.log("DB connected successfully", connectionString.connection.host);
  } catch (error) {
    console.log(`DB connection failed: ${error.message}`);
  }
};

export default mongoConnectDB;
