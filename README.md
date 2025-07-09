# Event Booking System

A full-stack event booking system built with Node.js, React, and TypeScript.

## Features

- **Event Management**: View upcoming events with details, dates, locations, and capacity
- **User Authentication**: Register and login with JWT-based authentication
- **Booking System**: Book events with attendee information and prevent overbooking
- **User Dashboard**: View and manage your bookings
- **Admin Features**: Create, update, and delete events (admin role required)
- **Responsive Design**: Mobile-friendly interface

## Tech Stack

### Backend
- Node.js with Express
- TypeScript
- SQLite database
- JWT authentication
- bcryptjs for password hashing
- express-validator for input validation
- CORS and security middleware

### Frontend
- React 19 with TypeScript
- Vite for build tooling
- Axios for API calls
- Context API for state management
- CSS for styling

## Project Structure

```
event-booking-system/
├── server/           # Backend API
│   ├── src/
│   │   ├── routes/   # API endpoints
│   │   ├── models/   # Database models
│   │   ├── middleware/ # Auth middleware
│   │   ├── utils/    # Utility functions
│   │   └── types/    # TypeScript types
│   ├── package.json
│   └── tsconfig.json
├── client/           # Frontend React app
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── contexts/  # React contexts
│   │   ├── services/  # API services
│   │   └── types/     # TypeScript types
│   ├── package.json
│   └── vite.config.ts
└── package.json      # Root package.json
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd event-booking-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy the example env file
   cp server/.env.example server/.env
   
   # Edit server/.env and update the JWT_SECRET
   ```

4. **Build the applications**
   ```bash
   npm run build
   ```

### Running the Application

#### Development Mode
Run both client and server in development mode:
```bash
npm run dev
```

This will start:
- Backend server at `http://localhost:3001`
- Frontend at `http://localhost:5173`

#### Production Mode
First build both applications:
```bash
npm run build
```

Then start the production server:
```bash
npm run start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/logout` - Logout user

### Events
- `GET /api/events` - Get all upcoming events
- `GET /api/events/:id` - Get event by ID
- `POST /api/events` - Create new event (admin only)
- `PUT /api/events/:id` - Update event (admin only)
- `DELETE /api/events/:id` - Delete event (admin only)

### Bookings
- `GET /api/bookings` - Get user's bookings
- `GET /api/bookings/:id` - Get booking by ID
- `POST /api/bookings` - Create new booking
- `PUT /api/bookings/:id/cancel` - Cancel booking
- `GET /api/bookings/event/:eventId` - Get event bookings (admin only)

## Usage

### For Regular Users
1. **Register/Login**: Create an account or login with existing credentials
2. **Browse Events**: View upcoming events on the homepage
3. **Book Events**: Click "Book Now" on any event to make a reservation
4. **Manage Bookings**: View and cancel your bookings in "My Bookings"

### For Administrators
1. **Create Events**: Use the API to create new events
2. **Manage Events**: Update or delete existing events
3. **View Bookings**: Access booking information for events

## Environment Variables

### Server (.env)
```
NODE_ENV=development
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
DATABASE_URL=./database.sqlite
CORS_ORIGIN=http://localhost:5173
```

## Database Schema

The application uses SQLite with the following tables:
- `users` - User accounts and authentication
- `events` - Event information and details
- `bookings` - Event bookings and attendee information

## Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- Input validation and sanitization
- CORS protection
- Rate limiting
- SQL injection prevention with parameterized queries

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.