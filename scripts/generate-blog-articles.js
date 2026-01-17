/**
 * Blog Article Generator
 * Generates SEO-optimized blog articles from existing directory data
 * Uses GPT-4o for conversational + data-driven content
 *
 * Usage: node scripts/generate-blog-articles.js
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require("@supabase/supabase-js");
const OpenAI = require("openai").default;

// Initialize clients
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Fetch functions for different data types
// IMPORTANT: All queries filter for listings WITH hero_image to ensure articles have images
async function fetchTopRestaurants() {
  const { data, error } = await supabase
    .from("restaurants")
    .select("id, name, slug, area, overall_rating, total_reviews_aggregated, short_description, hero_image")
    .eq("status", "published")
    .not("hero_image", "is", null)
    .order("overall_rating", { ascending: false })
    .limit(10);

  if (error) console.log("Restaurant fetch error:", error.message);
  return data || [];
}

async function fetchJapaneseRestaurants() {
  // Search for Japanese/sushi restaurants by name pattern
  const { data, error } = await supabase
    .from("restaurants")
    .select("id, name, slug, area, overall_rating, total_reviews_aggregated, short_description, hero_image")
    .eq("status", "published")
    .not("hero_image", "is", null)
    .or("name.ilike.%sushi%,name.ilike.%japanese%,name.ilike.%sakura%,name.ilike.%tokyo%,name.ilike.%ramen%,name.ilike.%tatami%,name.ilike.%yaki%")
    .order("overall_rating", { ascending: false })
    .limit(10);

  if (error || !data?.length) {
    console.log("Japanese restaurant fetch error or no data, using top restaurants");
    return fetchTopRestaurants();
  }
  return data;
}

async function fetchFamilyFriendlyAttractions() {
  const { data, error } = await supabase
    .from("attractions")
    .select("id, name, slug, area, google_rating, google_review_count, short_description, hero_image")
    .eq("published", true)
    .not("hero_image", "is", null)
    .order("google_rating", { ascending: false })
    .limit(10);

  if (error) console.log("Attraction fetch error:", error.message);

  // Map to consistent format
  return (data || []).map(a => ({
    ...a,
    overall_rating: a.google_rating,
    total_reviews_aggregated: a.google_review_count
  }));
}

async function fetchCapitalAreaRestaurants() {
  // Get restaurants in Goa City / Capital area with images
  const { data, error } = await supabase
    .from("restaurants")
    .select("id, name, slug, area, overall_rating, total_reviews_aggregated, short_description, hero_image, price_level")
    .eq("status", "published")
    .not("hero_image", "is", null)
    .or("area.ilike.%Goa City%,area.ilike.%Capital%,area.ilike.%Sharq%,area.ilike.%Mirqab%,area.ilike.%Salhiya%,area.ilike.%Rai%,area.ilike.%Jibla%")
    .order("overall_rating", { ascending: false })
    .limit(15);

  if (error || !data?.length) {
    console.log("Capital area fetch error or no data, using top restaurants");
    return fetchTopRestaurants();
  }
  return data;
}

async function fetchLuxuryHotels() {
  const { data, error } = await supabase
    .from("hotels")
    .select("id, name, slug, area, google_rating, google_review_count, short_description, hero_image, star_rating")
    .eq("published", true)
    .not("hero_image", "is", null)
    .order("google_rating", { ascending: false })
    .limit(10);

  if (error) console.log("Hotel fetch error:", error.message);

  // Map to consistent format
  return (data || []).map(h => ({
    ...h,
    overall_rating: h.google_rating,
    total_reviews_aggregated: h.google_review_count
  }));
}

// Article templates
const articleTemplates = [
  {
    slug: "best-breakfast-spots-in-goa",
    category: "restaurants",
    title: "Best Breakfast Spots in Goa",
    templateType: "top-10",
    dataQuery: fetchTopRestaurants, // Will use top rated for now
    listingType: "restaurant",
    ctaLink: "/places-to-eat",
    ctaText: "Explore All Restaurants",
  },
  {
    slug: "where-to-find-best-sushi-in-goa",
    category: "restaurants",
    title: "Where to Find the Best Sushi in Goa",
    templateType: "dish-guide",
    dataQuery: fetchJapaneseRestaurants,
    listingType: "restaurant",
    ctaLink: "/places-to-eat",
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
    dataQuery: fetchCapitalAreaRestaurants,
    listingType: "restaurant",
    ctaLink: "/places-to-eat",
    ctaText: "Browse All Restaurants",
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
async function generateArticleContent(template, listings) {
  const prompt = `You are writing a blog article for Best of Goa, a local directory website.

Write in a conversational, friendly tone like a knowledgeable local guide, but back up claims with data (ratings, review counts).

Article: "${template.title}"
Type: ${template.templateType}
Category: ${template.category}

The article features these places (in order of rating):
${listings.slice(0, 10).map((l, i) => `${i + 1}. ${l.name} - Rating: ${l.overall_rating || "N/A"}/5, Area: ${l.area || "Goa"}`).join("\n")}

Generate the following JSON (no markdown, just raw JSON):
{
  "introduction": {
    "paragraphs": [
      "Opening paragraph that hooks the reader and mentions Goa specifically (2-3 sentences)",
      "Second paragraph with context about why this topic matters to locals and visitors (2-3 sentences)"
    ]
  },
  "mainSectionHeading": "A compelling heading for the main listings section",
  "listingHighlights": [
    {"index": 0, "highlight": "Short reason why #1 is special (5-10 words)", "excerpt": "2-3 sentence description of this place"},
    {"index": 1, "highlight": "Short reason for #2", "excerpt": "2-3 sentence description"},
    {"index": 2, "highlight": "Short reason for #3", "excerpt": "2-3 sentence description"},
    {"index": 3, "highlight": "Short reason for #4", "excerpt": "2-3 sentence description"},
    {"index": 4, "highlight": "Short reason for #5", "excerpt": "2-3 sentence description"},
    {"index": 5, "highlight": "Short reason for #6", "excerpt": "2-3 sentence description"},
    {"index": 6, "highlight": "Short reason for #7", "excerpt": "2-3 sentence description"},
    {"index": 7, "highlight": "Short reason for #8", "excerpt": "2-3 sentence description"},
    {"index": 8, "highlight": "Short reason for #9", "excerpt": "2-3 sentence description"},
    {"index": 9, "highlight": "Short reason for #10", "excerpt": "2-3 sentence description"}
  ],
  "additionalSection": {
    "heading": "A relevant subheading (e.g., 'Tips for Your Visit' or 'What to Know')",
    "content": "A helpful paragraph with tips or context (3-4 sentences)"
  },
  "faq": [
    {"question": "A common question about this topic", "answer": "Helpful answer (2-3 sentences)"},
    {"question": "Another relevant question", "answer": "Helpful answer"},
    {"question": "Third question", "answer": "Helpful answer"}
  ],
  "conclusion": {
    "paragraphs": ["Final paragraph summarizing and encouraging exploration (2-3 sentences)"]
  },
  "excerpt": "A 150-160 character excerpt for article previews",
  "metaDescription": "A 155-160 character SEO meta description",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}`;

  console.log("  Calling GPT-4o...");
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
  const listingItems = listings.slice(0, 10).map((l, i) => {
    const highlight = generated.listingHighlights?.[i]?.highlight || "Top rated";
    const excerpt = generated.listingHighlights?.[i]?.excerpt || l.short_description || "A fantastic destination in Goa.";
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
      area: l.area,
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
async function generateArticle(template) {
  console.log(`\nðŸ“ Generating: ${template.title}...`);

  // Fetch data
  const listings = await template.dataQuery();
  if (listings.length === 0) {
    console.log(`  âš ï¸ No data found for ${template.title}, skipping.`);
    return;
  }
  console.log(`  Found ${listings.length} listings`);

  // Generate content with GPT-4o
  const content = await generateArticleContent(template, listings);
  console.log("  Content generated successfully");

  // Check if article already exists
  const { data: existing } = await supabase
    .from("blog_articles")
    .select("id")
    .eq("category", template.category)
    .eq("slug", template.slug)
    .single();

  // Use the hero image from the first listing that has one
  const listingWithImage = listings.find(l => l.hero_image);
  const featuredImage = listingWithImage?.hero_image || null;
  if (featuredImage) {
    console.log(`  ðŸ–¼ï¸ Using featured image from: ${listingWithImage.name}`);
  } else {
    console.log(`  âš ï¸ No listings have hero_image`);
  }

  const articleData = {
    slug: template.slug,
    category: template.category,
    title: template.title,
    excerpt: content.excerpt,
    featured_image: featuredImage,
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
    featured: template.slug === "best-breakfast-spots-in-goa",
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
      const listingRelations = content.sections[0]?.listings?.map(
        (l, i) => ({
          article_id: data.id,
          listing_type: template.listingType,
          listing_id: l.id,
          rank_position: i + 1,
          highlight_text: l.highlight,
        })
      );

      if (listingRelations?.length > 0) {
        await supabase.from("blog_article_listings").insert(listingRelations);
        console.log(`  ðŸ“Ž Linked ${listingRelations.length} listings`);
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

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("âŒ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
    process.exit(1);
  }

  console.log(`Generating ${articleTemplates.length} articles...\n`);

  for (const template of articleTemplates) {
    try {
      await generateArticle(template);
    } catch (error) {
      console.error(`âŒ Error generating ${template.title}:`, error.message);
    }
  }

  console.log("\nâœ¨ All done! Visit /blog to see your articles.");
}

main().catch(console.error);
