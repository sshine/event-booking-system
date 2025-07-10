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
        <div className="loading-spinner"></div>
        <span className="loading-text">Loading events...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <button
          className="mt-4 px-4 py-2 text-sm font-medium text-white bg-primary-blue rounded-md hover:bg-opacity-90 transition-colors"
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
        <div className="empty-icon">📅</div>
        <h2 className="empty-title">No Events Available</h2>
        <p className="empty-description">There are currently no upcoming events scheduled.</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2 sparkly-gradient-text">Upcoming Events</h1>
        <p className="text-gray-600">Discover and book exciting events happening near you</p>
      </div>
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