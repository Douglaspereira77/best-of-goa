/**
 * Blog Article Generator
 * Generates SEO-optimized blog articles from existing directory data
 * Uses GPT-4o for conversational + data-driven content
 *
 * Usage: npx ts-node scripts/generate-blog-articles.ts
 */

import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

// Initialize clients
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Article templates to generate
interface ArticleTemplate {
  slug: string;
  category: string;
  title: string;
  templateType: string;
  dataQuery: () => Promise<unknown[]>;
  listingType: string;
  ctaLink: string;
  ctaText: string;
}

// Fetch functions for different data types
async function fetchTopBreakfastRestaurants() {
  const { data } = await supabase
    .from("restaurants")
    .select("id, name, slug, area, governorate, overall_rating, total_reviews, short_description, hero_image, cuisines, good_for")
    .eq("status", "published")
    .or("good_for.cs.{Breakfast},good_for.cs.{Brunch}")
    .order("overall_rating", { ascending: false })
    .limit(10);
  return data || [];
}

async function fetchTopSushiRestaurants() {
  const { data } = await supabase
    .from("restaurants")
    .select("id, name, slug, area, governorate, overall_rating, total_reviews, short_description, hero_image, cuisines, signature_dishes")
    .eq("status", "published")
    .or("cuisines.cs.{Japanese},cuisines.cs.{Sushi}")
    .order("overall_rating", { ascending: false })
    .limit(10);
  return data || [];
}

async function fetchFamilyFriendlyAttractions() {
  const { data } = await supabase
    .from("attractions")
    .select("id, name, slug, area, governorate, overall_rating, total_reviews, short_description, hero_image, categories")
    .eq("status", "published")
    .order("overall_rating", { ascending: false })
    .limit(10);
  return data || [];
}

async function fetchGoaCityRestaurants() {
  const { data } = await supabase
    .from("restaurants")
    .select("id, name, slug, area, governorate, overall_rating, total_reviews, short_description, hero_image, cuisines, price_level")
    .eq("status", "published")
    .eq("governorate", "Capital")
    .order("overall_rating", { ascending: false })
    .limit(15);
  return data || [];
}

async function fetchLuxuryHotels() {
  const { data } = await supabase
    .from("hotels")
    .select("id, name, slug, area, governorate, overall_rating, total_reviews, short_description, hero_image, star_rating, amenities")
    .eq("status", "published")
    .gte("star_rating", 4)
    .order("overall_rating", { ascending: false })
    .limit(10);
  return data || [];
}

// Article templates
const articleTemplates: ArticleTemplate[] = [
  {
    slug: "best-breakfast-spots-in-goa",
    category: "restaurants",
    title: "Best Breakfast Spots in Goa",
    templateType: "top-10",
    dataQuery: fetchTopBreakfastRestaurants,
    listingType: "restaurant",
    ctaLink: "/places-to-eat?good_for=breakfast",
    ctaText: "Explore All Breakfast Restaurants",
  },
  {
    slug: "where-to-find-best-sushi-in-goa",
    category: "restaurants",
    title: "Where to Find the Best Sushi in Goa",
    templateType: "dish-guide",
    dataQuery: fetchTopSushiRestaurants,
    listingType: "restaurant",
    ctaLink: "/places-to-eat/japanese",
    ctaText: "Explore All Japanese Restaurants",
  },
  {
    slug: "top-10-family-friendly-attractions",
    category: "attractions",
    title: "Top 10 Family-Friendly Attractions in Goa",
    templateType: "top-10",
    dataQuery: fetchFamilyFriendlyAttractions,
    listingType: "attraction",
    ctaLink: "/places-to-visit",
    ctaText: "Explore All Attractions",
  },
  {
    slug: "goa-city-dining-guide-2025",
    category: "guides",
    title: "Goa City Dining Guide 2025",
    templateType: "area-guide",
    dataQuery: fetchGoaCityRestaurants,
    listingType: "restaurant",
    ctaLink: "/places-to-eat?governorate=capital",
    ctaText: "Browse All Goa City Restaurants",
  },
  {
    slug: "top-10-luxury-hotels-in-goa",
    category: "hotels",
    title: "Top 10 Luxury Hotels in Goa",
    templateType: "top-10",
    dataQuery: fetchLuxuryHotels,
    listingType: "hotel",
    ctaLink: "/places-to-stay",
    ctaText: "Explore All Hotels",
  },
];

// Generate article content using GPT-4o
async function generateArticleContent(
  template: ArticleTemplate,
  listings: unknown[]
): Promise<{
  introduction: { paragraphs: string[] };
  sections: unknown[];
  conclusion: { paragraphs: string[]; cta: { text: string; link: string } };
  excerpt: string;
  metaDescription: string;
  keywords: string[];
}> {
  const listingNames = listings.map((l: any) => l.name).join(", ");
  const topRating = listings[0] ? (listings[0] as any).overall_rating : 0;

  const prompt = `You are writing a blog article for Best of Goa, a local directory website.

Write in a conversational, friendly tone like a knowledgeable local guide, but back up claims with data (ratings, review counts).

Article: "${template.title}"
Type: ${template.templateType}
Category: ${template.category}

The article features these places (in order of rating):
${listings.slice(0, 10).map((l: any, i) => `${i + 1}. ${l.name} - Rating: ${l.overall_rating || "N/A"}, Area: ${l.area || l.governorate || "Goa"}`).join("\n")}

Generate the following JSON (no markdown, just raw JSON):
{
  "introduction": {
    "paragraphs": [
      "Opening paragraph that hooks the reader and mentions Goa specifically",
      "Second paragraph with context about why this topic matters to locals and visitors"
    ]
  },
  "mainSectionHeading": "A compelling heading for the main listings section",
  "listingHighlights": [
    {"index": 0, "highlight": "Short reason why #1 is special (5-10 words)", "excerpt": "2-3 sentence description of this place"},
    {"index": 1, "highlight": "Short reason for #2", "excerpt": "2-3 sentence description"},
    // ... continue for top 10
  ],
  "additionalSection": {
    "heading": "A relevant subheading (e.g., 'Tips for Your Visit' or 'What to Know')",
    "content": "A paragraph with helpful tips or context"
  },
  "faq": [
    {"question": "A common question about this topic", "answer": "Helpful answer"},
    {"question": "Another relevant question", "answer": "Helpful answer"},
    {"question": "Third question", "answer": "Helpful answer"}
  ],
  "conclusion": {
    "paragraphs": ["Final paragraph summarizing and encouraging exploration"]
  },
  "excerpt": "A 150-160 character excerpt for article previews",
  "metaDescription": "A 155-160 character SEO meta description",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  const generated = JSON.parse(response.choices[0].message.content || "{}");

  // Build structured content
  const sections = [];

  // Main listings section
  const listingItems = listings.slice(0, 10).map((l: any, i) => {
    const highlight = generated.listingHighlights?.[i]?.highlight || "Top rated";
    const excerpt = generated.listingHighlights?.[i]?.excerpt || l.short_description || "";
    return {
      id: l.id,
      type: template.listingType,
      rank: i + 1,
      name: l.name,
      slug: l.slug,
      highlight,
      excerpt,
      image: l.hero_image,
      rating: l.overall_rating,
      area: l.area || l.governorate,
    };
  });

  sections.push({
    type: "listing",
    heading: generated.mainSectionHeading || `Top ${template.title}`,
    listings: listingItems,
  });

  // Additional context section
  if (generated.additionalSection) {
    sections.push({
      type: "text",
      heading: generated.additionalSection.heading,
      content: generated.additionalSection.content,
    });
  }

  // FAQ section
  if (generated.faq && generated.faq.length > 0) {
    sections.push({
      type: "faq",
      heading: "Frequently Asked Questions",
      faqs: generated.faq,
    });
  }

  return {
    introduction: generated.introduction || { paragraphs: ["Discover the best in Goa."] },
    sections,
    conclusion: {
      paragraphs: generated.conclusion?.paragraphs || ["Explore more of Goa's finest."],
      cta: { text: template.ctaText, link: template.ctaLink },
    },
    excerpt: generated.excerpt || `Discover ${template.title.toLowerCase()} in our curated guide.`,
    metaDescription: generated.metaDescription || `${template.title} - Your guide to the best in Goa.`,
    keywords: generated.keywords || [template.category, "Goa", "best"],
  };
}

// Generate and save a single article
async function generateArticle(template: ArticleTemplate) {
  console.log(`\nGenerating: ${template.title}...`);

  // Fetch data
  const listings = await template.dataQuery();
  if (listings.length === 0) {
    console.log(`  âš ï¸ No data found for ${template.title}, skipping.`);
    return;
  }
  console.log(`  Found ${listings.length} listings`);

  // Generate content with GPT-4o
  console.log(`  Generating content with GPT-4o...`);
  const content = await generateArticleContent(template, listings);

  // Check if article already exists
  const { data: existing } = await supabase
    .from("blog_articles")
    .select("id")
    .eq("category", template.category)
    .eq("slug", template.slug)
    .single();

  const articleData = {
    slug: template.slug,
    category: template.category,
    title: template.title,
    excerpt: content.excerpt,
    content: {
      introduction: content.introduction,
      sections: content.sections,
      conclusion: content.conclusion,
    },
    template_type: template.templateType,
    meta_title: `${template.title} | Best of Goa`,
    meta_description: content.metaDescription,
    keywords: content.keywords,
    status: "published",
    published_at: new Date().toISOString(),
    featured: template.slug === "best-breakfast-spots-in-goa", // Feature the first one
    last_generated_at: new Date().toISOString(),
  };

  if (existing) {
    // Update existing article
    const { error } = await supabase
      .from("blog_articles")
      .update(articleData)
      .eq("id", existing.id);

    if (error) {
      console.log(`  âŒ Error updating: ${error.message}`);
    } else {
      console.log(`  âœ… Updated: ${template.title}`);
    }
  } else {
    // Insert new article
    const { data, error } = await supabase
      .from("blog_articles")
      .insert(articleData)
      .select()
      .single();

    if (error) {
      console.log(`  âŒ Error inserting: ${error.message}`);
    } else {
      console.log(`  âœ… Created: ${template.title}`);

      // Insert listing relationships
      const listingRelations = (content.sections[0] as any)?.listings?.map(
        (l: any, i: number) => ({
          article_id: data.id,
          listing_type: template.listingType,
          listing_id: l.id,
          rank_position: i + 1,
          highlight_text: l.highlight,
        })
      );

      if (listingRelations?.length > 0) {
        await supabase.from("blog_article_listings").insert(listingRelations);
      }
    }
  }
}

// Main function
async function main() {
  console.log("ðŸš€ Blog Article Generator");
  console.log("========================\n");

  // Check for required env vars
  if (!process.env.OPENAI_API_KEY) {
    console.error("âŒ OPENAI_API_KEY is required");
    process.exit(1);
  }

  console.log(`Generating ${articleTemplates.length} articles...\n`);

  for (const template of articleTemplates) {
    try {
      await generateArticle(template);
    } catch (error) {
      console.error(`âŒ Error generating ${template.title}:`, error);
    }
  }

  console.log("\nâœ¨ Done!");
}

main().catch(console.error);
