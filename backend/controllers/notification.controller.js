const admin = require('firebase-admin');
const User = require('../models/User.model');
const Job = require('../models/Job.model');
const Service = require('../models/Service.model');

/**
 * Send push notification to a user
 */
async function sendPushNotification(userId, title, body, data = {}) {
  try {
    const user = await User.findById(userId);
    
    if (!user || !user.fcmToken) {
      console.log(`No FCM token found for user ${userId}`);
      return null;
    }

    const message = {
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        timestamp: new Date().toISOString(),
      },
      token: user.fcmToken,
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const response = await admin.messaging().send(message);
    console.log('✅ Notification sent successfully:', response);
    return response;
  } catch (error) {
    console.error('❌ Error sending notification:', error);
    return null;
  }
}

/**
 * Send notification when service is booked
 */
exports.sendBookingConfirmation = async (userId, serviceName) => {
  return await sendPushNotification(
    userId,
    '🎉 Service Booked Successfully!',
    `Thank you for booking ${serviceName}! We will send you the scheduled service dates very soon.`,
    {
      type: 'booking_confirmed',
      action: 'view_subscriptions',
    }
  );
};

/**
 * Send notification when employee is assigned
 */
exports.sendEmployeeAssigned = async (userId, employeeName, serviceName) => {
  return await sendPushNotification(
    userId,
    '👨‍🔧 Employee Assigned',
    `${employeeName} has been assigned to your ${serviceName} service. You will receive the schedule details shortly.`,
    {
      type: 'employee_assigned',
      action: 'view_subscriptions',
    }
  );
};

/**
 * Send notification for upcoming scheduled service
 */
exports.sendUpcomingServiceNotification = async (userId, serviceName, scheduledDate) => {
  const date = new Date(scheduledDate);
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return await sendPushNotification(
    userId,
    '📅 Next Service Scheduled',
    `Your ${serviceName} is scheduled for ${formattedDate} at ${formattedTime}. Our team will arrive at your location on time.`,
    {
      type: 'next_wash',
      scheduledDate: scheduledDate.toISOString(),
      action: 'view_subscriptions',
    }
  );
};

/**
 * Send notification when service is completed
 */
exports.sendServiceCompletedNotification = async (userId, serviceName) => {
  return await sendPushNotification(
    userId,
    '✅ Service Completed',
    `Your ${serviceName} has been completed successfully! Thank you for choosing CarsTuneUp. We hope to serve you again.`,
    {
      type: 'wash_completed',
      action: 'view_history',
    }
  );
};

/**
 * Send notification when new service is added
 */
exports.sendNewServiceNotification = async (serviceName, serviceDescription) => {
  try {
    // Get all active users with FCM tokens
    const users = await User.find({
      fcmToken: { $exists: true, $ne: null },
      isActive: true,
    });

    console.log(`📢 Sending new service notification to ${users.length} users`);

    const promises = users.map(user =>
      sendPushNotification(
        user._id,
        '🆕 New Service Available!',
        `Check out our new ${serviceName} service! ${serviceDescription}`,
        {
          type: 'new_service',
          serviceName,
          action: 'view_services',
        }
      )
    );

    await Promise.allSettled(promises);
    console.log('✅ New service notifications sent to all users');
  } catch (error) {
    console.error('❌ Error sending new service notifications:', error);
  }
};

/**
 * Send reminder notification 1 day before scheduled service
 */
exports.sendServiceReminder = async (jobId) => {
  try {
    const job = await Job.findById(jobId)
      .populate('customerId')
      .populate('serviceId');

    if (!job) {
      console.log(`Job ${jobId} not found`);
      return;
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const scheduledDate = new Date(job.scheduledDate);
    scheduledDate.setHours(0, 0, 0, 0);

    // Only send if scheduled for tomorrow
    if (scheduledDate.getTime() === tomorrow.getTime()) {
      await sendPushNotification(
        job.customerId._id,
        '⏰ Service Reminder',
        `Reminder: Your ${job.serviceId.name} is scheduled for tomorrow. Our team will be there on time!`,
        {
          type: 'service_reminder',
          jobId: job._id.toString(),
          action: 'view_subscriptions',
        }
      );
    }
  } catch (error) {
    console.error('❌ Error sending service reminder:', error);
  }
};

/**
 * Batch send notifications for all upcoming services (run daily via cron)
 */
exports.sendDailyServiceReminders = async () => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    const upcomingJobs = await Job.find({
      scheduledDate: {
        $gte: tomorrow,
        $lt: dayAfterTomorrow,
      },
      status: 'scheduled',
    })
      .populate('customerId')
      .populate('serviceId');

    console.log(`📅 Sending reminders for ${upcomingJobs.length} upcoming services`);

    for (const job of upcomingJobs) {
      await exports.sendUpcomingServiceNotification(
        job.customerId._id,
        job.serviceId.name,
        job.scheduledDate
      );
    }

    console.log('✅ Daily service reminders sent');
  } catch (error) {
    console.error('❌ Error sending daily reminders:', error);
  }
};

module.exports = exports;
