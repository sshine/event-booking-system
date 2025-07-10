import { database } from '../models/database';

interface SampleEvent {
  title: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  capacity: number;
  price: number;
  image_url?: string;
  created_by: number;
}

const sampleEvents: SampleEvent[] = [
  {
    title: "Crochet Workshop for Beginners",
    description: "Learn the basics of crochet in this hands-on workshop. We'll cover fundamental stitches, reading patterns, and you'll create your first project to take home. All materials provided.",
    date: "2025-07-20",
    start_time: "14:00",
    end_time: "16:30",
    location: "Arts & Crafts Studio, Room 201",
    capacity: 12,
    price: 35.00,
    image_url: "/dummy-event-thumbnail.jpg",
    created_by: 1
  },
  {
    title: "Make Your Own Necklace",
    description: "Design and create a unique beaded necklace in this creative jewelry-making workshop. Choose from a variety of beads, charms, and materials to craft something truly personal.",
    date: "2025-07-18",
    start_time: "10:00",
    end_time: "12:00",
    location: "Jewelry Workshop, Ground Floor",
    capacity: 8,
    price: 42.50,
    image_url: "/dummy-event-thumbnail.jpg",
    created_by: 1
  },
  {
    title: "People's Kitchen: Community Cooking",
    description: "Join our community kitchen event where we cook together, share recipes, and enjoy a communal meal. This week we're making international dishes from around the world. All skill levels welcome!",
    date: "2025-07-22",
    start_time: "17:00",
    end_time: "20:00",
    location: "Community Kitchen, Building B",
    capacity: 20,
    price: 15.00,
    image_url: "/dummy-event-thumbnail.jpg",
    created_by: 1
  },
  {
    title: "Evening Jazz Concert",
    description: "Experience an intimate jazz concert featuring local musicians performing classics and original compositions. Enjoy sophisticated melodies in a cozy venue with optional refreshments.",
    date: "2025-07-25",
    start_time: "19:30",
    end_time: "21:30",
    location: "The Blue Note Lounge",
    capacity: 45,
    price: 28.00,
    image_url: "/dummy-event-thumbnail.jpg",
    created_by: 1
  },
  {
    title: "Traditional Tea Ceremony Experience",
    description: "Immerse yourself in the ancient art of tea ceremony. Learn about tea traditions, proper preparation techniques, and mindful appreciation. Includes tasting of premium teas from different regions.",
    date: "2025-07-16",
    start_time: "15:00",
    end_time: "17:00",
    location: "Zen Garden Pavilion",
    capacity: 10,
    price: 38.00,
    image_url: "/dummy-event-thumbnail.jpg",
    created_by: 1
  }
];

async function seedEvents(): Promise<void> {
  console.log('🌱 Starting to seed sample events...');

  const db = database.getDb();

  // First, check if events already exist to avoid duplicate
  const checkExisting = new Promise<number>((resolve, reject) => {
    db.get('SELECT COUNT(*) as count FROM events', (err, row: any) => {
      if (err) reject(err);
      else resolve(row.count);
    });
  });

  try {
    const existingCount = await checkExisting;

    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing events. Skipping seeding to avoid duplicates.`);
      console.log('💡 If you want to re-seed, delete existing events first.');
      return;
    }

    console.log('📅 Adding sample events to database...');

    // Insert each event
    const insertPromises = sampleEvents.map((event) => {
      return new Promise<void>((resolve, reject) => {
        const query = `
          INSERT INTO events (title, description, date, start_time, end_time, location, capacity, price, image_url, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.run(query, [
          event.title,
          event.description,
          event.date,
          event.start_time,
          event.end_time,
          event.location,
          event.capacity,
          event.price,
          event.image_url,
          event.created_by
        ], function(err) {
          if (err) {
            console.error(`❌ Error inserting event "${event.title}":`, err);
            reject(err);
          } else {
            console.log(`✅ Added event: "${event.title}" (ID: ${this.lastID})`);
            resolve();
          }
        });
      });
    });

    await Promise.all(insertPromises);

    console.log(`🎉 Successfully seeded ${sampleEvents.length} sample events!`);
    console.log('\n📋 Event Summary:');
    sampleEvents.forEach((event, i) => {
      console.log(`  ${i + 1}. ${event.title} - ${event.date} at ${event.start_time}`);
    });

  } catch (error) {
    console.error('💥 Error seeding events:', error);
    throw error;
  }
}

// Run the seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedEvents()
    .then(() => {
      console.log('\n✨ Seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Seeding failed:', error);
      process.exit(1);
    });
}

export { seedEvents };