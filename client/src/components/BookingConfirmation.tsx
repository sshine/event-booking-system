import React, { useState, useEffect } from 'react';
import type { Booking } from '../types';
import { bookingsApi } from '../services/api';

interface BookingConfirmationProps {
  bookingId: number;
  onBackToEvents: () => void;
}

export const BookingConfirmation: React.FC<BookingConfirmationProps> = ({ bookingId, onBackToEvents }) => {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setLoading(true);
        const bookingData = await bookingsApi.getById(bookingId);
        setBooking(bookingData);
      } catch (err) {
        setError('Failed to fetch booking details');
        console.error('Error fetching booking:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId]);

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
        <div className="loading-spinner">Loading booking confirmation...</div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="error-container">
        <div className="error-message">{error || 'Booking not found'}</div>
        <button className="btn btn-primary" onClick={onBackToEvents}>
          Back to Events
        </button>
      </div>
    );
  }

  return (
    <div className="booking-confirmation">
      <div className="confirmation-content">
        <div className="success-icon">✓</div>
        <h1>Booking Confirmed!</h1>
        <p>Thank you for your booking. You should receive a confirmation email shortly.</p>

        <div className="booking-details">
          <h3>Booking Details</h3>
          <div className="detail-item">
            <strong>Booking ID:</strong> #{booking.id}
          </div>
          <div className="detail-item">
            <strong>Event:</strong> {booking.event_title}
          </div>
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
            <strong>Status:</strong> 
            <span className={`status ${booking.status}`}>
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </span>
          </div>
        </div>

        <div className="confirmation-actions">
          <button className="btn btn-primary" onClick={onBackToEvents}>
            Back to Events
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => window.location.href = '/bookings'}
          >
            View My Bookings
          </button>
        </div>
      </div>
    </div>
  );
};