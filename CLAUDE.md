# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

This is a monorepo using npm workspaces with separate client and server packages:

```bash
# Development (runs both client and server concurrently)
npm run dev                    # Starts both frontend (port 5173) and backend (port 3001)
npm run dev:client            # Frontend only
npm run dev:server            # Backend only

# Building
npm run build                 # Builds both client and server
npm run build --workspace=client
npm run build --workspace=server

# Type checking
npm run typecheck --workspace=server
cd client && npm run lint     # ESLint for client

# Production
npm run start                 # Starts production server only
```

## Architecture Overview

### Monorepo Structure
- **Root**: npm workspaces configuration with concurrently for parallel development
- **Server**: Express.js API with TypeScript, SQLite database
- **Client**: React SPA with TypeScript, Vite build system

### Key Architectural Patterns

**Authentication System**: JWT-based with middleware chain
- `server/src/middleware/auth.ts` exports `authenticateToken` and `requireAdmin` middleware
- `AuthenticatedRequest` interface extends Express Request with user property
- Frontend uses `AuthContext` with localStorage persistence and automatic token refresh

**Database Design**: Self-initializing SQLite with relationship constraints
- `server/src/models/database.ts` creates tables on startup
- Three main entities: `users`, `events`, `bookings`
- Unique constraint: `UNIQUE(event_id, user_id)` prevents duplicate bookings
- Role-based access: users have 'user' or 'admin' roles

**Frontend State Management**: Custom view-based routing without React Router
- `App.tsx` manages application state with `ViewType` enum
- `AuthContext` provides global authentication state
- API calls trigger view transitions (e.g., event selection → event details view)

## Critical Environment Setup

Server requires `.env` file (copy from `.env.example`):
```bash
cp server/.env.example server/.env
# Edit server/.env - MUST change JWT_SECRET for production
```

Required environment variables:
- `JWT_SECRET`: Used for token signing (critical for security)
- `DATABASE_URL`: SQLite file path (defaults to `./database.sqlite`)
- `CORS_ORIGIN`: Frontend URL for CORS (defaults to `http://localhost:5173`)

## API Architecture

**Route Organization**:
- `server/src/routes/auth.ts`: User registration, login, profile
- `server/src/routes/events.ts`: Event CRUD (admin-only for CUD operations)
- `server/src/routes/bookings.ts`: Booking management and event capacity logic

**Validation Pattern**: Uses `express-validator` with validation middleware arrays
```typescript
const validateEvent = [
  body('title').isLength({ min: 1 }).trim().escape(),
  // ... other validations
];
router.post('/', authenticateToken, requireAdmin, validateEvent, handler);
```

**Capacity Management**: Events track available spots via SQL aggregation
```sql
SELECT e.*, COALESCE(e.capacity - COUNT(b.id), e.capacity) as available_spots
FROM events e LEFT JOIN bookings b ON e.id = b.event_id AND b.status = 'confirmed'
```

## Database Schema Details

**Users Table**:
- `role` field with CHECK constraint: `'user'` or `'admin'`
- Email uniqueness enforced at DB level

**Events Table**:
- Foreign key to `users.id` (created_by)
- Date filtering: `WHERE e.date >= date('now')` for upcoming events

**Bookings Table**:
- Composite unique constraint prevents double-booking same event
- Status field: `'confirmed'` or `'cancelled'`
- Soft delete pattern (status change vs deletion)

## Frontend Type System

**Shared Types**: `client/src/types/index.ts` and `server/src/types/index.ts`
- `Event` interface includes computed fields (`available_spots`, `is_full`)
- `AuthenticatedRequest` extends Express Request for middleware typing
- Type-only imports used for better tree-shaking: `import type { Event }`

**API Layer**: `client/src/services/api.ts`
- Axios interceptors for automatic token attachment and 401 handling
- Automatic logout and redirect on authentication failure
- Centralized error handling for API responses

## Key Development Patterns

**Component Structure**: Functional components with TypeScript interfaces
- Props interfaces defined inline or exported for reuse
- Custom hooks pattern: `useAuth()` for authentication state

**Error Handling**: Consistent pattern across routes
- Database errors logged to console
- User-friendly error messages returned to client
- Try-catch blocks with proper HTTP status codes

**Security Middleware Stack**:
```typescript
app.use(helmet());           // Security headers
app.use(cors({ ... }));      // CORS configuration
app.use(limiter);           // Rate limiting
app.use(express.json({ limit: '10mb' }));
```

## Testing Architecture

No test framework currently configured. When adding tests:
- Server: Consider Jest with supertest for API testing
- Client: Vite supports Vitest out of the box
- Database: Use in-memory SQLite for test isolation