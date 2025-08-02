# Database Migrations with Drizzle

This project uses Drizzle ORM for database management and migrations. Here's how to work with migrations:

## Migration Structure

Migrations are stored in the `/migrations` directory:
```
migrations/
├── 0000_regular_lightspeed.ts    # Initial schema
├── 0001_search_analytics.ts      # Search analytics
├── 0002_search_indexes.ts        # Search optimization indexes
└── meta/                         # Migration metadata
    ├── _journal.json            # Migration history
    └── 0000_snapshot.json       # Schema snapshot
```

## Creating Migrations

1. **Modify Schema**
   Update your schema in `shared/schema.ts`:
   ```typescript
   import { pgTable, serial, text } from 'drizzle-orm/pg-core';

   export const myTable = pgTable('my_table', {
     id: serial('id').primaryKey(),
     name: text('name').notNull()
   });
   ```

2. **Generate Migration**
   ```bash
   npm run drizzle-kit generate
   ```
   This creates a new migration file with `up` and `down` methods.

3. **Review Migration**
   Check the generated migration file and make any necessary adjustments.

## Running Migrations

1. **Apply Migrations**
   ```bash
   npm run migrate
   ```
   This runs all pending migrations in order.

2. **Rollback Migration**
   ```bash
   npm run migrate:down
   ```
   This reverts the most recent migration.

## Best Practices

1. **Schema First**
   - Define schema in TypeScript
   - Use Drizzle's type-safe builders
   - Keep schema in `shared/` for type sharing

2. **Migration Safety**
   - Always include both `up` and `down` migrations
   - Test migrations in development first
   - Back up production database before migrating

3. **Performance**
   - Add appropriate indexes
   - Consider large table implications
   - Use transactions where needed

4. **Type Safety**
   - Use Drizzle's TypeScript features
   - Define proper relations
   - Leverage type inference

## Example Migration

```typescript
import { sql } from 'drizzle-orm';
import { pgTable, serial, text } from 'drizzle-orm/pg-core';

export const myTable = pgTable('my_table', {
  id: serial('id').primaryKey(),
  name: text('name').notNull()
});

export async function up(db: any) {
  await db.schema.createTable(myTable);
  await db.execute(
    sql`CREATE INDEX idx_my_table_name ON my_table (name)`
  );
}

export async function down(db: any) {
  await db.execute(
    sql`DROP INDEX idx_my_table_name`
  );
  await db.schema.dropTable(myTable);
}
```

## Troubleshooting

1. **Migration Failed**
   ```bash
   # Check migration status
   npm run drizzle-kit status

   # Fix and retry
   npm run migrate
   ```

2. **Schema Conflicts**
   - Review schema in `shared/schema.ts`
   - Check migration order in meta journal
   - Resolve conflicts and regenerate

3. **Type Errors**
   - Ensure schema types are exported
   - Check relation definitions
   - Update type imports
