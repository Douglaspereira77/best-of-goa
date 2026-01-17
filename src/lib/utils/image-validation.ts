/**
 * Image Validation Utility
 * 
 * Implements comprehensive image formatting policies for Best of Goa
 * Enforces file format, size, resolution, and source filtering rules
 */

export interface ImageValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  qualityScore: number;
  sourceAuthority: string;
  resolution: {
    width: number;
    height: number;
    total: number;
  };
}

export interface ImageMetadata {
  url: string;
  filename?: string;
  contentType?: string;
  size?: number;
  width?: number;
  height?: number;
  source?: string;
}

export class ImageValidator {
  // Policy constants
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
  private static readonly MIN_WIDTH = 1200;
  private static readonly MIN_HEIGHT = 900;
  private static readonly ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp'
  ];

  // Excluded domains (case-insensitive)
  private static readonly EXCLUDED_DOMAINS = [
    'instagram.com',
    'lookaside.instagram.com',
    'facebook.com',
    'fbsbx.com',
    'tiktok.com',
    'encrypted-tbn0.gstatic.com'
  ];

  // Source authority scoring
  private static readonly SOURCE_SCORES = {
    official_website: 50,
    social_media: 45,
    tripadvisor: 40,
    reputable_directory: 35,
    food_blog: 25,
    generic: 10
  };

  /**
   * Validate image against all policies
   */
  static async validateImage(imageMetadata: ImageMetadata): Promise<ImageValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Validate file format
    const formatValidation = this.validateFileFormat(imageMetadata);
    if (!formatValidation.isValid) {
      errors.push(...formatValidation.errors);
    }

    // 2. Validate file size
    const sizeValidation = this.validateFileSize(imageMetadata);
    if (!sizeValidation.isValid) {
      errors.push(...sizeValidation.errors);
    }

    // 3. Validate resolution
    const resolutionValidation = this.validateResolution(imageMetadata);
    if (!resolutionValidation.isValid) {
      errors.push(...resolutionValidation.errors);
    }

    // 4. Validate source domain
    const sourceValidation = this.validateSource(imageMetadata);
    if (!sourceValidation.isValid) {
      errors.push(...sourceValidation.errors);
    }

    // 5. Calculate quality score
    const qualityScore = this.calculateQualityScore(imageMetadata);
    
    // 6. Determine source authority
    const sourceAuthority = this.determineSourceAuthority(imageMetadata.url);

    // Add warnings for non-critical issues
    if (imageMetadata.size && imageMetadata.size > 5 * 1024 * 1024) {
      warnings.push('Large file size may impact loading performance');
    }

    if (imageMetadata.width && imageMetadata.height) {
      const aspectRatio = imageMetadata.width / imageMetadata.height;
      if (aspectRatio < 0.5 || aspectRatio > 2.0) {
        warnings.push('Unusual aspect ratio may not display well');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      qualityScore,
      sourceAuthority,
      resolution: {
        width: imageMetadata.width || 0,
        height: imageMetadata.height || 0,
        total: (imageMetadata.width || 0) * (imageMetadata.height || 0)
      }
    };
  }

  /**
   * Validate file format and MIME type
   */
  private static validateFileFormat(imageMetadata: ImageMetadata): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (imageMetadata.contentType) {
      if (!this.ALLOWED_MIME_TYPES.includes(imageMetadata.contentType.toLowerCase())) {
        errors.push(`Invalid file format: ${imageMetadata.contentType}. Allowed formats: ${this.ALLOWED_MIME_TYPES.join(', ')}`);
      }
    }

    if (imageMetadata.filename) {
      const extension = imageMetadata.filename.toLowerCase().split('.').pop();
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
      
      if (!extension || !allowedExtensions.includes(extension)) {
        errors.push(`Invalid file extension: ${extension}. Allowed extensions: ${allowedExtensions.join(', ')}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate file size
   */
  private static validateFileSize(imageMetadata: ImageMetadata): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (imageMetadata.size && imageMetadata.size > this.MAX_FILE_SIZE) {
      const sizeMB = (imageMetadata.size / (1024 * 1024)).toFixed(2);
      const maxSizeMB = (this.MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);
      errors.push(`File size ${sizeMB}MB exceeds maximum allowed size of ${maxSizeMB}MB`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate image resolution
   */
  private static validateResolution(imageMetadata: ImageMetadata): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (imageMetadata.width && imageMetadata.height) {
      if (imageMetadata.width < this.MIN_WIDTH) {
        errors.push(`Image width ${imageMetadata.width}px is below minimum requirement of ${this.MIN_WIDTH}px`);
      }

      if (imageMetadata.height < this.MIN_HEIGHT) {
        errors.push(`Image height ${imageMetadata.height}px is below minimum requirement of ${this.MIN_HEIGHT}px`);
      }
    } else {
      errors.push('Image dimensions are required for validation');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate source domain against excluded list
   */
  private static validateSource(imageMetadata: ImageMetadata): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    const domain = this.extractDomain(imageMetadata.url);
    const lowerDomain = domain.toLowerCase();

    for (const excludedDomain of this.EXCLUDED_DOMAINS) {
      if (lowerDomain.includes(excludedDomain)) {
        errors.push(`Source domain '${domain}' is excluded from image collection`);
        break;
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Calculate quality score based on resolution and source
   */
  private static calculateQualityScore(imageMetadata: ImageMetadata): number {
    let score = 0;

    // Resolution scoring (0-50 points)
    if (imageMetadata.width && imageMetadata.height) {
      const resolution = imageMetadata.width * imageMetadata.height;
      
      if (resolution >= 1920 * 1080) {
        score += 50; // Full HD+
      } else if (resolution >= 1200 * 900) {
        score += 40; // Target minimum
      } else if (resolution >= 800 * 600) {
        score += 20; // Acceptable
      } else {
        score += 5; // Low quality
      }
    }

    // Source authority scoring (0-50 points)
    const sourceAuthority = this.determineSourceAuthority(imageMetadata.url);
    score += this.SOURCE_SCORES[sourceAuthority] || this.SOURCE_SCORES.generic;

    return Math.min(score, 100); // Cap at 100
  }

  /**
   * Determine source authority based on URL
   */
  private static determineSourceAuthority(url: string): keyof typeof ImageValidator.SOURCE_SCORES {
    const domain = this.extractDomain(url).toLowerCase();

    // Official restaurant website (highest priority)
    if (domain.includes('official') || domain.includes('restaurant')) {
      return 'official_website';
    }

    // Social media
    if (domain.includes('instagram') || domain.includes('facebook')) {
      return 'social_media';
    }

    // Reputable directories
    if (domain.includes('tripadvisor')) {
      return 'tripadvisor';
    }

    if (domain.includes('zomato') || domain.includes('timeout')) {
      return 'reputable_directory';
    }

    // Food blogs
    if (domain.includes('blog') || domain.includes('food')) {
      return 'food_blog';
    }

    return 'generic';
  }

  /**
   * Extract domain from URL
   */
  private static extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return 'unknown';
    }
  }

  /**
   * Generate SEO-friendly filename
   * Format: {restaurant-slug}-{content-descriptor}.jpg
   * Example: olio-trattoria-italiana-champagne-service-beachfront.jpg
   * Note: Restaurant name is now included in filename for better SEO
   */
  static generateSEOFilename(
    restaurantSlug: string,
    contentDescriptor: string
  ): string {
    const descriptor = contentDescriptor
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

    // Format: {restaurant-slug}-{descriptor}.jpg
    return `${restaurantSlug}-${descriptor}.jpg`;
  }

  /**
   * Validate filename format
   */
  static validateFilename(filename: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check extension
    const extension = filename.toLowerCase().split('.').pop();
    if (!extension || !['jpg', 'jpeg', 'png', 'webp'].includes(extension)) {
      errors.push('Filename must have valid image extension (.jpg, .jpeg, .png, .webp)');
    }

    // Check for special characters
    if (!/^[a-zA-Z0-9\-_.]+$/.test(filename)) {
      errors.push('Filename contains invalid characters. Only letters, numbers, hyphens, underscores, and dots are allowed');
    }

    // Check length
    if (filename.length > 255) {
      errors.push('Filename is too long (maximum 255 characters)');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get storage path for image
   */
  static getStoragePath(restaurantSlug: string, filename: string): string {
    // Path should be: {restaurant-slug}/images/{filename}
    // The 'restaurants' bucket prefix is handled by Supabase
    return `${restaurantSlug}/images/${filename}`;
  }

  /**
   * Check if image meets minimum requirements for processing
   */
  static async meetsMinimumRequirements(imageMetadata: ImageMetadata): Promise<boolean> {
    const validation = await this.validateImage(imageMetadata);
    const meetsThreshold = validation.isValid && validation.qualityScore >= 75; // Minimum quality threshold

    // Debug logging for troubleshooting
    console.log(`[ImageValidator] Image validation: isValid=${validation.isValid}, qualityScore=${validation.qualityScore}, meetsThreshold=${meetsThreshold}`);

    return meetsThreshold;
  }
}

export default ImageValidator;
