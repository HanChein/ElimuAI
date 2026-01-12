const twilio = require('twilio');
const crypto = require('crypto');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Store OTP temporarily (in production, use Redis or database)
const otpStore = new Map();

// Send SMS
const sendSMS = async (to, message) => {
  try {
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to
    });

    console.log('SMS sent:', result.sid);
    return { success: true, messageId: result.sid };
  } catch (error) {
    console.error('SMS send error:', error);
    return { success: false, error: error.message };
  }
};

// Send OTP for verification
const sendOTP = async (phoneNumber, userId) => {
  try {
    const otp = generateOTP();
    const expiresAt = Date.now() + (5 * 60 * 1000); // 5 minutes

    // Store OTP with expiration
    otpStore.set(phoneNumber, {
      otp,
      userId,
      expiresAt,
      attempts: 0
    });

    const message = `Your ElimuAI verification code is: ${otp}. This code expires in 5 minutes.`;

    const result = await sendSMS(phoneNumber, message);

    if (result.success) {
      return { success: true, message: 'OTP sent successfully' };
    } else {
      return { success: false, message: 'Failed to send OTP' };
    }
  } catch (error) {
    console.error('OTP send error:', error);
    return { success: false, message: 'Failed to send OTP' };
  }
};

// Verify OTP
const verifyOTP = (phoneNumber, enteredOTP) => {
  const storedData = otpStore.get(phoneNumber);

  if (!storedData) {
    return { success: false, message: 'OTP not found or expired' };
  }

  if (Date.now() > storedData.expiresAt) {
    otpStore.delete(phoneNumber);
    return { success: false, message: 'OTP has expired' };
  }

  if (storedData.attempts >= 3) {
    otpStore.delete(phoneNumber);
    return { success: false, message: 'Too many failed attempts' };
  }

  if (storedData.otp === enteredOTP) {
    otpStore.delete(phoneNumber);
    return { success: true, message: 'OTP verified successfully', userId: storedData.userId };
  } else {
    storedData.attempts += 1;
    return { success: false, message: 'Invalid OTP' };
  }
};

// Send notification SMS
const sendNotificationSMS = async (phoneNumber, type, data) => {
  let message = '';

  switch (type) {
    case 'welcome':
      message = `Welcome to ElimuAI, ${data.username}! Start your learning journey today.`;
      break;
    case 'course_completed':
      message = `Congratulations! You've completed "${data.courseTitle}". Keep up the great work!`;
      break;
    case 'badge_earned':
      message = `🏆 Congratulations! You've earned the "${data.badgeName}" badge on ElimuAI!`;
      break;
    case 'streak_reminder':
      message = `🔥 Don't break your ${data.streak} day learning streak! Complete a lesson today.`;
      break;
    case 'weekly_summary':
      message = `📊 This week: ${data.lessonsCompleted} lessons, ${data.avgScore}% avg score. Great progress!`;
      break;
    case 'payment_reminder':
      message = `💳 Your premium subscription expires in ${data.daysLeft} days. Renew now to continue learning.`;
      break;
    default:
      message = data.message || 'You have a new notification from ElimuAI.';
  }

  return await sendSMS(phoneNumber, message);
};

// Send bulk notifications
const sendBulkSMS = async (recipients, message) => {
  const results = [];

  for (const recipient of recipients) {
    try {
      const result = await sendSMS(recipient.phoneNumber, message);
      results.push({
        phoneNumber: recipient.phoneNumber,
        success: result.success,
        messageId: result.messageId,
        userId: recipient.userId
      });
    } catch (error) {
      results.push({
        phoneNumber: recipient.phoneNumber,
        success: false,
        error: error.message,
        userId: recipient.userId
      });
    }

    // Rate limiting - wait 100ms between messages
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return results;
};

// Get SMS delivery status
const getSMSDeliveryStatus = async (messageId) => {
  try {
    const message = await client.messages(messageId).fetch();
    return {
      status: message.status,
      dateSent: message.dateSent,
      dateDelivered: message.dateDelivered,
      errorCode: message.errorCode,
      errorMessage: message.errorMessage
    };
  } catch (error) {
    console.error('SMS status check error:', error);
    return { status: 'unknown', error: error.message };
  }
};

// Clean up expired OTPs
const cleanupExpiredOTPs = () => {
  const now = Date.now();
  for (const [phoneNumber, data] of otpStore.entries()) {
    if (now > data.expiresAt) {
      otpStore.delete(phoneNumber);
    }
  }
};

// Run cleanup every 5 minutes
setInterval(cleanupExpiredOTPs, 5 * 60 * 1000);

module.exports = {
  sendSMS,
  sendOTP,
  verifyOTP,
  sendNotificationSMS,
  sendBulkSMS,
  getSMSDeliveryStatus
};
