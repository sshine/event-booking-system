import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATABASE_PATH = process.env.DATABASE_URL || path.join(__dirname, '../../database.sqlite');

export class Database {
  private db: sqlite3.Database;

  constructor() {
    this.db = new sqlite3.Database(DATABASE_PATH, (err) => {
      if (err) {
        console.error('Error opening database:', err);
      } else {
        console.log('Connected to SQLite database');
        this.initializeTables();
      }
    });
  }

  private initializeTables(): void {
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createEventsTable = `
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        date TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        location TEXT NOT NULL,
        capacity INTEGER NOT NULL,
        price DECIMAL(10,2) DEFAULT 0.00,
        image_url TEXT,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users (id)
      )
    `;

    const createBookingsTable = `
      CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        attendee_name TEXT NOT NULL,
        attendee_email TEXT NOT NULL,
        attendee_phone TEXT,
        quantity INTEGER DEFAULT 1,
        booking_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'confirmed' CHECK(status IN ('confirmed', 'cancelled')),
        FOREIGN KEY (event_id) REFERENCES events (id),
        FOREIGN KEY (user_id) REFERENCES users (id),
        UNIQUE(event_id, user_id)
      )
    `;

    this.db.exec(createUsersTable);
    this.db.exec(createEventsTable);
    this.db.exec(createBookingsTable);

    // Add quantity column to existing bookings table if it doesn't exist
    this.db.run(`
      PRAGMA table_info(bookings)
    `, (err: any, rows: any) => {
      if (!err) {
        this.db.all(`PRAGMA table_info(bookings)`, (err: any, columns: any[]) => {
          if (!err && columns) {
            const hasQuantityColumn = columns.some(col => col.name === 'quantity');
            if (!hasQuantityColumn) {
              this.db.run(`ALTER TABLE bookings ADD COLUMN quantity INTEGER DEFAULT 1`);
              console.log('Added quantity column to bookings table');
            }
          }
        });
      }
    });
  }

  public getDb(): sqlite3.Database {
    return this.db;
  }

  public close(): void {
    this.db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      } else {
        console.log('Database connection closed');
      }
    });
  }
}

export const database = new Database();