import { database } from '../models/database';

async function verifyEvents(): Promise<void> {
  console.log('🔍 Verifying events in database...\n');

  const db = database.getDb();

  const getEvents = new Promise<any[]>((resolve, reject) => {
    db.all(`
      SELECT
        id,
        title,
        description,
        date,
        start_time,
        end_time,
        location,
        capacity,
        price,
        created_at
      FROM events
      ORDER BY date
    `, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  try {
    const events = await getEvents;

    if (events.length === 0) {
      console.log('❌ No events found in database!');
      console.log('💡 Run "npm run seed" to add sample events.');
      return;
    }

    console.log(`✅ Found ${events.length} events in database:\n`);

    events.forEach((event, index) => {
      console.log(`📅 Event ${index + 1}: ${event.title}`);
      console.log(`   📊 ID: ${event.id}`);
      console.log(`   📝 Description: ${event.description}`);
      console.log(`   📆 Date: ${event.date}`);
      console.log(`   ⏰ Time: ${event.start_time} - ${event.end_time}`);
      console.log(`   📍 Location: ${event.location}`);
      console.log(`   👥 Capacity: ${event.capacity}`);
      console.log(`   💰 Price: $${event.price}`);
      console.log(`   🕒 Created: ${event.created_at}`);
      console.log('');
    });

    // Check if we have all the expected event
    const expectedEvents = [
      'Traditional Tea Ceremony Experience',
      'Make Your Own Necklace',
      'Crochet Workshop for Beginners',
      'People\'s Kitchen: Community Cooking',
      'Evening Jazz Concert'
    ];

    const foundTitles = events.map(e => e.title);
    const allFound = expectedEvents.every(title => foundTitles.includes(title));

    if (allFound) {
      console.log('🎉 All expected sample events are present!');
    } else {
      console.log('⚠️  Some expected events are missing:');
      expectedEvents.forEach(title => {
        if (!foundTitles.includes(title)) {
          console.log(`   ❌ Missing: ${title}`);
        }
      });
    }

  } catch (error) {
    console.error('💥 Error verifying events:', error);
    throw error;
  }
}

// Run verification if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  verifyEvents()
    .then(() => {
      console.log('\n✨ Verification completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Verification failed:', error);
      process.exit(1);
    });
}

export { verifyEvents };