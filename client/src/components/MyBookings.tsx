import React, { useState, useEffect } from 'react';
import type { Booking } from '../types';
import { bookingsApi } from '../services/api';

interface MyBookingsProps {
  onViewEvent: (eventId: number) => void;
}

export const MyBookings: React.FC<MyBookingsProps> = ({ onViewEvent }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const bookingData = await bookingsApi.getAll();
        setBookings(bookingData);
      } catch (err) {
        setError('Failed to fetch bookings');
        console.error('Error fetching bookings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const handleCancelBooking = async (bookingId: number) => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      await bookingsApi.cancel(bookingId);
      setBookings(prev => prev.map(booking =>
        booking.id === bookingId
          ? { ...booking, status: 'cancelled' }
          : booking
      ));
    } catch (err) {
      console.error('Error cancelling booking:', err);
      alert('Failed to cancel booking');
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

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading your bookings...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <button
          className="btn btn-primary"
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="empty-state">
        <h2>No Bookings Yet</h2>
        <p>You haven't booked any events yet. Browse our events to get started!</p>
        <button
          className="btn btn-primary"
          onClick={() => onViewEvent(0)}
        >
          Browse Events
        </button>
      </div>
    );
  }

  return (
    <div className="bookings-container">
      <h1>My Bookings</h1>

      <div className="bookings-list">
        {bookings.map((booking) => (
          <div key={booking.id} className="booking-card">
            <div className="booking-header">
              <h3>{booking.event_title}</h3>
              <span className={`status ${booking.status}`}>
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </span>
            </div>

            <div className="booking-details">
              <div className="detail-item">
                <strong>Date:</strong> {booking.event_date && formatDate(booking.event_date)}
              </div>
              <div className="detail-item">
                <strong>Time:</strong> {booking.event_start_time && formatTime(booking.event_start_time)}
              </div>
              <div className="detail-item">
                <strong>Location:</strong> {booking.event_location}
              </div>
              <div className="detail-item">
                <strong>Attendee:</strong> {booking.attendee_name}
              </div>
              <div className="detail-item">
                <strong>Email:</strong> {booking.attendee_email}
              </div>
              {booking.attendee_phone && (
                <div className="detail-item">
                  <strong>Phone:</strong> {booking.attendee_phone}
                </div>
              )}
              <div className="detail-item">
                <strong>Booking ID:</strong> #{booking.id}
              </div>
            </div>

            <div className="booking-actions">
              <button
                className="btn btn-secondary"
                onClick={() => onViewEvent(booking.event_id)}
              >
                View Event
              </button>

              {booking.status === 'confirmed' && (
                <button
                  className="btn btn-danger"
                  onClick={() => handleCancelBooking(booking.id)}
                >
                  Cancel Booking
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};