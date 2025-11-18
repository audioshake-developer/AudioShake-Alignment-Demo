// AudioShake API Client
class AudioShakeAPI {
    constructor() {
        this.baseURL = 'https://api.audioshake.ai';
        this.apiKey = null;
        this.dbName = 'audioshake_alignment_demo';
        this.storeName = 'credentials';
        this.db = null;
        this.listeners = {};
        this.initDB();
    }

    // IndexedDB Setup
    async initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);

            request.onerror = () => reject(request.error);

            request.onsuccess = () => {
                this.db = request.result;
                this.loadStoredKey();
                resolve();
            };

            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName);
                }
            };
        });
    }

    async loadStoredKey() {
        try {
            const key = await this.getFromDB('apiKey');
            if (key) {
                this.apiKey = key;
                this.emit('keyLoaded', key);
            }
        } catch (err) {
            console.error('Error loading stored key:', err);
        }
    }

    async getFromDB(key) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }

            const tx = this.db.transaction([this.storeName], 'readonly');
            const store = tx.objectStore(this.storeName);
            const request = store.get(key);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async saveToDB(key, value) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }

            const tx = this.db.transaction([this.storeName], 'readwrite');
            const store = tx.objectStore(this.storeName);
            const request = store.put(value, key);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async setAPIKey(key) {
        this.apiKey = key;
        await this.saveToDB('apiKey', key);
        this.emit('keyUpdated', key);
    }

    getAPIKey() {
        return this.apiKey;
    }

    hasAPIKey() {
        return !!this.apiKey;
    }

    async clearAPIKey() {
        this.apiKey = null;
        if (this.db) {
            const tx = this.db.transaction([this.storeName], 'readwrite');
            const store = tx.objectStore(this.storeName);
            await store.delete('apiKey');
        }
        this.emit('keyCleared');
    }

    // Event Emitter
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(cb => cb(data));
        }
    }

    // API Requests
    async request(endpoint, options = {}) {
        if (!this.apiKey) {
            throw new Error('API key not set. Please authorize first.');
        }

        const url = `${this.baseURL}${endpoint}`;
        const config = {
            ...options,
            headers: {
                'x-api-key': this.apiKey,
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, config);

            // Handle non-JSON responses
            const contentType = response.headers.get('content-type');
            let data;

            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const text = await response.text();
                data = { message: text, status: response.status };
            }

            if (!response.ok) {
                throw new Error(data.message || data.error || `API Error: ${response.status}`);
            }

            return data;
        } catch (err) {
            if (err.message.includes('Failed to fetch')) {
                throw new Error('Network error. Please check your connection.');
            }
            throw err;
        }
    }

    // Create Task with targets
    async createTask(url, targets, callbackUrl = null) {
        const payload = {
            url,
            targets,
            ...(callbackUrl && { callbackUrl })
        };

        return await this.request('/tasks', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    }

    // Create Alignment Task (helper method)
    async createAlignmentTask(url, formats = ['json'], language = 'en') {
        return await this.createTask(url, [
            {
                model: 'alignment',
                formats,
                language
            }
        ]);
    }

    // Get Task by ID
    async getTask(taskId) {
        return await this.request(`/tasks/${taskId}`);
    }

    // List Tasks
    async listTasks(params = {}) {
        const queryParams = new URLSearchParams(params).toString();
        const endpoint = queryParams ? `/tasks?${queryParams}` : '/tasks';
        return await this.request(endpoint);
    }

    // Get Task Statistics
    async getTaskStatistics(name = 'usage') {
        return await this.request(`/tasks/statistics?name=${name}`);
    }

    // Poll Task Status
    async pollTask(taskId, onUpdate, maxAttempts = 60, interval = 2000) {
        let attempts = 0;

        return new Promise((resolve, reject) => {
            const poll = async () => {
                try {
                    attempts++;
                    const task = await this.getTask(taskId);

                    if (onUpdate) {
                        onUpdate(task);
                    }

                    if (task.status === 'completed') {
                        resolve(task);
                    } else if (task.status === 'failed') {
                        reject(new Error(task.error || 'Task failed'));
                    } else if (attempts >= maxAttempts) {
                        reject(new Error('Polling timeout - task still processing'));
                    } else {
                        setTimeout(poll, interval);
                    }
                } catch (err) {
                    reject(err);
                }
            };

            poll();
        });
    }

    // Fetch Alignment JSON
    async fetchAlignment(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch alignment: ${response.status}`);
            }
            return await response.json();
        } catch (err) {
            throw new Error(`Error fetching alignment data: ${err.message}`);
        }
    }

    // Validate API Key
    async validateKey() {
        try {
            await this.listTasks({ limit: 1 });
            return true;
        } catch (err) {
            return false;
        }
    }
}

// Export singleton instance
const api = new AudioShakeAPI();