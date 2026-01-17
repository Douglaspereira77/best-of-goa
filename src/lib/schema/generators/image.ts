import type { ImageObject } from '../types';

interface ImageData {
  url: string;
  alt?: string;
  title?: string;
  description?: string;
  resolution?: string; // e.g., "1920x1080"
  primary?: boolean;
}

/**
 * Generate ImageObject schema for a single image
 * Helps with image search and visual rich results
 */
export function generateImageObjectSchema(image: ImageData): ImageObject {
  const schema: ImageObject = {
    '@type': 'ImageObject',
    url: image.url,
    contentUrl: image.url,
  };

  // Add optional properties if available
  if (image.alt || image.title) {
    schema.caption = image.alt || image.title;
  }

  if (image.description) {
    schema.description = image.description;
  }

  // Parse resolution if available (format: "1920x1080")
  if (image.resolution) {
    const [width, height] = image.resolution.split('x').map(Number);
    if (width && height) {
      schema.width = width;
      schema.height = height;
    }
  }

  return schema;
}

/**
 * Generate array of ImageObject schemas
 * Use for restaurant photo galleries
 */
export function generateImageObjectsSchema(images: ImageData[]): ImageObject[] {
  if (!images || images.length === 0) {
    return [];
  }

  return images.map((image) => generateImageObjectSchema(image));
}

/**
 * Get primary image URL for Restaurant schema
 * Returns URL string or array of URLs
 */
export function getPrimaryImageUrl(images: ImageData[]): string | string[] {
  if (!images || images.length === 0) {
    return [];
  }

  // Find primary image
  const primaryImage = images.find((img) => img.primary);

  if (primaryImage) {
    return primaryImage.url;
  }

  // If no primary, return first image or array of all images
  if (images.length === 1) {
    return images[0].url;
  }

  // Return array of up to 5 image URLs for variety
  return images.slice(0, 5).map((img) => img.url);
}
