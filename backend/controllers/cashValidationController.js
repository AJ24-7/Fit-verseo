const Member = require('../models/Member');
const Payment = require('../models/Payment');
const Gym = require('../models/gym');
const sendEmail = require('../utils/sendEmail');

// In-memory store for cash validation requests (in production, use Redis or database)
const cashValidationStore = new Map();

// Create a new cash validation request
const createCashValidation = async (req, res) => {
  try {
    const {
      memberName,
      email,
      phone,
      planName,
      duration,
      amount,
      gymId
    } = req.body;

    // Generate unique validation code
    const validationCode = generateValidationCode();
    
    // Set expiry time (2 minutes from now)
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000);

    const validationData = {
      validationCode,
      memberName,
      email,
      phone,
      planName,
      duration,
      amount,
      gymId: gymId || 'default_gym',
      status: 'pending',
      createdAt: new Date(),
      expiresAt
    };

    // Store validation request
    cashValidationStore.set(validationCode, validationData);

    // Auto-expire after 2 minutes
    setTimeout(() => {
      if (cashValidationStore.has(validationCode)) {
        const validation = cashValidationStore.get(validationCode);
        if (validation.status === 'pending') {
          validation.status = 'expired';
          console.log(`💰 Validation ${validationCode} expired`);
        }
      }
    }, 2 * 60 * 1000);

    res.json({
      success: true,
      validationCode,
      expiresAt: expiresAt.toISOString(),
      message: 'Cash validation request created successfully'
    });

    console.log(`💰 Created cash validation: ${validationCode} for ${memberName}`);

  } catch (error) {
    console.error('Error creating cash validation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create cash validation request'
    });
  }
};

// Get all pending cash validation requests
const getPendingValidations = async (req, res) => {
  try {
    const pendingValidations = Array.from(cashValidationStore.values())
      .filter(validation => validation.status === 'pending' && new Date() < new Date(validation.expiresAt))
      .map(validation => ({
        ...validation,
        timeLeft: Math.max(0, Math.floor((new Date(validation.expiresAt) - new Date()) / 1000))
      }));

    res.json(pendingValidations);

  } catch (error) {
    console.error('Error fetching pending validations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending validations'
    });
  }
};

// Check validation status
const checkValidationStatus = async (req, res) => {
  try {
    const { validationCode } = req.params;
    
    const validation = cashValidationStore.get(validationCode);
    
    if (!validation) {
      return res.status(404).json({
        success: false,
        error: 'Validation code not found'
      });
    }

    // Check if expired
    if (new Date() > new Date(validation.expiresAt) && validation.status === 'pending') {
      validation.status = 'expired';
    }

    res.json({
      success: true,
      status: validation.status,
      expiresAt: validation.expiresAt,
      timeLeft: Math.max(0, Math.floor((new Date(validation.expiresAt) - new Date()) / 1000))
    });

  } catch (error) {
    console.error('Error checking validation status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check validation status'
    });
  }
};

// Confirm cash payment (called by admin)
const confirmCashPayment = async (req, res) => {
  try {
    const { validationCode } = req.params;
    
    const validation = cashValidationStore.get(validationCode);
    
    if (!validation) {
      return res.status(404).json({
        success: false,
        error: 'Validation code not found'
      });
    }

    if (validation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: `Validation is ${validation.status}, cannot confirm`
      });
    }

    if (new Date() > new Date(validation.expiresAt)) {
      validation.status = 'expired';
      return res.status(400).json({
        success: false,
        error: 'Validation code has expired'
      });
    }

    // Get gym information
    const gym = await Gym.findById(validation.gymId) || await Gym.findOne();
    if (!gym) {
      return res.status(404).json({
        success: false,
        error: 'Gym not found'
      });
    }

    // Create member with confirmed payment
    const memberData = {
      gym: validation.gymId,
      memberName: validation.memberName,
      age: validation.registrationData?.age || 25,
      gender: validation.registrationData?.gender || 'Not specified',
      phone: validation.phone,
      email: validation.email,
      paymentMode: 'Cash',
      paymentAmount: parseFloat(validation.amount),
      planSelected: validation.planName,
      monthlyPlan: validation.duration,
      activityPreference: validation.registrationData?.activityPreference || 'General fitness',
      address: validation.registrationData?.address || '',
      joinDate: new Date(),
      membershipId: `${gym.name.substring(0,3).toUpperCase()}${Date.now()}`,
      paymentStatus: 'paid' // Mark as paid since cash is confirmed
    };

    console.log('💰 Creating confirmed member with data:', memberData);

    const newMember = new Member(memberData);
    await newMember.save();

    // Send welcome email
    try {
      await sendWelcomeEmailForCash(newMember, gym);
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
      // Don't fail confirmation if email fails
    }

    // Mark validation as confirmed
    validation.status = 'confirmed';
    validation.confirmedAt = new Date();
    validation.memberId = newMember._id;

    res.json({
      success: true,
      message: 'NEW CONTROLLER - Cash payment confirmed and member created successfully',
      member: {
        id: newMember._id,
        membershipId: newMember.membershipId,
        name: newMember.memberName,
        memberName: newMember.memberName,
        email: newMember.email,
        phone: newMember.phone,
        planSelected: newMember.planSelected,
        membershipPlan: newMember.planSelected, // Map to existing field for compatibility
        monthlyPlan: newMember.monthlyPlan,
        duration: newMember.monthlyPlan, // Map to existing field for compatibility
        paymentAmount: newMember.paymentAmount,
        paymentStatus: newMember.paymentStatus,
        joinDate: newMember.joinDate
      },
      gym: {
        name: gym.name,
        address: gym.address,
        contact: gym.contact
      },
      validation: {
        validationCode: validationCode,
        confirmedAt: new Date(),
        amount: validation.amount,
        planName: validation.planName,
        duration: validation.duration
      }
    });

    console.log(`✅ NEW CONTROLLER - Member created and cash validation confirmed: ${validationCode} for ${validation.memberName}`);

  } catch (error) {
    console.error('Error confirming cash payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to confirm cash payment'
    });
  }
};

// Send welcome email for cash payment confirmation
const sendWelcomeEmailForCash = async (member, gym) => {
  try {
    const subject = `Welcome to ${gym.name}! Your Cash Payment is Confirmed`;
    
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #2196f3, #1976d2); color: white; padding: 30px; border-radius: 10px; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 10px; margin: 20px 0; }
            .member-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; color: #666; padding: 20px; }
            .status-badge { background: #4caf50; color: white; padding: 5px 15px; border-radius: 20px; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Welcome to ${gym.name}!</h1>
                <p>Your cash payment has been confirmed and your membership is now active!</p>
            </div>
            
            <div class="content">
                <h2>Hello ${member.memberName},</h2>
                <p>Great news! Your cash payment has been successfully processed and your gym membership is now active.</p>
                
                <div class="member-info">
                    <h3>Your Membership Details:</h3>
                    <p><strong>Member ID:</strong> ${member.membershipId}</p>
                    <p><strong>Name:</strong> ${member.memberName}</p>
                    <p><strong>Plan:</strong> ${member.planSelected}</p>
                    <p><strong>Duration:</strong> ${member.monthlyPlan} Month(s)</p>
                    <p><strong>Payment:</strong> ₹${member.paymentAmount} (Cash)</p>
                    <p><strong>Status:</strong> <span class="status-badge">ACTIVE</span></p>
                    <p><strong>Join Date:</strong> ${new Date(member.joinDate).toLocaleDateString()}</p>
                </div>
                
                <h3>Next Steps:</h3>
                <ul>
                    <li>Visit the gym with a valid ID</li>
                    <li>Your Member ID: <strong>${member.membershipId}</strong></li>
                    <li>Start your fitness journey today!</li>
                </ul>
            </div>
            
            <div class="footer">
                <p><strong>${gym.name}</strong><br>
                ${gym.address}<br>
                Contact: ${gym.contact}</p>
                <p>Welcome to your fitness family! 💪</p>
            </div>
        </div>
    </body>
    </html>
    `;

    await sendEmail(member.email, subject, htmlContent);
    console.log(`✅ Welcome email sent to ${member.email}`);
    
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
};

// Reject cash payment
const rejectCashPayment = async (req, res) => {
  try {
    const { validationCode } = req.params;
    
    const validation = cashValidationStore.get(validationCode);
    
    if (!validation) {
      return res.status(404).json({
        success: false,
        error: 'Validation code not found'
      });
    }

    if (validation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: `Validation is ${validation.status}, cannot reject`
      });
    }

    // Mark as rejected
    validation.status = 'rejected';
    validation.rejectedAt = new Date();

    res.json({
      success: true,
      message: 'Cash payment rejected successfully'
    });

    console.log(`💰 Rejected cash validation: ${validationCode} for ${validation.memberName}`);

  } catch (error) {
    console.error('Error rejecting cash payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject cash payment'
    });
  }
};

// Generate unique validation code
function generateValidationCode() {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `CV${timestamp.substr(-6)}${random}`;
}

// Cleanup expired validations (call periodically)
const cleanupExpiredValidations = () => {
  const now = new Date();
  for (const [code, validation] of cashValidationStore.entries()) {
    if (now > new Date(validation.expiresAt) && validation.status === 'pending') {
      validation.status = 'expired';
      // Remove after 1 hour to keep some history
      setTimeout(() => {
        cashValidationStore.delete(code);
      }, 60 * 60 * 1000);
    }
  }
};

// Run cleanup every 5 minutes
setInterval(cleanupExpiredValidations, 5 * 60 * 1000);

module.exports = {
  createCashValidation,
  getPendingValidations,
  checkValidationStatus,
  confirmCashPayment,
  rejectCashPayment,
  cleanupExpiredValidations
};
