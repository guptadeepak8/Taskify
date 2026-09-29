import { Kysely, sql } from 'kysely';

export const SEED_TASKS = [
  // Home Maintenance & Repairs
  {
    name: 'Electrician & Wiring Repair',
    category: 'Home Maintenance & Repairs',
    description: 'Fix short circuits, replace switchboards, install ceiling fans, and repair electrical appliances.',
  },
  {
    name: 'Plumbing & Leakage Fix',
    category: 'Home Maintenance & Repairs',
    description: 'Fix leaking pipes, repair taps, unclog blocked drains, and install sanitary fittings.',
  },
  {
    name: 'Carpentry & Furniture Assembly',
    category: 'Home Maintenance & Repairs',
    description: 'Assemble beds, repair wooden doors, fix hinges, and build custom modular shelving.',
  },
  {
    name: 'AC Repair & Jet Servicing',
    category: 'Home Maintenance & Repairs',
    description: 'Deep foam jet cleaning, gas charging, filter wash, and cooling troubleshooting.',
  },
  {
    name: 'Home Painting & Touchup',
    category: 'Home Maintenance & Repairs',
    description: 'Interior and exterior wall painting, waterproof primer application, and texture design.',
  },
  {
    name: 'Appliance Repair (Washing Machine & Fridge)',
    category: 'Home Maintenance & Repairs',
    description: 'Diagnostics and repairs for refrigerators, front/top load washing machines, and microwaves.',
  },

  // Cleaning & Housekeeping
  {
    name: 'Full Home Deep Cleaning',
    category: 'Cleaning & Housekeeping',
    description: 'Intensive floor scrubbing, window cleaning, ceiling dusting, and sanitization of all rooms.',
  },
  {
    name: 'Kitchen Deep Cleaning',
    category: 'Cleaning & Housekeeping',
    description: 'Degreasing exhaust fans, wiping oil stains from tiles, countertop cleaning, and cabinet wipe-down.',
  },
  {
    name: 'Bathroom Sanitization & Descaling',
    category: 'Cleaning & Housekeeping',
    description: 'Hard water stain removal from tiles, toilet descaling, tap polishing, and germ sanitization.',
  },
  {
    name: 'Sofa, Carpet & Mattress Shampooing',
    category: 'Cleaning & Housekeeping',
    description: 'Wet vacuum extraction, fabric stain removal, and dust-mite allergen elimination.',
  },
  {
    name: 'Eco-friendly Pest Control',
    category: 'Cleaning & Housekeeping',
    description: 'Cockroach gel treatment, termite spray, and odorless mosquito/bedbug eradication.',
  },
  {
    name: 'Balcony & Window Mesh Cleaning',
    category: 'Cleaning & Housekeeping',
    description: 'High-pressure wash for balcony floors, grill dusting, and pigeon net maintenance.',
  },

  // Delivery & Errand Services
  {
    name: 'Grocery & Supermarket Pickup',
    category: 'Delivery & Errand Services',
    description: 'Fast purchase and doorstep delivery of fresh vegetables, daily essentials, and staples.',
  },
  {
    name: 'Urgent Pharmacy & Medicine Delivery',
    category: 'Delivery & Errand Services',
    description: 'Prescription pickup from local chemists and timely delivery of urgent medical supplies.',
  },
  {
    name: 'Document & Package Courier',
    category: 'Delivery & Errand Services',
    description: 'Pickup and drop of official documents, contracts, cheques, and parcel dispatches.',
  },
  {
    name: 'Laundry Pickup & Steam Pressing',
    category: 'Delivery & Errand Services',
    description: 'Collection of clothes for wash-and-fold, dry cleaning, and wrinkle-free steam ironing.',
  },
  {
    name: 'Neighborhood Errand Runner',
    category: 'Delivery & Errand Services',
    description: 'Bill payments, bank deposits, tailoring drop-offs, and custom local errand handling.',
  },
  {
    name: 'Hardware & Tool Rental Delivery',
    category: 'Delivery & Errand Services',
    description: 'Delivery of drilling machines, ladders, and DIY home repair tools for daily rental.',
  },

  // Personal & Care Services
  {
    name: 'Elderly Care & Companion Assistance',
    category: 'Personal & Care Services',
    description: 'Assisting senior citizens with mobility, hospital visits, medicine reminders, and walks.',
  },
  {
    name: 'Pet Walking & Day Sitting',
    category: 'Personal & Care Services',
    description: 'Daily dog walking, feeding, grooming assistance, and attentive home pet sitting.',
  },
  {
    name: 'Home Cook & Meal Preparation',
    category: 'Personal & Care Services',
    description: 'Hygienic preparation of healthy home-style breakfast, lunch, and dinner.',
  },
  {
    name: 'Babysitting & Child Supervision',
    category: 'Personal & Care Services',
    description: 'Responsible child care, engaging playtime supervision, and feeding assistance.',
  },
  {
    name: 'Home Nursing & Dressing Service',
    category: 'Personal & Care Services',
    description: 'Post-surgery wound dressing, BP & sugar monitoring, and injection administration by trained nurses.',
  },
  {
    name: 'At-Home Yoga & Fitness Training',
    category: 'Personal & Care Services',
    description: 'Personalized yoga instruction, posture correction, and tailored home workout sessions.',
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
