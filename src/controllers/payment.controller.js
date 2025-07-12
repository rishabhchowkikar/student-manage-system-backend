import razorpay from "../utils/razorpay.js"
import Hostel from "../models/Hostel.model.js"
import crypto from 'crypto';

// export const createPaymentOrder = async (req, res) => {
//   try {
//     const { amount, roomType } = req.body;
//     const userId = req.user._id;

//     // Validate amount
//     if (!amount || amount < 1) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid amount'
//       });
//     }

//     // Create Razorpay order
//     const options = {
//       amount: amount * 100, // Convert to paise (smallest currency unit)
//       currency: 'INR',
//       receipt: `hostel_${userId}_${Date.now()}`,
//       notes: {
//         userId: userId.toString(),
//         roomType: roomType,
//         purpose: 'hostel_fees'
//       }
//     };

//     const order = await razorpay.orders.create(options);

//     // Save payment intent in database
//     const hostelPayment = new Hostel({
//       userId,
//       roomType,
//       roomNumber: 'TBD', // To be decided by admin
//       floor: 'TBD',
//       hostelName: 'TBD',
//       paymentAmount: amount,
//       razorpayOrderId: order.id,
//       paymentStatus: 'pending',
//       allocated: false
//     });

//     await hostelPayment.save();

//     res.json({
//       success: true,
//       order: {
//         id: order.id,
//         amount: order.amount,
//         currency: order.currency,
//         receipt: order.receipt
//       },
//       message: 'Payment order created successfully'
//     });

//   } catch (error) {
//     console.error('Create payment order error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to create payment order',
//       error: error.message
//     });
//   }
// };

// In payment.controller.js
export const createPaymentOrder = async (req, res) => {
  try {
    console.log("=== DEBUGGING PAYMENT AMOUNT ISSUE ===");
    console.log("Raw request body:", JSON.stringify(req.body, null, 2));
    console.log("Request headers:", req.headers);
    
    const { amount, roomType } = req.body;
    const userId = req.user._id;

    // Log the extracted values
    console.log("Extracted amount:", amount, "Type:", typeof amount);
    console.log("Extracted roomType:", roomType, "Type:", typeof roomType);
    console.log("User ID:", userId);

    // Validate the amount more strictly
    const numericAmount = Number(amount);
    console.log("Converted numeric amount:", numericAmount);

    if (!numericAmount || numericAmount < 1000) {
      console.log("VALIDATION FAILED - Invalid amount:", numericAmount);
      return res.status(400).json({
        message: `Invalid amount received: ${amount}. Expected 8000 or 12000.`,
        status: false,
        debug: {
          receivedAmount: amount,
          convertedAmount: numericAmount,
          roomType: roomType
        }
      });
    }

    // Validate room type and expected amounts
    const expectedAmounts = { Normal: 8000, AC: 12000 };
    if (!expectedAmounts[roomType]) {
      return res.status(400).json({
        message: `Invalid room type: ${roomType}`,
        status: false
      });
    }

    if (numericAmount !== expectedAmounts[roomType]) {
      console.log("AMOUNT MISMATCH:");
      console.log("Expected:", expectedAmounts[roomType]);
      console.log("Received:", numericAmount);
      return res.status(400).json({
        message: `Amount mismatch. Expected ₹${expectedAmounts[roomType]} for ${roomType} room, but received ₹${numericAmount}`,
        status: false
      });
    }

    // Helper function to get current academic year
    function getCurrentAcademicYear() {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      
      if (month >= 7) {
        return `${year}-${year + 1}`;
      } else {
        return `${year - 1}-${year}`;
      }
    }

    // Generate receipt ID
    const receiptId = `h_${userId.toString().slice(-8)}_${Date.now().toString().slice(-8)}`;
    console.log("Generated receipt:", receiptId);

    // Create Razorpay order with validated amount
    const razorpayAmount = numericAmount * 100; // Convert to paise
    const options = {
      amount: razorpayAmount,
      currency: 'INR',
      receipt: receiptId,
      notes: {
        userId: userId.toString(),
        roomType,
        purpose: 'hostel_fees',
        originalAmount: numericAmount
      }
    };

    console.log("Razorpay order options:", JSON.stringify(options, null, 2));
    
    const order = await razorpay.orders.create(options);
    console.log("Razorpay order created successfully:", JSON.stringify(order, null, 2));

    // Get current academic year
    const currentAcademicYear = getCurrentAcademicYear();

    // Create hostel record with validated data
    const hostelData = {
      userId,
      roomType,
      roomNumber: "TBD",
      floor: "TBD", 
      hostelName: "TBD",
      allocated: false,
      academicYear: currentAcademicYear,
      paymentStatus: 'pending',
      paymentAmount: numericAmount, // Use validated numeric amount
      razorpayOrderId: order.id,
    };

    console.log("Creating hostel record with data:", JSON.stringify(hostelData, null, 2));

    const hostel = new Hostel(hostelData);
    await hostel.save();

    console.log("Hostel record saved successfully");

    // Verify the saved data
    const savedHostel = await Hostel.findById(hostel._id);
    console.log("Verification - Saved hostel data:", JSON.stringify(savedHostel, null, 2));

    res.status(200).json({
      orderId: order.id,
      amount: order.amount, // This should be numericAmount * 100
      currency: order.currency,
      receipt: order.receipt,
      status: true,
      message: "Payment order created successfully",
      debug: {
        originalAmount: numericAmount,
        razorpayAmount: razorpayAmount,
        savedAmount: savedHostel.paymentAmount
      }
    });

  } catch (error) {
    console.error("=== CREATE PAYMENT ORDER ERROR ===");
    console.error("Error details:", error);
    console.error("Stack trace:", error.stack);
    
    res.status(500).json({
      message: "Failed to create payment order",
      status: false,
      error: error.message
    });
  }
};

// In payment.controller.js
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const userId = req.user._id;

    console.log("=== VERIFY PAYMENT START ===");
    console.log("Payment verification data:", { razorpay_order_id, razorpay_payment_id, razorpay_signature });

    // Verify signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      // Payment verified successfully
      console.log("Payment signature verified successfully");

      // Update hostel record
      const updatedHostel = await Hostel.findOneAndUpdate(
        { 
          userId, 
          razorpayOrderId: razorpay_order_id 
        },
        {
          paymentStatus: 'paid',
          razorpayPaymentId: razorpay_payment_id,
          paymentDate: new Date(),
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!updatedHostel) {
        return res.status(404).json({
          message: "Hostel record not found",
          status: false
        });
      }

      console.log("Hostel record updated:", updatedHostel);

      res.status(200).json({
        message: "Payment verified successfully",
        status: true,
        data: updatedHostel
      });
    } else {
      console.log("Payment signature verification failed");
      res.status(400).json({
        message: "Invalid payment signature",
        status: false
      });
    }
  } catch (error) {
    console.error("Verify payment error:", error);
    res.status(500).json({
      message: "Payment verification failed",
      status: false,
      error: error.message
    });
  }
};



// getting the payment status for a specific user 
export const getPaymentStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const hostelRecord = await Hostel.findOne({ userId })
      .populate('userId', 'name email rollno')
      .sort({ createdAt: -1 });

    if (!hostelRecord) {
      return res.status(404).json({
        success: false,
        message: 'No payment record found'
      });
    }

    res.json({
      success: true,
      data: hostelRecord
    });

  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment status',
      error: error.message
    });
  }
};

export const checkPendingPayment = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Find latest pending payment
    const pendingPayment = await Hostel.findOne({
      userId,
      paymentStatus: 'pending'
    }).sort({ createdAt: -1 });

    if (pendingPayment) {
      // Check if Razorpay order is still valid
      try {
        const order = await razorpay.orders.fetch(pendingPayment.razorpayOrderId);
        
        if (order.status === 'created') {
          return res.json({
            success: true,
            hasPendingPayment: true,
            order: {
              id: order.id,
              amount: order.amount,
              currency: order.currency,
              receipt: order.receipt
            },
            roomType: pendingPayment.roomType,
            paymentAmount: pendingPayment.paymentAmount
          });
        } else {
          // Order expired or completed, delete pending record
          await Hostel.findByIdAndDelete(pendingPayment._id);
        }
      } catch (error) {
        // Order not found or expired, delete pending record
        await Hostel.findByIdAndDelete(pendingPayment._id);
      }
    }

    res.json({
      success: true,
      hasPendingPayment: false
    });

  } catch (error) {
    console.error('Check pending payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check pending payment'
    });
  }
};