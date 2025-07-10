import React, { useState } from 'react';
import type { Event } from '../types';
import { bookingsApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface BookingFormProps {
  event: Event;
  onBookingComplete: (bookingId: number) => void;
  onCancel: () => void;
}

export const BookingForm: React.FC<BookingFormProps> = ({ event, onBookingComplete, onCancel }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    attendee_name: user?.name || '',
    attendee_email: user?.email || '',
    attendee_phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const bookingData = {
        event_id: event.id,
        attendee_name: formData.attendee_name,
        attendee_email: formData.attendee_email,
        attendee_phone: formData.attendee_phone || undefined
      };

      const response = await bookingsApi.create(bookingData);
      onBookingComplete(response.bookingId);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create booking');
      console.error('Booking error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="booking-form-container">
      <div className="booking-form">
        <h2>Book Your Spot</h2>

        <div className="event-summary">
          <h3>{event.title}</h3>
          <p><strong>Date:</strong> {formatDate(event.date)}</p>
          <p><strong>Time:</strong> {formatTime(event.start_time)} - {formatTime(event.end_time)}</p>
          <p><strong>Location:</strong> {event.location}</p>
          {event.price > 0 && (
            <p><strong>Price:</strong> ${event.price.toFixed(2)}</p>
          )}
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="attendee_name">Full Name *</label>
            <input
              type="text"
              id="attendee_name"
              name="attendee_name"
              value={formData.attendee_name}
              onChange={handleInputChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="attendee_email">Email Address *</label>
            <input
              type="email"
              id="attendee_email"
              name="attendee_email"
              value={formData.attendee_email}
              onChange={handleInputChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="attendee_phone">Phone Number</label>
            <input
              type="tel"
              id="attendee_phone"
              name="attendee_phone"
              value={formData.attendee_phone}
              onChange={handleInputChange}
              disabled={loading}
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Booking...' : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};