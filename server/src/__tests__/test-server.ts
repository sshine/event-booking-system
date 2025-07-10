import { createApp } from '../index';
import { Server } from 'http';
import { AddressInfo } from 'net';

let testServer: Server | null = null;
let testPort: number | null = null;

export const startTestServer = async (): Promise<{ server: Server; port: number }> => {
  return new Promise((resolve, reject) => {
    const app = createApp();

    // Use port 0 to get a random available port
    testServer = app.listen(0, () => {
      const address = testServer!.address() as AddressInfo;
      testPort = address.port;
      console.log(`Test server started on port ${testPort}`);
      resolve({ server: testServer!, port: testPort });
    });

    testServer.on('error', (err) => {
      reject(err);
    });
  });
};

export const stopTestServer = async (): Promise<void> => {
  return new Promise((resolve) => {
    if (testServer) {
      testServer.close(() => {
        console.log('Test server stopped');
        testServer = null;
        testPort = null;
        resolve();
      });
    } else {
      resolve();
    }
  });
};

export const getTestPort = (): number | null => {
  return testPort;
};

export const getTestServer = (): Server | null => {
  return testServer;
};