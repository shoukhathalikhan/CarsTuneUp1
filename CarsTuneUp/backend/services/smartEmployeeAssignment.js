const mongoose = require('mongoose');
const Employee = require('../models/Employee.model');
const Job = require('../models/Job.model');
const User = require('../models/User.model');

/**
 * Smart Employee Assignment Service
 * Handles job assignment with proper load balancing and daily limits
 */

// Get available employees for a specific date with capacity checks
const getAvailableEmployeesForDate = async (targetDate) => {
  try {
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    // Get all available employees
    const allEmployees = await Employee.find({
      isAvailable: true
    })
    .populate('userId', 'name email')
    .sort({ 'assignedCustomers': 1, _id: 1 });

    // Check job count for each employee on the target date
    const employeesWithCapacity = [];
    
    for (const employee of allEmployees) {
      // Count jobs already assigned to this employee for the target date
      const jobCountForDate = await Job.countDocuments({
        employeeId: employee._id,
        scheduledDate: {
          $gte: startOfDay,
          $lt: endOfDay
        },
        status: { $in: ['scheduled', 'in-progress'] }
      });

      // Check if employee has capacity (max 6 jobs per day)
      const dailyLimit = employee.dailyLimit || 6;
      const hasCapacity = jobCountForDate < dailyLimit;

      console.log(`Employee ${employee.userId?.name || employee.employeeId}: ${jobCountForDate}/${dailyLimit} jobs for ${targetDate.toDateString()}`);

      if (hasCapacity) {
        employeesWithCapacity.push({
          ...employee.toObject(),
          currentJobCount: jobCountForDate,
          remainingCapacity: dailyLimit - jobCountForDate
        });
      }
    }

    // Sort by current job count (least loaded first)
    employeesWithCapacity.sort((a, b) => a.currentJobCount - b.currentJobCount);

    return employeesWithCapacity;
  } catch (error) {
    console.error('Error getting available employees:', error);
    throw error;
  }
};

// Assign job to best available employee for a specific date
const assignJobToBestEmployee = async (jobData) => {
  try {
    const { scheduledDate, customerId, serviceId, subscriptionId, location } = jobData;
    
    console.log(`🔍 Finding best employee for job on ${scheduledDate.toDateString()}`);
    
    // Get available employees with capacity for the target date
    const availableEmployees = await getAvailableEmployeesForDate(scheduledDate);
    
    if (availableEmployees.length === 0) {
      throw new Error(`No employees available for ${scheduledDate.toDateString()}. All employees have reached their daily limit (6 jobs).`);
    }

    // Select the employee with least jobs for that date
    const bestEmployee = availableEmployees[0];
    
    console.log(`✅ Assigned job to ${bestEmployee.userId?.name || bestEmployee.employeeId} (${bestEmployee.currentJobCount}/${bestEmployee.dailyLimit || 6} jobs)`);

    // Create the job with the assigned employee
    const job = await Job.create({
      employeeId: bestEmployee._id,
      customerId,
      serviceId,
      subscriptionId,
      scheduledDate,
      status: 'scheduled',
      location
    });

    // Update employee's daily job count (for tracking)
    if (!bestEmployee.assignedJobsToday) {
      bestEmployee.assignedJobsToday = 0;
    }
    bestEmployee.assignedJobsToday = (bestEmployee.assignedJobsToday || 0) + 1;
    
    await Employee.findByIdAndUpdate(bestEmployee._id, {
      assignedJobsToday: bestEmployee.assignedJobsToday
    });

    return {
      job,
      assignedEmployee: bestEmployee
    };
  } catch (error) {
    console.error('Error assigning job to employee:', error);
    throw error;
  }
};

// Reassign job if current employee is not available or over capacity
const reassignJobIfNeeded = async (jobId) => {
  try {
    const job = await Job.findById(jobId);
    
    if (!job) {
      throw new Error('Job not found');
    }

    // Check if current employee has capacity for this date
    const availableEmployees = await getAvailableEmployeesForDate(job.scheduledDate);
    const currentEmployeeAvailable = availableEmployees.find(emp => emp._id.toString() === job.employeeId.toString());

    if (currentEmployeeAvailable) {
      console.log(`✅ Current employee still available for job on ${job.scheduledDate.toDateString()}`);
      return job; // No reassignment needed
    }

    // Need to reassign to a different employee
    console.log(`⚠️  Current employee not available, reassigning job...`);
    
    const newAssignment = await assignJobToBestEmployee({
      scheduledDate: job.scheduledDate,
      customerId: job.customerId,
      serviceId: job.serviceId,
      subscriptionId: job.subscriptionId,
      location: job.location
    });

    // Delete old job and return new one
    await Job.findByIdAndDelete(jobId);

    console.log(`🔄 Job reassigned from old employee to ${newAssignment.assignedEmployee.userId?.name || newAssignment.assignedEmployee.employeeId}`);
    
    return newAssignment.job;
  } catch (error) {
    console.error('Error reassigning job:', error);
    throw error;
  }
};

// Check and rebalance all jobs for a specific date
const rebalanceJobsForDate = async (targetDate) => {
  try {
    console.log(`🔄 Rebalancing jobs for ${targetDate.toDateString()}`);
    
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    // Get all jobs for the target date
    const jobsForDate = await Job.find({
      scheduledDate: {
        $gte: startOfDay,
        $lt: endOfDay
      },
      status: { $in: ['scheduled', 'in-progress'] }
    }).populate('employeeId');

    console.log(`Found ${jobsForDate.length} jobs to check for ${targetDate.toDateString()}`);

    // Get current employee loads
    const availableEmployees = await getAvailableEmployeesForDate(targetDate);
    const employeeLoads = {};
    
    availableEmployees.forEach(emp => {
      employeeLoads[emp._id.toString()] = emp.currentJobCount;
    });

    console.log('Current employee loads:', employeeLoads);

    // Check for over-assigned employees
    const overAssignedJobs = [];
    
    for (const job of jobsForDate) {
      const employeeId = job.employeeId._id.toString();
      const currentLoad = employeeLoads[employeeId] || 0;
      
      if (currentLoad >= 6) { // Over the daily limit
        console.log(`⚠️  Employee ${job.employeeId.userId?.name || job.employeeId.employeeId} is over capacity (${currentLoad}/6)`);
        overAssignedJobs.push(job._id);
      }
    }

    // Reassign over-assigned jobs
    const reassignedJobs = [];
    for (const jobId of overAssignedJobs) {
      try {
        const newJob = await reassignJobIfNeeded(jobId);
        reassignedJobs.push(newJob);
        console.log(`✅ Reassigned job ${jobId}`);
      } catch (error) {
        console.error(`❌ Failed to reassign job ${jobId}:`, error.message);
      }
    }

    console.log(`✅ Rebalancing complete: ${reassignedJobs.length} jobs reassigned`);
    
    return {
      totalJobs: jobsForDate.length,
      overAssignedJobs: overAssignedJobs.length,
      reassignedJobs: reassignedJobs.length
    };
  } catch (error) {
    console.error('Error rebalancing jobs:', error);
    throw error;
  }
};

// Export all functions
module.exports = {
  getAvailableEmployeesForDate,
  assignJobToBestEmployee,
  reassignJobIfNeeded,
  rebalanceJobsForDate
};
