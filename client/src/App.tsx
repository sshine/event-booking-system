import { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { Navigation } from './components/Navigation';
import { EventsList } from './components/EventsList';
import { EventDetails } from './components/EventDetails';
import { BookingForm } from './components/BookingForm';
import { BookingConfirmation } from './components/BookingConfirmation';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { MyBookings } from './components/MyBookings';
import type { Event } from './types';
import { eventsApi } from './services/api';

type ViewType = 'events' | 'event-details' | 'booking-form' | 'booking-confirmation' | 'login' | 'register' | 'bookings';

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('events');
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [bookingId, setBookingId] = useState<number | null>(null);

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view);
    if (view === 'events') {
      setSelectedEventId(null);
      setSelectedEvent(null);
      setBookingId(null);
    }
  };

  const handleEventSelect = async (eventId: number) => {
    try {
      const event = await eventsApi.getById(eventId);
      setSelectedEvent(event);
      setSelectedEventId(eventId);
      setCurrentView('event-details');
    } catch (error) {
      console.error('Error fetching event:', error);
    }
  };

  const handleBookEvent = async (eventId: number) => {
    try {
      const event = await eventsApi.getById(eventId);
      setSelectedEvent(event);
      setSelectedEventId(eventId);
      setCurrentView('booking-form');
    } catch (error) {
      console.error('Error fetching event for booking:', error);
    }
  };

  const handleBookingComplete = (newBookingId: number) => {
    setBookingId(newBookingId);
    setCurrentView('booking-confirmation');
  };

  const handleAuthSuccess = () => {
    setCurrentView('events');
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'events':
        return (
          <EventsList 
            onEventSelect={handleEventSelect}
            onBookEvent={handleBookEvent}
          />
        );
      
      case 'event-details':
        return selectedEventId ? (
          <EventDetails 
            eventId={selectedEventId}
            onBack={() => setCurrentView('events')}
            onBook={handleBookEvent}
          />
        ) : null;
      
      case 'booking-form':
        return selectedEvent ? (
          <BookingForm 
            event={selectedEvent}
            onBookingComplete={handleBookingComplete}
            onCancel={() => setCurrentView('event-details')}
          />
        ) : null;
      
      case 'booking-confirmation':
        return bookingId ? (
          <BookingConfirmation 
            bookingId={bookingId}
            onBackToEvents={() => setCurrentView('events')}
          />
        ) : null;
      
      case 'login':
        return (
          <Login 
            onLoginSuccess={handleAuthSuccess}
            onSwitchToRegister={() => setCurrentView('register')}
          />
        );
      
      case 'register':
        return (
          <Register 
            onRegisterSuccess={handleAuthSuccess}
            onSwitchToLogin={() => setCurrentView('login')}
          />
        );
      
      case 'bookings':
        return (
          <MyBookings 
            onViewEvent={handleEventSelect}
          />
        );
      
      default:
        return <EventsList onEventSelect={handleEventSelect} onBookEvent={handleBookEvent} />;
    }
  };

  return (
    <AuthProvider>
      <div className="app">
        <Navigation 
          currentView={currentView}
          onViewChange={handleViewChange as (view: string) => void}
        />
        <main className="main-content">
          {renderCurrentView()}
        </main>
      </div>
    </AuthProvider>
  );
}

export default App;