import React, { useState, useEffect } from 'react';
import type { Event } from '../types';
import { eventsApi } from '../services/api';
import { EventCard } from './EventCard';

interface EventsListProps {
  onEventSelect: (eventId: number) => void;
  onBookEvent: (eventId: number) => void;
}

export const EventsList: React.FC<EventsListProps> = ({ onEventSelect, onBookEvent }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const eventData = await eventsApi.getAll();
        setEvents(eventData);
      } catch (err) {
        setError('Failed to fetch events');
        console.error('Error fetching events:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading events...</div>
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

  if (events.length === 0) {
    return (
      <div className="empty-state">
        <h2>No Events Available</h2>
        <p>There are currently no upcoming events scheduled.</p>
      </div>
    );
  }

  return (
    <div className="events-container">
      <h1>Upcoming Events</h1>
      <div className="events-grid">
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onViewDetails={onEventSelect}
            onBook={onBookEvent}
          />
        ))}
      </div>
    </div>
  );
};