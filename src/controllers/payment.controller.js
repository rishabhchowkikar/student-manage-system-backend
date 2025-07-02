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

export const createPaymentOrder = async (req, res) => {
  try {
    console.log('=== CREATE PAYMENT ORDER START ===');
    console.log('Request body:', req.body);
    console.log('User:', req.user?._id);

    const { amount, roomType } = req.body;
    const userId = req.user._id;

    // Validate inputs
    if (!amount || amount < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Create a shorter receipt (max 40 characters)
    const timestamp = Date.now().toString().slice(-8); // Last 8 digits
    const userIdShort = userId.toString().slice(-8); // Last 8 digits of user ID
    const receipt = `h_${userIdShort}_${timestamp}`; // Format: h_12345678_12345678 (max 20 chars)
    
    console.log('Generated receipt:', receipt, 'Length:', receipt.length);

    // Create Razorpay order
    const options = {
      amount: amount * 100, // Convert to paise
      currency: 'INR',
      receipt: receipt, // Use the shorter receipt
      notes: {
        userId: userId.toString(),
        roomType: roomType,
        purpose: 'hostel_fees'
      }
    };

    console.log('Creating Razorpay order with options:', options);
    const order = await razorpay.orders.create(options);
    console.log('Razorpay order created:', order);

    // Save payment intent in database
    const hostelPayment = new Hostel({
      userId,
      roomType,
      roomNumber: 'TBD',
      floor: 'TBD',
      hostelName: 'TBD',
      paymentAmount: amount,
      razorpayOrderId: order.id,
      paymentStatus: 'pending',
      allocated: false
    });

    await hostelPayment.save();

    res.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt
      },
      message: 'Payment order created successfully'
    });

  } catch (error) {
    console.error('Create payment order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
      error: error.message
    });
  }
};


export const verifyPayment = async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      roomType 
    } = req.body;

    // Create signature for verification
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      // Update payment status in database
      const updatedHostel = await Hostel.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        {
          paymentStatus: 'paid',
          razorpayPaymentId: razorpay_payment_id,
          paymentDate: new Date(),
          adminNotified: true,
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!updatedHostel) {
        return res.status(404).json({
          success: false,
          message: 'Payment record not found'
        });
      }

      res.json({
        success: true,
        message: 'Payment verified successfully',
        data: updatedHostel
      });

    } else {
      res.status(400).json({
        success: false,
        message: 'Payment verification failed - Invalid signature'
      });
    }

  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
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