import { Kysely, sql } from 'kysely';

export const SEED_TASKS = [
  // 1. Home Services (AC, plumbing, electrical, cleaning, repairs)
  {
    name: 'Electrician & Wiring Repair',
    category: 'Home Services',
    description: 'Fix short circuits, replace switchboards, install ceiling fans, and repair electrical appliances.',
  },
  {
    name: 'Plumbing & Leakage Fix',
    category: 'Home Services',
    description: 'Fix leaking pipes, repair taps, unclog blocked drains, and install sanitary fittings.',
  },
  {
    name: 'Carpentry & Furniture Assembly',
    category: 'Home Services',
    description: 'Assemble beds, repair wooden doors, fix hinges, and build custom modular shelving.',
  },
  {
    name: 'AC Repair & Jet Servicing',
    category: 'Home Services',
    description: 'Deep foam jet cleaning, gas charging, filter wash, and cooling troubleshooting.',
  },
  {
    name: 'Home Painting & Touchup',
    category: 'Home Services',
    description: 'Interior and exterior wall painting, waterproof primer application, and texture design.',
  },
  {
    name: 'Full Home Deep Cleaning',
    category: 'Home Services',
    description: 'Intensive floor scrubbing, window cleaning, ceiling dusting, and sanitization of all rooms.',
  },

  // 2. Errands & Daily Tasks (Bills, banks, documents, government work)
  {
    name: 'Bills & Government Renewals',
    category: 'Errands & Daily Tasks',
    description: 'Offline utility bill payments, municipal tax submissions, challan clearance, and document renewals.',
  },
  {
    name: 'Urgent Pharmacy & Medicine Delivery',
    category: 'Errands & Daily Tasks',
    description: 'Prescription pickup from local chemists and timely doorstep delivery of urgent medicines.',
  },
  {
    name: 'Document & Package Courier',
    category: 'Errands & Daily Tasks',
    description: 'Pickup and drop of contracts, cheques, legal papers, and local parcel dispatches.',
  },
  {
    name: 'Grocery & Supermarket Pickup',
    category: 'Errands & Daily Tasks',
    description: 'Fast purchase and doorstep delivery of fresh vegetables, daily essentials, and staples.',
  },
  {
    name: 'Laundry Pickup & Steam Pressing',
    category: 'Errands & Daily Tasks',
    description: 'Collection of garments for wash-and-fold, dry cleaning, and wrinkle-free steam ironing.',
  },
  {
    name: 'Neighborhood Errand Runner',
    category: 'Errands & Daily Tasks',
    description: 'Bank deposits, tailor drop-offs, parcel collection, and personalized neighborhood errands.',
  },

  // 3. Health & Medical (Doctor visits, pharmacy, labs, physio)
  {
    name: 'Doctor Appointment Coordination',
    category: 'Health & Medical',
    description: 'Scheduling OPD consultations with top specialists and accompanying patients to clinic visits.',
  },
  {
    name: 'Diagnostic Lab Test at Home',
    category: 'Health & Medical',
    description: 'Arranging home blood sample collection and collecting printed diagnostic lab reports.',
  },
  {
    name: 'Elderly Health Companion',
    category: 'Health & Medical',
    description: 'Assisting senior citizens with hospital visits, mobility, medicine schedules, and check-ups.',
  },
  {
    name: 'Hospital Admission Logistics',
    category: 'Health & Medical',
    description: 'TPA insurance desk coordination, admission form paperwork, and patient room assistance.',
  },
  {
    name: 'Home Nursing & Dressing Service',
    category: 'Health & Medical',
    description: 'Post-operative wound dressing, vital signs monitoring, and injection administration by licensed nurses.',
  },
  {
    name: 'Physiotherapy & Rehabilitation',
    category: 'Health & Medical',
    description: 'At-home physical therapy sessions for mobility improvement, joint pain, and post-surgery rehab.',
  },

  // 4. Travel & Tourism (Flights, hotels, visas, transfers, itineraries)
  {
    name: 'Flight & Train Booking Assistance',
    category: 'Travel & Tourism',
    description: 'Finding optimal routes, booking domestic or international tickets, and seat reservation management.',
  },
  {
    name: 'Visa Documentation & Guidance',
    category: 'Travel & Tourism',
    description: 'Checklist preparation, consulate appointment scheduling, and visa application submission support.',
  },
  {
    name: 'Airport Transfer Coordination',
    category: 'Travel & Tourism',
    description: 'Arranging punctual, sanitized airport pickup and drop-off cabs for stress-free travel.',
  },
  {
    name: 'Hotel & Homestay Reservations',
    category: 'Travel & Tourism',
    description: 'Selecting verified luxury stays or budget boutique hotels and securing corporate deals.',
  },
  {
    name: 'Custom Travel Itinerary Planning',
    category: 'Travel & Tourism',
    description: 'Curating personalized day-by-day travel schedules, attraction tickets, and dining recommendations.',
  },
  {
    name: 'Local Sightseeing & Heritage Tours',
    category: 'Travel & Tourism',
    description: 'Booking certified city tour guides, heritage walking tours, and cultural experiences.',
  },
];

export async function up(db: Kysely<any>): Promise<void> {
  // 1. Create tasks table
  await db.schema
    .createTable('tasks')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('category', 'varchar(100)', (col) => col.notNull())
    .addColumn('description', 'text', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createIndex('tasks_category_idx')
    .on('tasks')
    .column('category')
    .execute();

  // 2. Create user_tasks table
  await db.schema
    .createTable('user_tasks')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('user_id', 'uuid', (col) =>
      col.references('users.id').onDelete('cascade').notNull()
    )
    .addColumn('task_id', 'uuid', (col) =>
      col.references('tasks.id').onDelete('cascade').notNull()
    )
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addUniqueConstraint('user_tasks_user_id_task_id_unique', ['user_id', 'task_id'])
    .execute();

  await db.schema
    .createIndex('user_tasks_user_id_idx')
    .on('user_tasks')
    .column('user_id')
    .execute();

  // 3. Seed the 24 tasks across 4 categories
  for (const task of SEED_TASKS) {
    await db.insertInto('tasks').values(task).execute();
  }
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('user_tasks').execute();
  await db.schema.dropTable('tasks').execute();
}
