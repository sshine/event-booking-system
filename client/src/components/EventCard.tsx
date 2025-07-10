import React from 'react';
import type { Event } from '../types';

interface EventCardProps {
  event: Event;
  onViewDetails: (eventId: number) => void;
  onBook?: (eventId: number) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onViewDetails, onBook }) => {
  const calculateTimeLeft = () => {
    const eventDate = new Date(event.date);
    const now = new Date();
    const diffTime = eventDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return '1 day left';
    if (diffDays > 1) return `${diffDays} days left`;
    if (diffDays === 0) return 'Today';
    return 'Past event';
  };

  const calculateDiscount = () => {
    return Math.floor(Math.random() * 30) + 10;
  };

  const getEventCategory = () => {
    const categories = ['Workshop', 'Music', 'Art', 'Sports & Fitness', 'Comedy', 'Film'];
    return categories[Math.floor(Math.random() * categories.length)];
  };

  const originalPrice = event.price * 1.3;
  const discount = calculateDiscount();

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'BUTTON') return;
    onViewDetails(event.id);
  };

  return (
    <div
      className="event-card-redesign cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="relative">
        {event.image_url && (
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-48 object-cover rounded-t-lg"
          />
        )}

        <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-md text-sm font-bold">
          -{discount}%
        </div>

        <div className="absolute top-3 right-3 bg-white bg-opacity-90 px-2 py-1 rounded-md text-xs font-medium text-gray-700">
          {getEventCategory()}
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{event.title}</h3>

        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          <span>📍</span>
          <span>{event.location}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <span>⏰</span>
          <span>{calculateTimeLeft()}</span>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-blue-600">${event.price.toFixed(0)}</span>
            <span className="text-sm text-gray-500 line-through">${originalPrice.toFixed(0)}</span>
          </div>
        </div>

        <button
          className={`w-full px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            event.is_full
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            if (onBook && !event.is_full) {
              onBook(event.id);
            }
          }}
          disabled={event.is_full}
        >
          {event.is_full ? 'Fully Booked' : 'Get Tickets'}
        </button>
      </div>
    </div>
  );
};