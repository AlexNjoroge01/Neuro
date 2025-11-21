-- Seed superuser account
-- This migration creates or updates the superuser account for system administration

-- Insert or update superuser
INSERT INTO "User" (id, email, "passwordHash", name, role, "emailVerified", image, phone, address, "shippingInfo")
VALUES (
  'superuser-seed-001',
  'alexnjoroge102@gmail.com',
  '$2a$10$Y7NHyaPGWuKs2AoiF9p5mOx70lawPoR4DmBbsLMKNpKVZzJstK3Ei',
  'Alex Njoroge',
  'SUPERUSER',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL
)
ON CONFLICT (email) 
DO UPDATE SET
  "passwordHash" = EXCLUDED."passwordHash",
  name = EXCLUDED.name,
  role = 'SUPERUSER';