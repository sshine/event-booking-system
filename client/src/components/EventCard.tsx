import React from 'react';
import type { Event } from '../types';

interface EventCardProps {
  event: Event;
  onViewDetails: (eventId: number) => void;
  onBook?: (eventId: number) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onViewDetails, onBook }) => {
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
    <div className="event-card">
      {event.image_url && (
        <img src={event.image_url} alt={event.title} className="event-image" />
      )}
      <div className="event-content">
        <h3 className="event-title">{event.title}</h3>
        <p className="event-description">{event.description}</p>
        
        <div className="event-details">
          <div className="event-datetime">
            <span className="date">{formatDate(event.date)}</span>
            <span className="time">
              {formatTime(event.start_time)} - {formatTime(event.end_time)}
            </span>
          </div>
          
          <div className="event-location">
            <span>📍 {event.location}</span>
          </div>
          
          <div className="event-capacity">
            <span className={`capacity ${event.is_full ? 'full' : ''}`}>
              {event.available_spots} spots available
            </span>
          </div>
          
          {event.price > 0 && (
            <div className="event-price">
              <span>${event.price.toFixed(2)}</span>
            </div>
          )}
        </div>
        
        <div className="event-actions">
          <button 
            className="btn btn-secondary"
            onClick={() => onViewDetails(event.id)}
          >
            View Details
          </button>
          
          {onBook && (
            <button 
              className={`btn btn-primary ${event.is_full ? 'disabled' : ''}`}
              onClick={() => onBook(event.id)}
              disabled={event.is_full}
            >
              {event.is_full ? 'Fully Booked' : 'Book Now'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};