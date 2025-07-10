import { database } from '../models/database';
import { stopTestServer } from './test-server';
import dotenv from 'dotenv';

// Load test environment variable
dotenv.config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = ':memory:'; // Use in-memory SQLite for test
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';

let testDb: any;

export const setupTestDatabase = async (): Promise<void> => {
  return new Promise((resolve) => {
    // Initialize test database in memory
    testDb = database.getDb();

    // Wait for database initialization to complete
    setTimeout(() => {
      resolve();
    }, 100);
  });
};

export const clearTestDatabase = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!testDb) {
      resolve();
      return;
    }

    // Clear all tables in the correct order (respecting foreign key constraints)
    testDb.serialize(() => {
      testDb.run('DELETE FROM bookings', (err: any) => {
        if (err) {
          console.error('Error clearing bookings:', err);
          reject(err);
          return;
        }

        testDb.run('DELETE FROM events', (err: any) => {
          if (err) {
            console.error('Error clearing events:', err);
            reject(err);
            return;
          }

          testDb.run('DELETE FROM users', (err: any) => {
            if (err) {
              console.error('Error clearing users:', err);
              reject(err);
              return;
            }

            resolve();
          });
        });
      });
    });
  });
};

export const cleanupTestResources = async (): Promise<void> => {
  // Close database connection
  if (testDb) {
    await new Promise<void>((resolve) => {
      testDb.close((err: any) => {
        if (err) {
          console.error('Error closing test database:', err);
        }
        resolve();
      });
    });
    testDb = null;
  }

  // Stop test server
  await stopTestServer();

  // Force garbage collection to clean up any remaining handle
  if (global.gc) {
    global.gc();
  }
};

// Global test setup
beforeAll(async () => {
  await setupTestDatabase();
});

// Clear database before each test
beforeEach(async () => {
  await clearTestDatabase();
});

// Global test teardown
afterAll(async () => {
  await cleanupTestResources();

  // Give a small delay to ensure all async operations complete
  await new Promise(resolve => setTimeout(resolve, 100));
});