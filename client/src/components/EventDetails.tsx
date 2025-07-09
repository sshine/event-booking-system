import React, { useState, useEffect } from 'react';
import type { Event } from '../types';
import { eventsApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface EventDetailsProps {
  eventId: number;
  onBack: () => void;
  onBook: (eventId: number) => void;
}

export const EventDetails: React.FC<EventDetailsProps> = ({ eventId, onBack, onBook }) => {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

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
    <div className="event-details">
      <div className="event-header">
        <button className="btn btn-secondary back-button" onClick={onBack}>
          ← Back to Events
        </button>
      </div>

      <div className="event-details-content">
        {event.image_url && (
          <img src={event.image_url} alt={event.title} className="event-hero-image" />
        )}

        <div className="event-info">
          <h1 className="event-title">{event.title}</h1>
          
          <div className="event-meta">
            <div className="meta-item">
              <strong>Date:</strong> {formatDate(event.date)}
            </div>
            <div className="meta-item">
              <strong>Time:</strong> {formatTime(event.start_time)} - {formatTime(event.end_time)}
            </div>
            <div className="meta-item">
              <strong>Location:</strong> {event.location}
            </div>
            <div className="meta-item">
              <strong>Available Spots:</strong> 
              <span className={`capacity ${event.is_full ? 'full' : ''}`}>
                {event.available_spots} / {event.capacity}
              </span>
            </div>
            {event.price > 0 && (
              <div className="meta-item">
                <strong>Price:</strong> ${event.price.toFixed(2)}
              </div>
            )}
          </div>

          <div className="event-description">
            <h3>About this event</h3>
            <p>{event.description}</p>
          </div>

          <div className="event-actions">
            {isAuthenticated ? (
              <button 
                className={`btn btn-primary ${event.is_full ? 'disabled' : ''}`}
                onClick={() => onBook(event.id)}
                disabled={event.is_full}
              >
                {event.is_full ? 'Fully Booked' : 'Book Now'}
              </button>
            ) : (
              <div className="auth-prompt">
                <p>Please log in to book this event</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => window.location.href = '/login'}
                >
                  Log In
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};