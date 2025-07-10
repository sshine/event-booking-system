import express from 'express';
import { body, validationResult } from 'express-validator';
import { database } from '../models/database';
import { CreateBookingRequest } from '../types';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

const validateBooking = [
  body('event_id').isInt({ min: 1 }),
  body('attendee_name').isLength({ min: 1 }).trim().escape(),
  body('attendee_email').isEmail().normalizeEmail(),
  body('attendee_phone').optional().matches(/^\+?[\d\s\-()]+$/),
  body('quantity').optional().isInt({ min: 1, max: 10 }),
];

router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const db = database.getDb();

    const query = `
      SELECT
        b.*,
        e.title as event_title,
        e.date as event_date,
        e.start_time as event_start_time,
        e.location as event_location
      FROM bookings b
      JOIN events e ON b.event_id = e.id
      WHERE b.user_id = ?
      ORDER BY b.booking_date DESC
    `;

    db.all(query, [req.user!.id], (err: any, rows: any) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to fetch bookings' });
      }

      res.json(rows);
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const bookingId = parseInt(req.params.id!);
    const db = database.getDb();

    const query = `
      SELECT
        b.*,
        e.title as event_title,
        e.date as event_date,
        e.start_time as event_start_time,
        e.end_time as event_end_time,
        e.location as event_location,
        e.description as event_description
      FROM bookings b
      JOIN events e ON b.event_id = e.id
      WHERE b.id = ? AND b.user_id = ?
    `;

    db.get(query, [bookingId, req.user!.id], (err: any, row: any) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to fetch booking' });
      }

      if (!row) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      res.json(row);
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticateToken, validateBooking, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const bookingData: CreateBookingRequest = req.body;
    const db = database.getDb();

    db.serialize(() => {
      db.get(
        'SELECT * FROM events WHERE id = ? AND date >= date("now")',
        [bookingData.event_id],
        (err: any, event: any) => {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to validate event' });
          }

          if (!event) {
            return res.status(404).json({ error: 'Event not found or has already passed' });
          }

          db.get(
            'SELECT COALESCE(SUM(quantity), 0) as booked_spots FROM bookings WHERE event_id = ? AND status = "confirmed"',
            [bookingData.event_id],
            (err: any, result: { booked_spots: number }) => {
              if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to check event capacity' });
              }

              const eventCapacity = (event as any).capacity;
              const requestedQuantity = bookingData.quantity || 1;
              const availableSpots = eventCapacity - result.booked_spots;

              if (requestedQuantity > availableSpots) {
                return res.status(400).json({
                  error: `Only ${availableSpots} spots available, but ${requestedQuantity} requested`
                });
              }

              db.get(
                'SELECT id FROM bookings WHERE event_id = ? AND user_id = ?',
                [bookingData.event_id, req.user!.id],
                (err: any, existingBooking: any) => {
                  if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Failed to check existing booking' });
                  }

                  if (existingBooking) {
                    return res.status(400).json({ error: 'You have already booked this event' });
                  }

                  const insertQuery = `
                    INSERT INTO bookings (event_id, user_id, attendee_name, attendee_email, attendee_phone, quantity)
                    VALUES (?, ?, ?, ?, ?, ?)
                  `;

                  db.run(
                    insertQuery,
                    [
                      bookingData.event_id,
                      req.user!.id,
                      bookingData.attendee_name,
                      bookingData.attendee_email,
                      bookingData.attendee_phone,
                      requestedQuantity
                    ],
                    function(err: any) {
                      if (err) {
                        console.error('Database error:', err);
                        return res.status(500).json({ error: 'Failed to create booking' });
                      }

                      res.status(201).json({
                        message: 'Booking created successfully',
                        bookingId: this.lastID
                      });
                    }
                  );
                }
              );
            }
          );
        }
      );
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id/cancel', authenticateToken, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const bookingId = parseInt(req.params.id!);
    const db = database.getDb();

    db.serialize(() => {
      db.get(
        'SELECT * FROM bookings WHERE id = ? AND user_id = ?',
        [bookingId, req.user!.id],
        (err: any, booking: any) => {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to fetch booking' });
          }

          if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
          }

          if ((booking as any).status === 'cancelled') {
            return res.status(400).json({ error: 'Booking is already cancelled' });
          }

          db.run(
            'UPDATE bookings SET status = "cancelled" WHERE id = ?',
            [bookingId],
            function(err: any) {
              if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to cancel booking' });
              }

              res.json({ message: 'Booking cancelled successfully' });
            }
          );
        }
      );
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/event/:eventId', authenticateToken, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const eventId = parseInt(req.params.eventId!);
    const db = database.getDb();

    if (req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const query = `
      SELECT
        b.*,
        u.name as user_name,
        u.email as user_email
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      WHERE b.event_id = ?
      ORDER BY b.booking_date DESC
    `;

    db.all(query, [eventId], (err: any, rows: any) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to fetch event bookings' });
      }

      res.json(rows);
    });
  } catch (error) {
    console.error('Error fetching event bookings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;