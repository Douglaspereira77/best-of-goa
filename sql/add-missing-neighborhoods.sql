-- Add Missing Neighborhoods to Reference Table
-- This script adds neighborhoods for areas that don't map to existing ones

INSERT INTO restaurant_neighborhoods (name, slug, name_ar, description, display_order) VALUES
-- Sub-areas of Goa City
('Murouj', 'murouj', 'Ù…Ø±ÙˆØ¬', 'Murouj area in Goa City', 8),
('Sabah Al Salem', 'sabah-al-salem', 'ØµØ¨Ø§Ø­ Ø§Ù„Ø³Ø§Ù„Ù…', 'Sabah Al Salem area in Goa City', 9),
('Mirqab', 'mirqab', 'Ù…Ø±Ù‚Ø§Ø¨', 'Mirqab area in Goa City', 10),
('Bnied Al-Gar', 'bnied-al-gar', 'Ø¨Ù†ÙŠØ¯ Ø§Ù„Ù‚Ø§Ø±', 'Bnied Al-Gar area in Goa City', 11),
('Messila', 'messila', 'Ø§Ù„Ù…Ø³ÙŠÙ„Ø©', 'Messila area in Goa City', 12),
('Omar Ben Al Khatta', 'omar-ben-al-khatta', 'Ø¹Ù…Ø± Ø¨Ù† Ø§Ù„Ø®Ø·Ø§Ø¨', 'Omar Ben Al Khatta area in Goa City', 13),
('Shuwaikh', 'shuwaikh', 'Ø§Ù„Ø´ÙˆÙŠØ®', 'Shuwaikh area in Goa City', 14),
('Shuwaikh Residential', 'shuwaikh-residential', 'Ø§Ù„Ø´ÙˆÙŠØ® Ø§Ù„Ø³ÙƒÙ†ÙŠØ©', 'Shuwaikh Residential area in Goa City', 15),

-- Additional areas that need their own neighborhoods
('Abdulla Mubarak', 'abdulla-mubarak', 'Ø¹Ø¨Ø¯Ø§Ù„Ù„Ù‡ Ù…Ø¨Ø§Ø±Ùƒ', 'Abdulla Mubarak area in Goa City', 16),
('Middle Area', 'middle-area', 'Ø§Ù„Ù…Ù†Ø·Ù‚Ø© Ø§Ù„ÙˆØ³Ø·Ù‰', 'Middle Area in Goa City', 17),
('Mubarak Al-Abdullah', 'mubarak-al-abdullah', 'Ù…Ø¨Ø§Ø±Ùƒ Ø§Ù„Ø¹Ø¨Ø¯Ø§Ù„Ù„Ù‡', 'Mubarak Al-Abdullah area in Goa City', 18),
('Rai', 'rai', 'Ø§Ù„Ø±Ø§ÙŠ', 'Rai area in Goa City', 19),
('Sabhan', 'sabhan', 'ØµØ¨Ø§Ø­Ø§Ù†', 'Sabhan area in Goa City', 20),
('Salwa', 'salwa', 'Ø³Ù„ÙˆÙ‰', 'Salwa area in Goa City', 21),
('Sharq', 'sharq', 'Ø§Ù„Ø´Ø±Ù‚', 'Sharq area in Goa City', 22),
('South Sabahiya', 'south-sabahiya', 'Ø¬Ù†ÙˆØ¨ Ø§Ù„ØµØ¨Ø§Ø­ÙŠØ©', 'South Sabahiya area in Ahmadi', 23),

-- Additional neighborhoods for better coverage
('Jabriya', 'jabriya', 'Ø§Ù„Ø¬Ø§Ø¨Ø±ÙŠØ©', 'Jabriya residential area', 24),
('Qadsiya', 'qadsiya', 'Ø§Ù„Ù‚Ø¯Ø³ÙŠØ©', 'Qadsiya residential area', 25),
('Surra', 'surra', 'Ø§Ù„Ø³Ø±Ø©', 'Surra residential area', 26),
('Rumaithiya', 'rumaithiya', 'Ø§Ù„Ø±Ù…ÙŠØ«ÙŠØ©', 'Rumaithiya residential area', 27),
('Dasma', 'dasma', 'Ø§Ù„Ø¯Ø³Ù…Ø©', 'Dasma residential area', 28),
('Bayan', 'bayan', 'Ø¨ÙŠØ§Ù†', 'Bayan residential area', 29),
('Mishref', 'mishref', 'Ù…Ø´Ø±Ù', 'Mishref residential area', 30),
('Fintas', 'fintas', 'ÙÙ†Ø·Ø§Ø³', 'Fintas area in Ahmadi', 31),
('Mahboula', 'mahboula', 'Ø§Ù„Ù…Ù‡Ø¨ÙˆÙ„Ø©', 'Mahboula area in Ahmadi', 32),
('Abu Halifa', 'abu-halifa', 'Ø£Ø¨Ùˆ Ø­Ù„ÙŠÙØ©', 'Abu Halifa area in Ahmadi', 33)

ON CONFLICT (slug) DO NOTHING;

-- Update display order for existing neighborhoods
UPDATE restaurant_neighborhoods SET display_order = 1 WHERE slug = 'goa-city';
UPDATE restaurant_neighborhoods SET display_order = 2 WHERE slug = 'salmiya';
UPDATE restaurant_neighborhoods SET display_order = 3 WHERE slug = 'hawally';
UPDATE restaurant_neighborhoods SET display_order = 4 WHERE slug = 'jahra';
UPDATE restaurant_neighborhoods SET display_order = 5 WHERE slug = 'ahmadi';
UPDATE restaurant_neighborhoods SET display_order = 6 WHERE slug = 'farwaniya';
UPDATE restaurant_neighborhoods SET display_order = 7 WHERE slug = 'mubarak-al-kabeer';

-- Verify the insertions
SELECT 
  id,
  name,
  slug,
  display_order
FROM restaurant_neighborhoods 
ORDER BY display_order;

