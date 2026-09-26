import { api } from './api';

const QUEUE_KEY = 'lc_crm_offline_attendance_queue';

export const offlineSync = {
  // Add item to queue
  enqueueAttendance(data) {
    const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    queue.push({ id: Date.now(), data, timestamp: new Date().toISOString() });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  },

  // Get pending count
  getPendingCount() {
    const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    return queue.length;
  },

  // Process offline queue when online
  async syncQueue() {
    const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    if (queue.length === 0) return 0;

    let syncedCount = 0;
    const remainingQueue = [];

    for (const item of queue) {
      try {
        await api.saveAttendanceBatch(item.data);
        syncedCount++;
      } catch (err) {
        console.error('Failed to sync offline item:', err);
        remainingQueue.push(item);
      }
    }

    localStorage.setItem(QUEUE_KEY, JSON.stringify(remainingQueue));
    return syncedCount;
  },

  // Register online event listener
  initAutoSync(onSyncedCallback) {
    window.addEventListener('online', async () => {
      console.log('Internet qaytdi! Offline navbat sinxronizatsiya qilinmoqda...');
      const count = await this.syncQueue();
      if (count > 0 && onSyncedCallback) {
        onSyncedCallback(count);
      }
    });
  }
};
