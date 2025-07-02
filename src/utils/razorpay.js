import Razorpay from "razorpay";
import dotenv from "dotenv";

dotenv.config();

console.log('Razorpay Config Debug:', {
  key_id: process.env.RAZORPAY_KEY_ID ? `${process.env.RAZORPAY_KEY_ID.substring(0, 10)}...` : 'NOT SET',
  key_secret: process.env.RAZORPAY_KEY_SECRET ? 'SET' : 'NOT SET'
});

const razorpay = new Razorpay({
    key_id:process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,  
})

export default razorpay;