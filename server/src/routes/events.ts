import express from 'express';
import { body, validationResult } from 'express-validator';
import { database } from '../models/database';
import { CreateEventRequest, Event, EventWithAvailability } from '../types';
import { authenticateToken, requireAdmin, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

const validateEvent = [
  body('title').isLength({ min: 1 }).trim().escape(),
  body('description').optional().trim().escape(),
  body('date').isISO8601(),
  body('start_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('end_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('location').isLength({ min: 1 }).trim().escape(),
  body('capacity').isInt({ min: 1 }),
  body('price').isFloat({ min: 0 }),
  body('image_url').optional().isURL(),
];

router.get('/', async (req: express.Request, res: express.Response) => {
  try {
    const db = database.getDb();

    const query = `
      SELECT
        e.*,
        COALESCE(e.capacity - COUNT(b.id), e.capacity) as available_spots,
        CASE WHEN COUNT(b.id) >= e.capacity THEN 1 ELSE 0 END as is_full
      FROM events e
      LEFT JOIN bookings b ON e.id = b.event_id AND b.status = 'confirmed'
      WHERE e.date >= date('now')
      GROUP BY e.id
      ORDER BY e.date ASC, e.start_time ASC
    `;

    db.all(query, [], (err: any, rows: EventWithAvailability[]) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to fetch events' });
      }

      const events = rows.map(event => ({
        ...event,
        is_full: Boolean(event.is_full)
      }));

      res.json(events);
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req: express.Request, res: express.Response) => {
  try {
    const eventId = parseInt(req.params.id!);

    if (isNaN(eventId)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    const db = database.getDb();

    const query = `
      SELECT
        e.*,
        COALESCE(e.capacity - COUNT(b.id), e.capacity) as available_spots,
        CASE WHEN COUNT(b.id) >= e.capacity THEN 1 ELSE 0 END as is_full
      FROM events e
      LEFT JOIN bookings b ON e.id = b.event_id AND b.status = 'confirmed'
      WHERE e.id = ?
      GROUP BY e.id
    `;

    db.get(query, [eventId], (err: any, row: EventWithAvailability) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to fetch event' });
      }

      if (!row) {
        return res.status(404).json({ error: 'Event not found' });
      }

      const event = {
        ...row,
        is_full: Boolean(row.is_full)
      };

      res.json(event);
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticateToken, requireAdmin, validateEvent, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const eventData: CreateEventRequest = req.body;
    const db = database.getDb();

    const query = `
      INSERT INTO events (title, description, date, start_time, end_time, location, capacity, price, image_url, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(
      query,
      [
        eventData.title,
        eventData.description,
        eventData.date,
        eventData.start_time,
        eventData.end_time,
        eventData.location,
        eventData.capacity,
        eventData.price,
        eventData.image_url,
        req.user!.id
      ],
      function(err: any) {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Failed to create event' });
        }

        res.status(201).json({
          message: 'Event created successfully',
          eventId: this.lastID
        });
      }
    );
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authenticateToken, requireAdmin, validateEvent, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const eventId = parseInt(req.params.id!);
    const eventData: CreateEventRequest = req.body;
    const db = database.getDb();

    const query = `
      UPDATE event
      SET title = ?, description = ?, date = ?, start_time = ?, end_time = ?,
          location = ?, capacity = ?, price = ?, image_url = ?
      WHERE id = ?
    `;

    db.run(
      query,
      [
        eventData.title,
        eventData.description,
        eventData.date,
        eventData.start_time,
        eventData.end_time,
        eventData.location,
        eventData.capacity,
        eventData.price,
        eventData.image_url,
        eventId
      ],
      function(err: any) {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Failed to update event' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: 'Event not found' });
        }

        res.json({ message: 'Event updated successfully' });
      }
    );
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const eventId = parseInt(req.params.id!);
    const db = database.getDb();

    db.run('DELETE FROM events WHERE id = ?', [eventId], function(err: any) {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to delete event' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Event not found' });
      }

      res.json({ message: 'Event deleted successfully' });
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
