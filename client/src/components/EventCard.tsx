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
        <img src={event.image_url} alt={event.title} className="w-full h-48 object-cover" />
      )}
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{event.title}</h3>
        <p className="text-gray-600 mb-4 line-clamp-3">{event.description}</p>
        
        <div className="space-y-3 mb-6">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-900">{formatDate(event.date)}</span>
            <span className="text-sm text-gray-600">
              {formatTime(event.start_time)} - {formatTime(event.end_time)}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>📍</span>
            <span>{event.location}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              event.is_full 
                ? 'bg-red-100 text-red-800' 
                : event.available_spots <= 5 
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-green-100 text-green-800'
            }`}>
              {event.available_spots} spots available
            </span>
          </div>
          
          {event.price > 0 && (
            <div className="text-lg font-semibold text-primary-blue">
              ${event.price.toFixed(2)}
            </div>
          )}
        </div>
        
        <div className="flex gap-3">
          <button 
            className="flex-1 px-4 py-2 text-sm font-medium text-primary-blue bg-white border border-primary-blue rounded-md hover:bg-primary-blue hover:text-white transition-colors"
            onClick={() => onViewDetails(event.id)}
          >
            View Details
          </button>
          
          {onBook && (
            <button 
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                event.is_full 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-primary-green text-white hover:bg-opacity-90'
              }`}
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