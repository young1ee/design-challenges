-- Correct Oskar's join date: he wasn't in the company yet for the smartwatch challenge
UPDATE designers SET joined_at = '2025-08-15' WHERE slug = 'oskar';
