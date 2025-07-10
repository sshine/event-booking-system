# API Testing Suite

This directory contains comprehensive tests for the EventBooker API using Jest and Supertest.

## Test Structure

### Core Test Files

- **`setup.ts`** - Global test configuration and database setup
- **`helpers.ts`** - Test utilities, factories, and helper functions
- **`auth.test.ts`** - Authentication endpoint tests
- **`events.test.ts`** - Events CRUD operation tests
- **`bookings.test.ts`** - Booking management tests
- **`integration.test.ts`** - End-to-end workflow tests

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests with detailed output
npm run test:verbose

# Run specific test file
npm test auth.test.ts

# Run tests matching a pattern
npm test -- --testNamePattern="should register user"
```

## Test Database

Tests use an **in-memory SQLite database** that is:
- Created fresh for each test run
- Isolated between tests (cleaned before each test)
- Automatically torn down after tests complete
- Does not affect your development database

## Test Coverage

The test suite covers:

### Authentication API (`/api/auth`)
- ✅ User registration with validation
- ✅ User login with credential verification
- ✅ Profile retrieval with JWT authentication
- ✅ Logout functionality
- ✅ JWT token validation and security
- ✅ Error handling for invalid credentials

### Events API (`/api/events`)
- ✅ Event listing with availability calculation
- ✅ Individual event retrieval
- ✅ Event creation (admin only)
- ✅ Event updates (admin only)
- ✅ Event deletion (admin only)
- ✅ Authorization and permission checks
- ✅ Input validation and sanitization
- ✅ Date filtering (upcoming events only)

### Bookings API (`/api/bookings`)
- ✅ User booking creation and validation
- ✅ Booking listing for authenticated users
- ✅ Individual booking retrieval
- ✅ Booking cancellation
- ✅ Event capacity management
- ✅ Duplicate booking prevention
- ✅ Admin booking overview by event
- ✅ Business logic validation

### Integration Tests
- ✅ Complete user journey workflows
- ✅ Cross-endpoint functionality
- ✅ Error handling and edge cases
- ✅ Security headers and CORS
- ✅ Rate limiting behavior
- ✅ Database transaction integrity

## Test Utilities

### Factory Functions
```typescript
createTestUser(overrides?)     // Generate test user data
createTestAdmin(overrides?)    // Generate admin user data
createTestEvent(overrides?)    // Generate event data
createTestBooking(overrides?)  // Generate booking data
```

### Authentication Helpers
```typescript
registerUser(userData)         // Register and return user + token
loginUser(email, password)     // Login and return user + token
createUserInDb(userData)       // Create user in test database
createAdminInDb()             // Create admin in test database
```

### Database Helpers
```typescript
createEventInDb(eventData, adminToken)    // Create event in database
createBookingInDb(bookingData, userToken) // Create booking in database
```

### Assertion Helpers
```typescript
expectError(response, status, message?)      // Assert error response
expectValidationError(response, field?)     // Assert validation error
expectSuccessResponse(response, status?)    // Assert success response
```

## Test Data

### Sample Users
- **Regular User**: `test@example.com` / `password123`
- **Admin User**: `admin@example.com` / `adminpass123`

### Sample Events
- **Default Event**: December 25, 2025, 2:00-4:00 PM, capacity 10, $25.00

### Sample Bookings
- **Default Booking**: Test Attendee, `attendee@example.com`

## Test Environment

Tests run with:
- `NODE_ENV=test`
- In-memory SQLite database (`:memory:`)
- Test JWT secret
- Isolated from development environment
- Sequential execution to avoid conflicts

## Error Scenarios Tested

### Authentication
- Invalid email formats
- Short passwords
- Duplicate user registration
- Wrong credentials
- Invalid/expired tokens
- Missing authorization headers

### Events
- Unauthorized access (non-admin operations)
- Invalid date formats
- Negative capacity/price
- Non-existent event operations
- Input validation failures

### Bookings
- Booking non-existent events
- Booking past events
- Duplicate bookings
- Capacity exceeded scenarios
- Cross-user booking access
- Invalid attendee information

### Database
- Constraint violations
- Foreign key errors
- Concurrent access scenarios
- Data integrity checks

## Performance Considerations

- Tests use in-memory database for speed
- Sequential execution prevents race conditions
- Minimal test data for fast execution
- Isolated test environment prevents interference

## Best Practices

1. **Test Isolation**: Each test is independent and can run alone
2. **Clean State**: Database is cleared before each test
3. **Realistic Data**: Test data mirrors production scenarios
4. **Error Coverage**: Both success and failure paths tested
5. **Security Testing**: Authentication and authorization verified
6. **Business Logic**: Complex workflows and edge cases covered

## Debugging Tests

### Common Issues

**Tests timing out**: Increase timeout in `jest.config.js`
```javascript
testTimeout: 15000
```

**Database conflicts**: Tests run sequentially (`maxWorkers: 1`)

**Authentication errors**: Check JWT secret in test environment

**Validation failures**: Verify test data matches API requirements

### Debugging Commands

```bash
# Run single test with full output
npm test -- --testNamePattern="specific test name" --verbose

# Run tests with debugging output
DEBUG=* npm test

# Run tests without coverage for cleaner output
npm test -- --collectCoverage=false
```

## Coverage Reports

Coverage reports are generated in the `coverage/` directory and include:
- Line coverage
- Function coverage
- Branch coverage
- Statement coverage

Open `coverage/lcov-report/index.html` in your browser to view detailed coverage.

## Adding New Tests

1. **Create test file**: Follow naming pattern `*.test.ts`
2. **Import helpers**: Use existing utilities from `helpers.ts`
3. **Use setup**: Database setup is automatic via `setup.ts`
4. **Follow patterns**: Mirror existing test structure
5. **Add documentation**: Update this README when adding new test categories