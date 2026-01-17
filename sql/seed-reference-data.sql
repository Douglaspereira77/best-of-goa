-- ============================================================================
-- Best of Goa - Reference Data Seeding Script
-- Purpose: Seed all reference tables with comprehensive data for Omar's pattern
-- Date: 2025-01-27
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. CUISINES (20+ entries)
-- ============================================================================

INSERT INTO restaurants_cuisines (name, slug, name_ar, description, icon, display_order) VALUES
('Japanese', 'japanese', 'ÙŠØ§Ø¨Ø§Ù†ÙŠ', 'Traditional Japanese cuisine including sushi, ramen, and teppanyaki', 'ðŸ£', 1),
('Italian', 'italian', 'Ø¥ÙŠØ·Ø§Ù„ÙŠ', 'Classic Italian dishes including pasta, pizza, and risotto', 'ðŸ', 2),
('Middle Eastern', 'middle-eastern', 'Ø´Ø±Ù‚ Ø£ÙˆØ³Ø·ÙŠ', 'Traditional Middle Eastern cuisine including mezze, grilled meats, and rice dishes', 'ðŸ¥™', 3),
('Indian', 'indian', 'Ù‡Ù†Ø¯ÙŠ', 'Authentic Indian cuisine with rich spices and diverse regional dishes', 'ðŸ›', 4),
('Chinese', 'chinese', 'ØµÙŠÙ†ÙŠ', 'Traditional Chinese cuisine including dim sum, stir-fries, and noodle dishes', 'ðŸ¥¢', 5),
('French', 'french', 'ÙØ±Ù†Ø³ÙŠ', 'Classic French cuisine known for its techniques and refined flavors', 'ðŸ¥', 6),
('Thai', 'thai', 'ØªØ§ÙŠÙ„Ù†Ø¯ÙŠ', 'Spicy and aromatic Thai cuisine with bold flavors and fresh ingredients', 'ðŸŒ¶ï¸', 7),
('Mexican', 'mexican', 'Ù…ÙƒØ³ÙŠÙƒÙŠ', 'Vibrant Mexican cuisine with tacos, burritos, and authentic flavors', 'ðŸŒ®', 8),
('Lebanese', 'lebanese', 'Ù„Ø¨Ù†Ø§Ù†ÙŠ', 'Traditional Lebanese cuisine including mezze, grilled meats, and fresh salads', 'ðŸ¥—', 9),
('American', 'american', 'Ø£Ù…Ø±ÙŠÙƒÙŠ', 'Classic American comfort food including burgers, steaks, and BBQ', 'ðŸ”', 10),
('Korean', 'korean', 'ÙƒÙˆØ±ÙŠ', 'Korean cuisine featuring kimchi, BBQ, and traditional fermented dishes', 'ðŸ¥˜', 11),
('Turkish', 'turkish', 'ØªØ±ÙƒÙŠ', 'Turkish cuisine with kebabs, mezze, and traditional Anatolian dishes', 'ðŸ¥©', 12),
('Mediterranean', 'mediterranean', 'Ù…ØªÙˆØ³Ø·ÙŠ', 'Fresh Mediterranean cuisine with olive oil, seafood, and vegetables', 'ðŸ«’', 13),
('Seafood', 'seafood', 'Ù…Ø£ÙƒÙˆÙ„Ø§Øª Ø¨Ø­Ø±ÙŠØ©', 'Fresh seafood dishes from around the world', 'ðŸŸ', 14),
('Steakhouse', 'steakhouse', 'Ù…Ø·Ø¹Ù… Ù„Ø­ÙˆÙ…', 'Premium steakhouses specializing in high-quality cuts of meat', 'ðŸ¥©', 15),
('BBQ', 'bbq', 'Ø´ÙˆØ§Ø¡', 'Barbecue and grilled meats with smoky flavors', 'ðŸ”¥', 16),
('Vegetarian', 'vegetarian', 'Ù†Ø¨Ø§ØªÙŠ', 'Plant-based cuisine without meat or fish', 'ðŸ¥¬', 17),
('Vegan', 'vegan', 'Ù†Ø¨Ø§ØªÙŠ ØµØ±Ù', 'Plant-based cuisine without any animal products', 'ðŸŒ±', 18),
('Fast Food', 'fast-food', 'ÙˆØ¬Ø¨Ø§Øª Ø³Ø±ÙŠØ¹Ø©', 'Quick service restaurants with burgers, fries, and convenience foods', 'ðŸŸ', 19),
('Cafe', 'cafe', 'Ù…Ù‚Ù‡Ù‰', 'Coffee shops and casual cafes with light meals and beverages', 'â˜•', 20),
('Goai', 'goai', 'ÙƒÙˆÙŠØªÙŠ', 'Traditional Goai cuisine including machboos, harees, and local specialties', 'ðŸ‡°ðŸ‡¼', 21),
('Persian', 'persian', 'ÙØ§Ø±Ø³ÙŠ', 'Traditional Persian cuisine with rice dishes, kebabs, and stews', 'ðŸš', 22),
('Pakistani', 'pakistani', 'Ø¨Ø§ÙƒØ³ØªØ§Ù†ÙŠ', 'Authentic Pakistani cuisine with rich curries and traditional dishes', 'ðŸ²', 23),
('Filipino', 'filipino', 'ÙÙ„Ø¨ÙŠÙ†ÙŠ', 'Filipino cuisine with adobo, sinigang, and traditional comfort foods', 'ðŸœ', 24),
('Egyptian', 'egyptian', 'Ù…ØµØ±ÙŠ', 'Traditional Egyptian cuisine including koshari, ful, and local specialties', 'ðŸ¥˜', 25)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- 2. CATEGORIES (10+ entries)
-- ============================================================================

INSERT INTO restaurants_categories (name, slug, name_ar, description, display_order) VALUES
('Fine Dining', 'fine-dining', 'Ù…Ø·Ø¹Ù… Ø±Ø§Ù‚ÙŠ', 'Upscale restaurants with premium service and gourmet cuisine', 1),
('Casual Dining', 'casual-dining', 'Ù…Ø·Ø¹Ù… Ø¹Ø§Ø¯ÙŠ', 'Relaxed restaurants with good food and comfortable atmosphere', 2),
('Fast Food', 'fast-food', 'ÙˆØ¬Ø¨Ø§Øª Ø³Ø±ÙŠØ¹Ø©', 'Quick service restaurants with fast preparation and casual service', 3),
('Quick Service', 'quick-service', 'Ø®Ø¯Ù…Ø© Ø³Ø±ÙŠØ¹Ø©', 'Fast-casual restaurants with quick preparation and counter service', 4),
('Food Court', 'food-court', 'Ø³Ø§Ø­Ø© Ø·Ø¹Ø§Ù…', 'Mall food courts with multiple food vendors and casual seating', 5),
('Cafe', 'cafe', 'Ù…Ù‚Ù‡Ù‰', 'Coffee shops and casual cafes with light meals and beverages', 6),
('Dessert Shop', 'dessert-shop', 'Ù…Ø­Ù„ Ø­Ù„ÙˆÙŠØ§Øª', 'Specialty shops focusing on desserts, ice cream, and sweet treats', 7),
('Bakery', 'bakery', 'Ù…Ø®Ø¨Ø²', 'Fresh bread, pastries, and baked goods', 8),
('Street Food', 'street-food', 'Ø·Ø¹Ø§Ù… Ø§Ù„Ø´Ø§Ø±Ø¹', 'Traditional street food vendors and food trucks', 9),
('Food Truck', 'food-truck', 'Ø´Ø§Ø­Ù†Ø© Ø·Ø¹Ø§Ù…', 'Mobile food vendors serving from trucks or carts', 10),
('Buffet', 'buffet', 'Ø¨ÙˆÙÙŠÙ‡', 'All-you-can-eat restaurants with self-service stations', 11),
('Family Restaurant', 'family-restaurant', 'Ù…Ø·Ø¹Ù… Ø¹Ø§Ø¦Ù„ÙŠ', 'Family-friendly restaurants with kid-friendly menus and atmosphere', 12)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- 3. FEATURES (20+ entries)
-- ============================================================================

INSERT INTO restaurants_features (name, slug, name_ar, category, icon, display_order) VALUES
-- Amenities
('WiFi', 'wifi', 'ÙˆØ§ÙŠ ÙØ§ÙŠ', 'amenity', 'ðŸ“¶', 1),
('Parking', 'parking', 'Ù…ÙˆÙ‚Ù Ø³ÙŠØ§Ø±Ø§Øª', 'amenity', 'ðŸ…¿ï¸', 2),
('Outdoor Seating', 'outdoor-seating', 'Ù…Ù‚Ø§Ø¹Ø¯ Ø®Ø§Ø±Ø¬ÙŠØ©', 'amenity', 'ðŸª‘', 3),
('Private Dining', 'private-dining', 'Ù‚Ø§Ø¹Ø© Ø®Ø§ØµØ©', 'amenity', 'ðŸ ', 4),
('Air Conditioned', 'air-conditioned', 'Ù…ÙƒÙŠÙ', 'amenity', 'â„ï¸', 5),
('Live Music', 'live-music', 'Ù…ÙˆØ³ÙŠÙ‚Ù‰ Ø­ÙŠØ©', 'amenity', 'ðŸŽµ', 6),
('Pet Friendly', 'pet-friendly', 'ØµØ¯ÙŠÙ‚ Ù„Ù„Ø­ÙŠÙˆØ§Ù†Ø§Øª', 'amenity', 'ðŸ•', 7),
('Kids Play Area', 'kids-play-area', 'Ù…Ù†Ø·Ù‚Ø© Ø£Ø·ÙØ§Ù„', 'amenity', 'ðŸŽ ', 8),

-- Dietary
('Vegan Options', 'vegan-options', 'Ø®ÙŠØ§Ø±Ø§Øª Ù†Ø¨Ø§ØªÙŠØ©', 'dietary', 'ðŸŒ±', 9),
('Gluten-Free', 'gluten-free', 'Ø®Ø§Ù„ÙŠ Ù…Ù† Ø§Ù„Ø¬Ù„ÙˆØªÙŠÙ†', 'dietary', 'ðŸŒ¾', 10),
('Halal Certified', 'halal-certified', 'Ø­Ù„Ø§Ù„ Ù…Ø¹ØªÙ…Ø¯', 'dietary', 'ðŸ•Œ', 11),
('Vegetarian Options', 'vegetarian-options', 'Ø®ÙŠØ§Ø±Ø§Øª Ù†Ø¨Ø§ØªÙŠØ©', 'dietary', 'ðŸ¥¬', 12),

-- Service
('Delivery', 'delivery', 'ØªÙˆØµÙŠÙ„', 'service', 'ðŸšš', 13),
('Takeout', 'takeout', 'Ø·Ù„Ø¨ Ø®Ø§Ø±Ø¬ÙŠ', 'service', 'ðŸ“¦', 14),
('Reservations', 'reservations', 'Ø­Ø¬ÙˆØ²Ø§Øª', 'service', 'ðŸ“ž', 15),
('Drive-Thru', 'drive-thru', 'Ø·Ù„Ø¨ Ù…Ù† Ø§Ù„Ø³ÙŠØ§Ø±Ø©', 'service', 'ðŸš—', 16),
('24/7', '24-7', '24 Ø³Ø§Ø¹Ø©', 'service', 'ðŸ•', 17),

-- Accessibility
('Wheelchair Accessible', 'wheelchair-accessible', 'Ù…ØªØ§Ø­ Ù„Ù„ÙƒØ±Ø§Ø³ÙŠ Ø§Ù„Ù…ØªØ­Ø±ÙƒØ©', 'accessibility', 'â™¿', 18),
('Elevator', 'elevator', 'Ù…ØµØ¹Ø¯', 'accessibility', 'ðŸ›—', 19),

-- Special
('Alcohol Served', 'alcohol-served', 'ÙŠÙ‚Ø¯Ù… Ø§Ù„ÙƒØ­ÙˆÙ„', 'special', 'ðŸ·', 20),
('Shisha', 'shisha', 'Ø´ÙŠØ´Ø©', 'special', 'ðŸ’¨', 21),
('Buffet', 'buffet', 'Ø¨ÙˆÙÙŠÙ‡', 'special', 'ðŸ½ï¸', 22),
('Kids Menu', 'kids-menu', 'Ù‚Ø§Ø¦Ù…Ø© Ø£Ø·ÙØ§Ù„', 'special', 'ðŸ‘¶', 23),
('Late Night', 'late-night', 'Ù…ØªØ£Ø®Ø± Ø§Ù„Ù„ÙŠÙ„', 'special', 'ðŸŒ™', 24),
('Valet Parking', 'valet-parking', 'ÙˆÙ‚ÙˆÙ Ø¨Ø§Ù„Ø®Ø¯Ù…Ø©', 'special', 'ðŸ”‘', 25)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- 4. MEALS (6 entries)
-- ============================================================================

INSERT INTO restaurants_meals (name, slug, name_ar, description, typical_time_range, display_order) VALUES
('Breakfast', 'breakfast', 'ÙØ·ÙˆØ±', 'Morning meal typically served 6:00 AM - 11:00 AM', '6:00 AM - 11:00 AM', 1),
('Brunch', 'brunch', 'Ø¨Ø±Ø§Ù†Ø´', 'Late morning meal combining breakfast and lunch, typically 10:00 AM - 2:00 PM', '10:00 AM - 2:00 PM', 2),
('Lunch', 'lunch', 'ØºØ¯Ø§Ø¡', 'Midday meal typically served 11:00 AM - 3:00 PM', '11:00 AM - 3:00 PM', 3),
('Afternoon Tea', 'afternoon-tea', 'Ø´Ø§ÙŠ Ø¨Ø¹Ø¯ Ø§Ù„Ø¸Ù‡Ø±', 'Light afternoon meal with tea and snacks, typically 2:00 PM - 5:00 PM', '2:00 PM - 5:00 PM', 4),
('Dinner', 'dinner', 'Ø¹Ø´Ø§Ø¡', 'Evening meal typically served 6:00 PM - 11:00 PM', '6:00 PM - 11:00 PM', 5),
('Late Night', 'late-night', 'Ù…ØªØ£Ø®Ø± Ø§Ù„Ù„ÙŠÙ„', 'Late evening dining typically after 10:00 PM', '10:00 PM - 2:00 AM', 6)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- 5. GOOD FOR (12+ entries)
-- ============================================================================

INSERT INTO restaurants_good_for (name, slug, name_ar, description, icon, display_order) VALUES
('Date Night', 'date-night', 'Ù„ÙŠÙ„Ø© Ø±ÙˆÙ…Ø§Ù†Ø³ÙŠØ©', 'Perfect for romantic dinners and special occasions', 'ðŸ’‘', 1),
('Family Dining', 'family-dining', 'Ø¹Ø§Ø¦Ù„ÙŠ', 'Great for families with children of all ages', 'ðŸ‘¨â€ðŸ‘©â€ðŸ‘§â€ðŸ‘¦', 2),
('Business Lunch', 'business-lunch', 'ØºØ¯Ø§Ø¡ Ø¹Ù…Ù„', 'Professional setting suitable for business meetings', 'ðŸ’¼', 3),
('Groups', 'groups', 'Ù…Ø¬Ù…ÙˆØ¹Ø§Øª', 'Ideal for large groups and celebrations', 'ðŸ‘¥', 4),
('Kids', 'kids', 'Ø£Ø·ÙØ§Ù„', 'Child-friendly with activities and kid menus', 'ðŸ‘¶', 5),
('Celebrations', 'celebrations', 'Ø§Ø­ØªÙØ§Ù„Ø§Øª', 'Perfect for birthdays, anniversaries, and special events', 'ðŸŽ‰', 6),
('Romantic', 'romantic', 'Ø±ÙˆÙ…Ø§Ù†Ø³ÙŠ', 'Intimate setting for couples and romantic occasions', 'ðŸ’•', 7),
('Casual', 'casual', 'Ø¹Ø§Ø¯ÙŠ', 'Relaxed atmosphere for everyday dining', 'ðŸ˜Œ', 8),
('Quick Bite', 'quick-bite', 'ÙˆØ¬Ø¨Ø© Ø³Ø±ÙŠØ¹Ø©', 'Fast service for quick meals and snacks', 'âš¡', 9),
('Solo Dining', 'solo-dining', 'Ø¹Ø´Ø§Ø¡ ÙØ±Ø¯ÙŠ', 'Comfortable for dining alone', 'ðŸ‘¤', 10),
('Meetings', 'meetings', 'Ø§Ø¬ØªÙ…Ø§Ø¹Ø§Øª', 'Suitable for professional meetings and discussions', 'ðŸ¤', 11),
('Special Occasions', 'special-occasions', 'Ù…Ù†Ø§Ø³Ø¨Ø§Øª Ø®Ø§ØµØ©', 'Perfect for important celebrations and milestones', 'ðŸŽŠ', 12),
('Networking', 'networking', 'Ø´Ø¨ÙƒØ§Øª', 'Great for professional networking and social events', 'ðŸŒ', 13)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- 6. DISH TYPES (15+ entries)
-- ============================================================================

INSERT INTO restaurants_dish_types (name, slug, name_ar, description, display_order) VALUES
('Sushi', 'sushi', 'Ø³ÙˆØ´ÙŠ', 'Traditional Japanese raw fish and rice dishes', 1),
('Pizza', 'pizza', 'Ø¨ÙŠØªØ²Ø§', 'Italian flatbread with various toppings', 2),
('Burger', 'burger', 'Ø¨Ø±Ø¬Ø±', 'Ground meat patty served in a bun with toppings', 3),
('Pasta', 'pasta', 'Ø¨Ø§Ø³ØªØ§', 'Italian noodle dishes with various sauces', 4),
('Kebab', 'kebab', 'ÙƒØ¨Ø©', 'Grilled or skewered meat dishes', 5),
('Curry', 'curry', 'ÙƒØ§Ø±ÙŠ', 'Spiced dishes with sauce, popular in Indian and Thai cuisine', 6),
('Ramen', 'ramen', 'Ø±Ø§Ù…Ù†', 'Japanese noodle soup with various toppings', 7),
('Tacos', 'tacos', 'ØªØ§ÙƒÙˆØ³', 'Mexican folded tortillas with fillings', 8),
('Salad', 'salad', 'Ø³Ù„Ø·Ø©', 'Fresh vegetables and greens with dressing', 9),
('Soup', 'soup', 'Ø´ÙˆØ±Ø¨Ø©', 'Liquid dishes with various ingredients', 10),
('Sandwich', 'sandwich', 'Ø³Ø§Ù†Ø¯ÙˆÙŠØªØ´', 'Food between slices of bread', 11),
('Steak', 'steak', 'Ø³ØªÙŠÙƒ', 'Grilled or pan-fried cuts of meat', 12),
('Seafood', 'seafood', 'Ù…Ø£ÙƒÙˆÙ„Ø§Øª Ø¨Ø­Ø±ÙŠØ©', 'Dishes made with fish and shellfish', 13),
('Dessert', 'dessert', 'Ø­Ù„ÙˆÙŠØ§Øª', 'Sweet dishes served after the main course', 14),
('Coffee', 'coffee', 'Ù‚Ù‡ÙˆØ©', 'Beverages made from coffee beans', 15),
('Tea', 'tea', 'Ø´Ø§ÙŠ', 'Beverages made from tea leaves', 16),
('Fresh Juice', 'fresh-juice', 'Ø¹ØµÙŠØ± Ø·Ø§Ø²Ø¬', 'Freshly squeezed fruit and vegetable juices', 17),
('Smoothie', 'smoothie', 'Ø³Ù…ÙˆØ°ÙŠ', 'Blended fruit and yogurt drinks', 18)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- 7. VERIFICATION QUERIES
-- ============================================================================

-- Count seeded data
DO $$
DECLARE
    cuisine_count INTEGER;
    category_count INTEGER;
    feature_count INTEGER;
    meal_count INTEGER;
    good_for_count INTEGER;
    dish_type_count INTEGER;
BEGIN
    -- Count each table
    SELECT COUNT(*) INTO cuisine_count FROM restaurants_cuisines;
    SELECT COUNT(*) INTO category_count FROM restaurants_categories;
    SELECT COUNT(*) INTO feature_count FROM restaurants_features;
    SELECT COUNT(*) INTO meal_count FROM restaurants_meals;
    SELECT COUNT(*) INTO good_for_count FROM restaurants_good_for;
    SELECT COUNT(*) INTO dish_type_count FROM restaurants_dish_types;
    
    -- Report results
    RAISE NOTICE 'Seeding Results:';
    RAISE NOTICE 'Cuisines: %', cuisine_count;
    RAISE NOTICE 'Categories: %', category_count;
    RAISE NOTICE 'Features: %', feature_count;
    RAISE NOTICE 'Meals: %', meal_count;
    RAISE NOTICE 'Good For: %', good_for_count;
    RAISE NOTICE 'Dish Types: %', dish_type_count;
    
    -- Verify success
    IF cuisine_count >= 20 AND category_count >= 10 AND feature_count >= 20 AND meal_count >= 6 AND good_for_count >= 12 THEN
        RAISE NOTICE 'SUCCESS: Reference data seeded successfully!';
    ELSE
        RAISE NOTICE 'WARNING: Some reference data may be missing. Please check the results above.';
    END IF;
END $$;

COMMIT;

-- ============================================================================
-- SEEDING COMPLETE
-- ============================================================================

-- Success message
DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'REFERENCE DATA SEEDING COMPLETED SUCCESSFULLY!';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Seeded data:';
  RAISE NOTICE '- 25+ Cuisines (Japanese, Italian, Middle Eastern, etc.)';
  RAISE NOTICE '- 12+ Categories (Fine Dining, Casual, Fast Food, etc.)';
  RAISE NOTICE '- 25+ Features (WiFi, Parking, Vegan Options, etc.)';
  RAISE NOTICE '- 6 Meals (Breakfast, Lunch, Dinner, etc.)';
  RAISE NOTICE '- 13+ Good For (Date Night, Family, Business, etc.)';
  RAISE NOTICE '- 18+ Dish Types (Sushi, Pizza, Burger, etc.)';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Run the data mapper service';
  RAISE NOTICE '2. Test with sample restaurant data';
  RAISE NOTICE '3. Verify Anthropic API integration';
  RAISE NOTICE '============================================================================';
END $$;




