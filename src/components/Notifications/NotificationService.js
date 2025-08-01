import axios from 'axios';
import io from 'socket.io-client';
import BASE_URL from "../endpoints/endpoints";

class NotificationService {
  constructor() {
    this.socket = io(BASE_URL);
    this.listeners = {};
  }

  // Connect to socket
  connect() {
    this.socket.connect();
  }

  // Disconnect from socket
  disconnect() {
    this.socket.disconnect();
  }

  // Send notification to admin when order is placed
  async sendAdminTopupNotification(topupData) {
    try {
      await axios.post(`${BASE_URL}/api/notifications/admin`, {
        type: 'new_topup',
        message: `New top-up request of GHS ${topupData.amount} submitted by ${topupData.userName || 'a user'}`,
        data: topupData
      });
      // Emit event through socket for real-time notification
      this.socket.emit('admin_notification', {
        type: 'new_topup',
        message: `New top-up request of GHS ${topupData.amount} submitted by ${topupData.userName || 'a user'}`,
        data: topupData
      });
    } catch (error) {
      console.error('Error sending admin notification:', error);
    }
  }

  // Send notification to user when order is approved
  async sendUserTopupApprovedNotification(userId, topupData) {
    try {
      await axios.post(`${BASE_URL}/api/notifications/user`, {
        userId,
        type: 'topup_approved',
        message: `Your top-up request of GHS ${topupData.amount} has been approved!`,
        data: topupData
      });
      // Emit event through socket for real-time notification
      this.socket.emit('user_notification', {
        userId,
        type: 'topup_approved',
        message: `Your top-up request of GHS ${topupData.amount} has been approved!`,
        data: topupData
      });
    } catch (error) {
      console.error('Error sending user notification:', error);
    }
  }

  // Subscribe to admin notifications
  subscribeToAdminNotifications(callback) {
    this.socket.on('admin_notification', (notification) => {
      callback(notification);
    });
    return () => this.socket.off('admin_notification');
  }

  // Subscribe to user notifications
  subscribeToUserNotifications(userId, callback) {
    const handler = (notification) => {
      if (notification.userId === userId) {
        callback(notification);
      }
    };
    
    this.socket.on('user_notification', handler);
    return () => this.socket.off('user_notification', handler);
  }
}

// Export as singleton
const notificationService = new NotificationService();
export default notificationService;