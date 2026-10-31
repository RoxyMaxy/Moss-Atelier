// js/memory.js - Local IndexedDB memory store for gift history and checklists
// Operates 100% locally in the browser. Never leaks data outside the device.

import { removeAccents } from './retrieve.js';

const DB_NAME = 'moss-atelier';
const DB_VERSION = 1;

class AtelierMemory {
  constructor() {
    this.db = null;
    this.readyPromise = this.initDB();
  }

  initDB() {
    return new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        // In-memory fallback for environments without IndexedDB (e.g. testing)
        this.memoryStore = {
          gifts: [],
          checklists: new Map(),
          settings: new Map()
        };
        resolve();
        return;
      }

      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = (e) => {
        const db = e.target.result;

        if (!db.objectStoreNames.contains('gifts')) {
          const giftStore = db.createObjectStore('gifts', { keyPath: 'id', autoIncrement: true });
          giftStore.createIndex('recipientIndex', 'recipientNormalized', { unique: false });
          giftStore.createIndex('titleIndex', 'titleNormalized', { unique: false });
        }

        if (!db.objectStoreNames.contains('checklists')) {
          db.createObjectStore('checklists', { keyPath: 'ideaId' });
        }

        if (!db.objectStoreNames.contains('traces')) {
          db.createObjectStore('traces', { keyPath: 'id', autoIncrement: true });
        }
      };

      req.onsuccess = (e) => {
        this.db = e.target.result;
        resolve();
      };

      req.onerror = () => {
        // Fallback to in-memory store if IndexedDB open fails
        this.memoryStore = {
          gifts: [],
          checklists: new Map(),
          settings: new Map()
        };
        resolve();
      };
    });
  }

  async recordGiftGiven(recipient, giftTitle, date = new Date().toISOString()) {
    await this.readyPromise;
    const recipientNormalized = removeAccents(recipient.trim());
    const titleNormalized = removeAccents(giftTitle.trim());

    const record = {
      recipient: recipient.trim(),
      recipientNormalized,
      title: giftTitle.trim(),
      titleNormalized,
      date
    };

    if (this.memoryStore) {
      this.memoryStore.gifts.push(record);
      return;
    }

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['gifts'], 'readwrite');
      const store = tx.objectStore('gifts');
      const req = store.add(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getGiftsForRecipient(recipient) {
    await this.readyPromise;
    const recipientNormalized = removeAccents(recipient.trim());

    if (this.memoryStore) {
      return this.memoryStore.gifts.filter(g => g.recipientNormalized === recipientNormalized);
    }

    return new Promise((resolve) => {
      const tx = this.db.transaction(['gifts'], 'readonly');
      const store = tx.objectStore('gifts');
      const index = store.index('recipientIndex');
      const req = index.getAll(IDBKeyRange.only(recipientNormalized));

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  }

  /**
   * Filters candidate list against previous gifts given to this specific recipient.
   * If recipient is new, previous gifts for other recipients are untouched and not applied.
   */
  async filterGiftsByHistory(candidates = [], recipient = '') {
    if (!recipient) return { kept: candidates, removedCount: 0, removedTitles: [] };

    const pastGifts = await this.getGiftsForRecipient(recipient);
    if (!pastGifts || pastGifts.length === 0) {
      return { kept: candidates, removedCount: 0, removedTitles: [] };
    }

    const pastTitles = new Set(pastGifts.map(g => g.titleNormalized));
    const kept = [];
    const removedTitles = [];

    for (const item of candidates) {
      const normTitle = removeAccents(item.title);
      if (pastTitles.has(normTitle)) {
        removedTitles.push(item.title);
      } else {
        kept.push(item);
      }
    }

    return {
      kept,
      removedCount: removedTitles.length,
      removedTitles
    };
  }

  async saveChecklistState(ideaId, checkedIndices = []) {
    await this.readyPromise;
    if (this.memoryStore) {
      this.memoryStore.checklists.set(ideaId, checkedIndices);
      return;
    }

    return new Promise((resolve) => {
      const tx = this.db.transaction(['checklists'], 'readwrite');
      const store = tx.objectStore('checklists');
      store.put({ ideaId, checkedIndices, updatedAt: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  }

  async getChecklistState(ideaId) {
    await this.readyPromise;
    if (this.memoryStore) {
      return this.memoryStore.checklists.get(ideaId) || [];
    }

    return new Promise((resolve) => {
      const tx = this.db.transaction(['checklists'], 'readonly');
      const store = tx.objectStore('checklists');
      const req = store.get(ideaId);
      req.onsuccess = () => resolve(req.result ? req.result.checkedIndices : []);
      req.onerror = () => resolve([]);
    });
  }

  async resetAll() {
    await this.readyPromise;
    if (this.memoryStore) {
      this.memoryStore.gifts = [];
      this.memoryStore.checklists.clear();
      this.memoryStore.settings.clear();
      return;
    }

    return new Promise((resolve) => {
      const tx = this.db.transaction(['gifts', 'checklists', 'traces'], 'readwrite');
      tx.objectStore('gifts').clear();
      tx.objectStore('checklists').clear();
      tx.objectStore('traces').clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  }
}

export const memory = new AtelierMemory();
