import { v2 as cloudinary } from 'cloudinary';
import dotenv from "dotenv";
dotenv.config();  

// Validate environment variables
const requiredEnvVars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('Missing required Cloudinary environment variables:', missingVars);
  console.error('Please ensure these variables are set in your .env file:');
  missingVars.forEach(varName => console.error(`- ${varName}`));
} else {
  console.log('Cloudinary configuration loaded successfully');
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


// Test function to verify Cloudinary connection
export const testCloudinaryConnection = async () => {
  try {
    const result = await cloudinary.api.ping();
    console.log('Cloudinary connection test successful:', result);
    return true;
  } catch (error) {
    console.error('Cloudinary connection test failed:', error.message);
    return false;
  }
};

export default cloudinary;