import React, { useState, useEffect } from 'react';
import { HiMapPin, HiClock, HiCalendar } from 'react-icons/hi2';
import type { Event } from '../types';
import { eventsApi, authApi, bookingsApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface EventDetailsWithBookingProps {
  eventId: number;
  onBack: () => void;
  onBookingComplete: (bookingId: number) => void;
}

type AuthState = 'logged-in' | 'email-check' | 'password-needed' | 'register-needed';

export const EventDetailsWithBooking: React.FC<EventDetailsWithBookingProps> = ({
  eventId,
  onBack,
  onBookingComplete
}) => {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, user, login, register } = useAuth();

  // Booking form state
  const [authState, setAuthState] = useState<AuthState>('logged-in');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: user?.email || '',
    password: '',
    quantity: 1,
    attendee_name: user?.name || '',
    attendee_phone: ''
  });
  const [existingUserName, setExistingUserName] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const eventData = await eventsApi.getById(eventId);
        setEvent(eventData);
      } catch (err) {
        setError('Failed to fetch event details');
        console.error('Error fetching event:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  useEffect(() => {
    if (isAuthenticated && user) {
      setAuthState('logged-in');
      setFormData(prev => ({
        ...prev,
        email: user.email,
        attendee_name: user.name
      }));
    } else {
      setAuthState('email-check');
    }
  }, [isAuthenticated, user]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' ? parseInt(value, 10) : value
    }));
  };

  const handleEmailCheck = async () => {
    if (!formData.email) {
      setBookingError('Please enter your email address');
      return;
    }

    try {
      setBookingLoading(true);
      setBookingError(null);

      const response = await authApi.checkEmail({ email: formData.email });

      if (response.exists) {
        setExistingUserName(response.name);
        setAuthState('password-needed');
        setFormData(prev => ({
          ...prev,
          attendee_name: response.name || ''
        }));
      } else {
        setAuthState('register-needed');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setBookingError(error.response?.data?.error || 'Failed to check email');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleAuth = async () => {
    try {
      setBookingLoading(true);
      setBookingError(null);

      if (authState === 'password-needed') {
        // Login existing user
        await login(formData.email, formData.password);
        setAuthState('logged-in');
      } else if (authState === 'register-needed') {
        // Register new user
        await register(formData.email, formData.password, formData.attendee_name);
        setAuthState('logged-in');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setBookingError(error.response?.data?.error || 'Authentication failed');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      await handleAuth();
      return;
    }

    try {
      setBookingLoading(true);
      setBookingError(null);

      const bookingData = {
        event_id: event!.id,
        attendee_name: formData.attendee_name,
        attendee_email: formData.email,
        attendee_phone: formData.attendee_phone || undefined,
        quantity: formData.quantity
      };

      const response = await bookingsApi.create(bookingData);
      onBookingComplete(response.bookingId);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setBookingError(error.response?.data?.error || 'Failed to create booking');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading event details...</div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="error-container">
        <div className="error-message">{error || 'Event not found'}</div>
        <button className="btn btn-secondary" onClick={onBack}>
          Back to Events
        </button>
      </div>
    );
  }

  return (
    <div className="event-details-with-booking">
      <div className="event-header">
        <button className="btn btn-secondary back-button" onClick={onBack}>
          ← Back to Events
        </button>
      </div>

      <div className="event-details-booking-layout">
        {/* Left Column - Event Details */}
        <div className="event-details-column">
          {event.image_url && (
            <img src={event.image_url} alt={event.title} className="event-hero-image" />
          )}

          <div className="event-info">
            <h1 className="event-title">{event.title}</h1>

            <div className="event-meta">
              <div className="meta-item">
                <HiCalendar className="meta-icon" />
                <span>{formatDate(event.date)}</span>
              </div>
              <div className="meta-item">
                <HiClock className="meta-icon" />
                <span>{formatTime(event.start_time)} - {formatTime(event.end_time)}</span>
              </div>
              <div className="meta-item">
                <HiMapPin className="meta-icon" />
                <span>{event.location}</span>
              </div>
              <div className="meta-item">
                <strong>Available Spots:</strong>
                <span className={`capacity ${event.is_full ? 'full' : ''}`}>
                  {event.available_spots} / {event.capacity}
                </span>
              </div>
              {event.price > 0 && (
                <div className="meta-item">
                  <strong>Price:</strong> ${event.price.toFixed(2)} per person
                </div>
              )}
            </div>

            <div className="event-description">
              <h3>About this event</h3>
              <p>{event.description}</p>
            </div>
          </div>
        </div>

        {/* Right Column - Booking Form */}
        <div className="booking-form-column">
          <div className="booking-form-container">
            <h2>Book Your Spot</h2>

            {event.is_full ? (
              <div className="booking-unavailable">
                <h3>Event Fully Booked</h3>
                <p>Sorry, this event has reached maximum capacity.</p>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="booking-form">
                {bookingError && (
                  <div className="error-message">
                    {bookingError}
                  </div>
                )}

                {/* Quantity Selection */}
                <div className="form-group">
                  <label htmlFor="quantity">Number of Tickets</label>
                  <select
                    id="quantity"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    disabled={bookingLoading}
                  >
                    {Array.from({ length: Math.min(10, event.available_spots) }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1} {i === 0 ? 'ticket' : 'tickets'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Email Field */}
                {!isAuthenticated && (
                  <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      disabled={bookingLoading || authState !== 'email-check'}
                    />
                    {authState === 'email-check' && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-small"
                        onClick={handleEmailCheck}
                        disabled={bookingLoading || !formData.email}
                      >
                        Continue
                      </button>
                    )}
                  </div>
                )}

                {/* Password Field for existing users */}
                {authState === 'password-needed' && (
                  <div className="form-group">
                    <label htmlFor="password">
                      Welcome back, {existingUserName}! Please enter your password:
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      disabled={bookingLoading}
                    />
                  </div>
                )}

                {/* Registration fields for new users */}
                {authState === 'register-needed' && (
                  <>
                    <div className="auth-info">
                      <p>Looks like you&apos;re new here! Let&apos;s create your account:</p>
                    </div>
                    <div className="form-group">
                      <label htmlFor="attendee_name">Your Name</label>
                      <input
                        type="text"
                        id="attendee_name"
                        name="attendee_name"
                        value={formData.attendee_name}
                        onChange={handleInputChange}
                        required
                        disabled={bookingLoading}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="password">Create a Password</label>
                      <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        minLength={6}
                        disabled={bookingLoading}
                      />
                    </div>
                  </>
                )}

                {/* Attendee Details (shown when logged in or registering) */}
                {(isAuthenticated || authState === 'register-needed') && (
                  <>
                    <div className="form-group">
                      <label htmlFor="attendee_phone">Phone Number (Optional)</label>
                      <input
                        type="tel"
                        id="attendee_phone"
                        name="attendee_phone"
                        value={formData.attendee_phone}
                        onChange={handleInputChange}
                        disabled={bookingLoading}
                      />
                    </div>
                  </>
                )}

                {/* Price Summary */}
                {event.price > 0 && (
                  <div className="price-summary">
                    <div className="price-row">
                      <span>${event.price.toFixed(2)} × {formData.quantity} ticket{formData.quantity > 1 ? 's' : ''}</span>
                      <span>${(event.price * formData.quantity).toFixed(2)}</span>
                    </div>
                    <div className="price-total">
                      <strong>Total: ${(event.price * formData.quantity).toFixed(2)}</strong>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  className="btn btn-primary btn-full"
                  disabled={bookingLoading || (!isAuthenticated && authState === 'email-check')}
                >
                  {bookingLoading ? 'Processing...' :
                   authState === 'password-needed' ? 'Login & Book' :
                   authState === 'register-needed' ? 'Create Account & Book' :
                   'Confirm Booking'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};