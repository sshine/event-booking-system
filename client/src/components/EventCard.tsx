import React from 'react';
import { HiMapPin, HiClock } from 'react-icons/hi2';
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
      <div className="relative overflow-hidden">
        {event.image_url && (
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-48 object-cover"
          />
        )}

        <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-md text-sm font-bold">
          -{discount}%
        </div>

        <div className="absolute top-3 right-3 bg-white bg-opacity-90 px-2 py-1 rounded-md text-xs font-medium text-gray-700">
          {getEventCategory()}
        </div>
      </div>

      <div className="event-content">
        <h3 className="event-title">{event.title}</h3>

        <div className="event-meta">
          <div className="event-detail">
            <HiMapPin className="w-4 h-4" />
            <span>{event.location}</span>
          </div>

          <div className="event-detail">
            <HiClock className="w-4 h-4" />
            <span>{calculateTimeLeft()}</span>
          </div>
        </div>

        <div className="event-price mb-4">
          <span className="current-price">${event.price.toFixed(0)}</span>
          <span className="original-price">${originalPrice.toFixed(0)}</span>
        </div>

        <button
          className={`get-tickets-btn ${
            event.is_full ? 'disabled' : ''
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