/**
 * Menu Schema.org Generator
 *
 * Generates structured data markup for restaurant menus
 * following Schema.org Menu, MenuSection, and MenuItem best practices.
 */

import type {
  RestaurantData,
  RestaurantDish,
  MenuSection,
  SchemaMenu,
  SchemaMenuSection,
  SchemaMenuItem,
  SchemaGeneratorOptions,
} from '../types';

/**
 * Generate Menu schema markup
 *
 * @param restaurant - Restaurant data including dishes and menu sections
 * @param options - Schema generation options
 * @returns Menu schema or null if no menu data exists
 */
export function generateMenuSchema(
  restaurant: RestaurantData,
  options: SchemaGeneratorOptions
): SchemaMenu | null {
  // Only generate if dishes exist
  if (!restaurant.dishes || restaurant.dishes.length === 0) {
    return null;
  }

  const menuUrl = `${options.baseUrl}/places-to-eat/restaurants/${restaurant.slug}/menu`;

  const schema: SchemaMenu = {
    '@type': 'Menu',
    url: menuUrl,
  };

  // Generate menu sections if available
  if (restaurant.menu_sections && restaurant.menu_sections.length > 0) {
    schema.hasMenuSection = generateMenuSections(
      restaurant.menu_sections,
      restaurant.dishes
    );
  }

  return schema;
}

/**
 * Generate menu sections with their dishes
 */
function generateMenuSections(
  sections: MenuSection[],
  dishes: RestaurantDish[]
): SchemaMenuSection[] {
  // Sort sections by display order
  const sortedSections = [...sections].sort(
    (a, b) => a.display_order - b.display_order
  );

  return sortedSections
    .map((section) => {
      // Find dishes for this section
      const sectionDishes = dishes.filter(
        (dish) => dish.menu_section_id === section.id
      );

      // Skip empty sections
      if (sectionDishes.length === 0) {
        return null;
      }

      const menuSection: SchemaMenuSection = {
        '@type': 'MenuSection',
        name: section.name,
      };

      // Add description if available
      if (section.description) {
        menuSection.description = section.description;
      }

      // Generate menu items
      menuSection.hasMenuItem = generateMenuItems(sectionDishes);

      return menuSection;
    })
    .filter((section): section is SchemaMenuSection => section !== null);
}

/**
 * Generate menu items from dishes
 */
function generateMenuItems(dishes: RestaurantDish[]): SchemaMenuItem[] {
  return dishes.map((dish) => {
    const menuItem: SchemaMenuItem = {
      '@type': 'MenuItem',
      name: dish.name,
    };

    // Description
    if (dish.description) {
      menuItem.description = dish.description;
    }

    // Price offer
    if (dish.price && dish.currency) {
      menuItem.offers = {
        '@type': 'Offer',
        price: dish.price,
        priceCurrency: dish.currency,
      };
    }

    // Image
    if (dish.image_url) {
      menuItem.image = dish.image_url;
    }

    return menuItem;
  });
}

/**
 * Generate simplified menu structure for embedding in Restaurant schema
 *
 * This provides a lightweight menu reference without full details
 */
export function generateMenuReference(
  restaurant: RestaurantData,
  options: SchemaGeneratorOptions
): string | SchemaMenu {
  const menuUrl = `${options.baseUrl}/places-to-eat/restaurants/${restaurant.slug}/menu`;

  // If no dishes, just return URL
  if (!restaurant.dishes || restaurant.dishes.length === 0) {
    return menuUrl;
  }

  // Return full menu schema
  return generateMenuSchema(restaurant, options) || menuUrl;
}

/**
 * Generate menu item counts by section
 *
 * Useful for analytics and validation
 */
export function getMenuStats(restaurant: RestaurantData): {
  totalDishes: number;
  totalSections: number;
  dishesPerSection: Record<string, number>;
  signatureDishes: number;
  popularDishes: number;
} {
  const stats = {
    totalDishes: restaurant.dishes?.length || 0,
    totalSections: restaurant.menu_sections?.length || 0,
    dishesPerSection: {} as Record<string, number>,
    signatureDishes: 0,
    popularDishes: 0,
  };

  if (!restaurant.dishes || restaurant.dishes.length === 0) {
    return stats;
  }

  // Count dishes per section
  restaurant.dishes.forEach((dish) => {
    if (dish.menu_section_id) {
      const sectionId = dish.menu_section_id;
      stats.dishesPerSection[sectionId] =
        (stats.dishesPerSection[sectionId] || 0) + 1;
    }

    // Count special dishes
    if (dish.is_signature) {
      stats.signatureDishes++;
    }
    if (dish.is_popular) {
      stats.popularDishes++;
    }
  });

  return stats;
}

/**
 * Validate menu data for schema.org requirements
 */
export function validateMenuData(restaurant: RestaurantData): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if menu exists
  if (!restaurant.dishes || restaurant.dishes.length === 0) {
    errors.push('No dishes found for menu generation');
    return { valid: false, errors, warnings };
  }

  // Minimum recommended dishes
  if (restaurant.dishes.length < 5) {
    warnings.push(
      `Only ${restaurant.dishes.length} dishes found. Recommended: 5+ for comprehensive menu`
    );
  }

  // Check for sections
  if (!restaurant.menu_sections || restaurant.menu_sections.length === 0) {
    warnings.push('No menu sections defined. Consider organizing dishes into sections');
  }

  // Validate individual dishes
  restaurant.dishes.forEach((dish, index) => {
    if (!dish.name || dish.name.trim().length === 0) {
      errors.push(`Dish ${index + 1}: Name is required`);
    }

    if (!dish.price && !dish.description) {
      warnings.push(
        `Dish "${dish.name}": Missing both price and description. At least one is recommended`
      );
    }

    if (dish.name && dish.name.length < 3) {
      warnings.push(
        `Dish "${dish.name}": Name too short. Consider more descriptive names`
      );
    }
  });

  // Check for signature dishes
  const signatureDishes = restaurant.dishes.filter((d) => d.is_signature);
  if (signatureDishes.length === 0) {
    warnings.push('No signature dishes marked. Consider highlighting your best dishes');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
