# Superuser Seeding - Documentation

This document explains the three flexible methods for creating/seeding the superuser account in the system.

## Superuser Credentials

- **Email**: `alexnjoroge102@gmail.com`
- **Password**: `Password@123`
- **Name**: Alex Njoroge
- **Role**: SUPERUSER

## Method 1: Manual NPM Script (Recommended for Development)

Use this method when you want to manually create or update the superuser account.

```bash
npm run create-superuser
```

**When to use:**
- During development when you need to quickly create/reset the superuser
- When you want explicit control over when the superuser is created
- For testing purposes

**What it does:**
- Runs the script at `scripts/createSuperuser.ts`
- Creates a new superuser if one doesn't exist
- Updates the existing superuser if the email already exists

---

## Method 2: Prisma Seed Command (Recommended for Database Reset)

Use this method when you want to seed the database with initial data, including the superuser.

```bash
# Run seed manually
npm run db:seed

# Or use Prisma's built-in seed command
npx prisma db seed
```

**When to use:**
- After running `npx prisma migrate reset` (automatically runs seed)
- When setting up a fresh database
- When you want to seed multiple entities at once (can be extended)

**What it does:**
- Runs the seed file at `prisma/seed.ts`
- Creates or updates the superuser account
- Can be extended to seed other initial data (products, categories, etc.)

**Auto-execution:**
The seed automatically runs after:
- `npx prisma migrate reset`
- `npx prisma migrate dev` (if database is reset)

---

## Method 3: Migration Seed (Automatic on Database Setup)

This method automatically seeds the superuser when migrations are applied.

```bash
# Apply all pending migrations (including seed)
npx prisma migrate deploy

# Or during development
npx prisma migrate dev
```

**When to use:**
- In production deployments
- When setting up a new environment (staging, production)
- For CI/CD pipelines
- When you want the superuser to be created automatically

**What it does:**
- The migration at `prisma/migrations/20251121051811_seed_superuser/migration.sql` contains SQL to insert/update the superuser
- Runs automatically when migrations are applied
- Uses `ON CONFLICT` to update existing superuser if email already exists

---

## Comparison Table

| Method | Command | Auto-runs | Use Case | Flexibility |
|--------|---------|-----------|----------|-------------|
| **NPM Script** | `npm run create-superuser` | ❌ No | Development, manual control | ⭐⭐⭐ High |
| **Prisma Seed** | `npm run db:seed` or `npx prisma db seed` | ✅ After `migrate reset` | Database reset, initial setup | ⭐⭐ Medium |
| **Migration** | `npx prisma migrate deploy` | ✅ With migrations | Production, CI/CD | ⭐ Low |

---

## Extending the Seed

To add more seed data (e.g., default products, categories), edit `prisma/seed.ts`:

```typescript
async function main() {
  console.log('🌱 Starting database seeding...');

  // Seed superuser (existing code)
  // ...

  // Add more seed data here
  console.log('🌱 Seeding products...');
  await prisma.product.createMany({
    data: [
      { name: 'Product 1', price: 100, stock: 10, unit: 'pcs' },
      { name: 'Product 2', price: 200, stock: 20, unit: 'pcs' },
    ],
    skipDuplicates: true,
  });

  console.log('🎉 Database seeding completed!');
}
```

---

## Troubleshooting

### Superuser already exists but password doesn't work

Run any of the three methods to update the password:
```bash
npm run create-superuser
```

### Seed fails with "unique constraint violation"

This is normal if the superuser already exists. The scripts handle this by updating the existing user.

### Migration seed doesn't run

Make sure you're using `npx prisma migrate deploy` or `npx prisma migrate dev`, not just `npx prisma migrate`.

---

## Security Notes

> [!WARNING]
> The superuser password is hardcoded in the seed files. For production:
> 1. Change the password immediately after first login
> 2. Consider using environment variables for the initial password
> 3. Never commit production credentials to version control

> [!TIP]
> After deploying to production, log in as the superuser and change the password through the account settings page.
