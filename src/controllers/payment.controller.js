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
    const { amount, roomType } = req.body;
    const userId = req.user._id;

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

    console.log("=== CREATE PAYMENT ORDER START ===");
    console.log("Request body:", { amount, roomType });
    console.log("User:", userId);

    // Validate required fields
    if (!amount || !roomType) {
      return res.status(400).json({
        message: "Amount and room type are required",
        status: false
      });
    }

    // Generate receipt ID
    const receiptId = `h_${userId.toString().slice(-8)}_${Date.now().toString().slice(-8)}`;
    console.log("Generated receipt:", receiptId, "Length:", receiptId.length);

    // Create Razorpay order
    const options = {
      amount: amount * 100, // Convert to paise
      currency: 'INR',
      receipt: receiptId,
      notes: {
        userId: userId.toString(),
        roomType,
        purpose: 'hostel_fees'
      }
    };

    console.log("Creating Razorpay order with options:", options);
    const order = await razorpay.orders.create(options);
    console.log("Razorpay order created:", order);

    // Get current academic year
    const currentAcademicYear = getCurrentAcademicYear();

    // Create hostel record with academicYear
    const hostelData = {
      userId,
      roomType,
      roomNumber: "TBD", // To be assigned by admin
      floor: "TBD", // To be assigned by admin
      hostelName: "TBD", // To be assigned by admin
      allocated: false,
      academicYear: currentAcademicYear, // Add this required field
      paymentStatus: 'pending',
      paymentAmount: amount,
      razorpayOrderId: order.id,
    };

    console.log("Creating hostel record with data:", hostelData);

    const hostel = new Hostel(hostelData);
    await hostel.save();

    res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      status: true,
      message: "Payment order created successfully"
    });

  } catch (error) {
    console.error("Create payment order error:", error);
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