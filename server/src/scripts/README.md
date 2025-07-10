# Database Scripts

This directory contains utility scripts for managing the EventBooker database.

## Available Scripts

### 🌱 Seed Events
```bash
npm run seed
```
Adds sample events to the database. The script includes:
- **Crochet Workshop for Beginners** - Learn basic crochet techniques
- **Make Your Own Necklace** - Jewelry-making workshop
- **People's Kitchen: Community Cooking** - Community cooking event
- **Evening Jazz Concert** - Intimate jazz performance
- **Traditional Tea Ceremony Experience** - Learn tea ceremony traditions

**Features:**
- ✅ Prevents duplicate seeding (checks for existing events)
- 📝 Detailed logging of each operation
- 🛡️ Error handling with proper rollback

### 🔍 Verify Events
```bash
npm run verify-events
```
Displays all events in the database with detailed information including:
- Event ID and title
- Description and dates
- Location and capacity
- Pricing information
- Creation timestamps

### 📊 Manual Database Access
```bash
# View all events in a formatted table
sqlite3 database.sqlite -header -column "SELECT * FROM events ORDER BY date;"

# Count events
sqlite3 database.sqlite "SELECT COUNT(*) as total_events FROM events;"

# Delete all events (use with caution!)
sqlite3 database.sqlite "DELETE FROM events;"
```

## Sample Event Details

| Event | Date | Time | Location | Capacity | Price |
|-------|------|------|----------|----------|-------|
| Tea Ceremony | 2025-07-16 | 15:00-17:00 | Zen Garden Pavilion | 10 | $38.00 |
| Make Necklace | 2025-07-18 | 10:00-12:00 | Jewelry Workshop | 8 | $42.50 |
| Crochet Workshop | 2025-07-20 | 14:00-16:30 | Arts & Crafts Studio | 12 | $35.00 |
| People's Kitchen | 2025-07-22 | 17:00-20:00 | Community Kitchen | 20 | $15.00 |
| Jazz Concert | 2025-07-25 | 19:30-21:30 | Blue Note Lounge | 45 | $28.00 |

## Usage Notes

- The seeding script uses user ID `1` (admin user) as the event creator
- All events are scheduled for July 2025 to ensure they appear as "upcoming"
- Events include realistic pricing, capacity, and detailed descriptions
- The database will automatically prevent duplicate event-user bookings via unique constraints

## Troubleshooting

**"No events showing in frontend"**
1. Verify events exist: `npm run verify-events`
2. Check server is running: `npm run dev`
3. Ensure frontend is connected to correct API endpoint

**"Permission denied" errors**
- Ensure you're running scripts from the `server` directory
- Check that the database file has proper write permissions

**"Duplicate events" warning**
- The seed script prevents duplicates automatically
- To re-seed, manually delete existing events first