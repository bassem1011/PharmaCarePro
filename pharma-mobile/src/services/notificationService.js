// Notification service removed - expo-notifications no longer supported in Expo Go
// This service has been disabled to prevent errors

class NotificationService {
  constructor() {
    this.isInitialized = false;
  }

  async initialize() {
    // Service disabled

    this.isInitialized = true;
  }

  setupNotificationListeners() {
    // Service disabled
  }

  async handleNotificationResponse(response) {
    // Service disabled
  }

  navigateToScreen(screenName, params = {}) {
    // Service disabled
  }

  setNavigationRef(ref) {
    // Service disabled
  }

  async scheduleLocalNotification(title, body, data = {}, trigger = null) {
    // Service disabled
    return true;
  }

  async sendAttendanceAlert(pharmacyName, presentCount, totalCount) {
    // Service disabled
    return true;
  }

  async sendInventoryAlert(pharmacyName, lowStockItems) {
    // Service disabled
    return true;
  }

  async sendPharmacyUpdate(pharmacyName, updateType) {
    // Service disabled
    return true;
  }

  async scheduleDailyAttendanceReminder() {
    // Service disabled
    return true;
  }

  async scheduleWeeklyReportReminder() {
    // Service disabled
    return true;
  }

  async cancelNotification(notificationId) {
    // Service disabled
    return true;
  }

  async cancelAllNotifications() {
    // Service disabled
    return true;
  }

  async getBadgeCount() {
    return 0;
  }

  async setBadgeCount(count) {
    // Service disabled
  }

  cleanup() {
    // Service disabled
  }

  getExpoPushToken() {
    return null;
  }
}

export default new NotificationService();
