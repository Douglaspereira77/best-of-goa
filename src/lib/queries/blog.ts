
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

// Types
export interface BlogArticleSection {
  type: "listing" | "text" | "comparison" | "faq";
  heading?: string;
  content?: string;
  listings?: Array<{
    id: string;
    type: string;
    rank: number;
    name: string;
    slug: string;
    highlight: string;
    excerpt: string;
    image?: string;
    rating?: number;
    area?: string;
  }>;
  faqs?: Array<{
    question: string;
    answer: string;
  }>;
}

export interface BlogArticleContent {
  introduction: {
    paragraphs: string[];
  };
  sections: BlogArticleSection[];
  conclusion: {
    paragraphs: string[];
    cta?: {
      text: string;
      link: string;
    };
  };
}

export interface BlogArticle {
  id: string;
  slug: string;
  category: string;
  title: string;
  excerpt: string | null;
  content: BlogArticleContent;
  featured_image: string | null;
  template_type: string;
  filters: Record<string, unknown> | null;
  meta_title: string | null;
  meta_description: string | null;
  keywords: string[] | null;
  status: "draft" | "published" | "archived";
  published_at: string | null;
  featured: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface BlogArticleListing {
  id: string;
  article_id: string;
  listing_type: string;
  listing_id: string;
  rank_position: number | null;
  highlight_text: string | null;
}

// Category display names and URL mappings
export const blogCategories = {
  restaurants: {
    name: "Restaurants",
    description: "Food & dining guides",
    color: "from-orange-500 to-red-500",
    basePath: "/places-to-eat",
  },
  hotels: {
    name: "Hotels",
    description: "Accommodation guides",
    color: "from-blue-500 to-indigo-500",
    basePath: "/places-to-stay",
  },
  malls: {
    name: "Shopping",
    description: "Shopping guides",
    color: "from-purple-500 to-pink-500",
    basePath: "/places-to-shop",
  },
  attractions: {
    name: "Attractions",
    description: "Things to see",
    color: "from-green-500 to-teal-500",
    basePath: "/places-to-visit",
  },
  fitness: {
    name: "Fitness",
    description: "Health & wellness",
    color: "from-cyan-500 to-blue-500",
    basePath: "/things-to-do/fitness",
  },
  schools: {
    name: "Schools",
    description: "Education guides",
    color: "from-yellow-500 to-orange-500",
    basePath: "/places-to-learn",
  },
  guides: {
    name: "Guides",
    description: "Comprehensive guides",
    color: "from-slate-500 to-slate-700",
    basePath: "/blog/guides",
  },
} as const;

export type BlogCategory = keyof typeof blogCategories;

// Query functions
export async function getBlogArticles(options?: {
  category?: string;
  featured?: boolean;
  limit?: number;
}): Promise<BlogArticle[]> {
  if (!adminDb) return [];

  try {
    let query = adminDb.collection("blog_articles")
      .where("status", "==", "published")
      .orderBy("published_at", "desc");

    if (options?.category) {
      query = query.where("category", "==", options.category);
    }

    if (options?.featured) {
      query = query.where("featured", "==", true);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => doc.data() as BlogArticle);
  } catch (error) {
    console.error("Error fetching blog articles:", error);
    return [];
  }
}

export async function getBlogArticleBySlug(
  category: string,
  slug: string
): Promise<BlogArticle | null> {
  if (!adminDb) return null;

  try {
    const query = adminDb.collection("blog_articles")
      .where("category", "==", category)
      .where("slug", "==", slug)
      .where("status", "==", "published")
      .limit(1);

    const snapshot = await query.get();
    if (snapshot.empty) return null;
    return snapshot.docs[0].data() as BlogArticle;
  } catch (error) {
    console.error("Error fetching blog article:", error);
    return null;
  }
}

export async function getAllBlogSlugs(): Promise<
  Array<{ category: string; slug: string }>
> {
  if (!adminDb) return [];
  try {
    const snapshot = await adminDb.collection("blog_articles")
      .where("status", "==", "published")
      .select('category', 'slug')
      .get();

    return snapshot.docs.map(doc => ({
      category: doc.data().category,
      slug: doc.data().slug
    }));
  } catch (error) {
    console.error("Error fetching blog slugs:", error);
    return [];
  }
}

export async function getBlogArticlesByCategory(
  category: string
): Promise<BlogArticle[]> {
  return getBlogArticles({ category });
}

export async function getFeaturedBlogArticles(
  limit: number = 3
): Promise<BlogArticle[]> {
  return getBlogArticles({ featured: true, limit });
}

export async function getRelatedArticles(
  currentArticleId: string,
  category: string,
  limit: number = 3
): Promise<BlogArticle[]> {
  if (!adminDb) return [];
  try {
    // Helper function since != ID and limit is simpler in client but here we need a query
    // Firestore doesn't support != easily with other filters sometimes.
    // We will fetch limit + 1 and filter out current ID
    const matches = await adminDb.collection("blog_articles")
      .where("status", "==", "published")
      .where("category", "==", category)
      .orderBy("published_at", "desc")
      .limit(limit + 1)
      .get();

    const articles = matches.docs.map(d => d.data() as BlogArticle)
      .filter(a => a.id !== currentArticleId)
      .slice(0, limit);

    return articles;
  } catch (error) {
    console.error("Error fetching related articles:", error);
    return [];
  }
}

export async function getBlogCategoriesWithCounts(): Promise<
  Array<{ category: string; count: number }>
> {
  if (!adminDb) return [];
  try {
    // Firestore doesn't have a cheap group-by count.
    // We have to iterate or use aggregation.
    // For small number of articles, valid.
    const snapshot = await adminDb.collection("blog_articles")
      .where("status", "==", "published")
      .select("category")
      .get();

    const counts: Record<string, number> = {};
    snapshot.forEach(doc => {
      const cat = doc.data().category;
      counts[cat] = (counts[cat] || 0) + 1;
    });

    return Object.entries(counts).map(([category, count]) => ({
      category,
      count,
    }));
  } catch (error) {
    console.error("Error fetching blog category counts:", error);
    return [];
  }
}

export async function incrementArticleViewCount(articleId: string): Promise<void> {
  if (!adminDb) return;
  try {
    await adminDb.collection("blog_articles").doc(articleId).update({
      view_count: FieldValue.increment(1)
    });
  } catch (e) {
    console.error("Error incrementing view count", e);
  }
}

// Get total article count
export async function getTotalBlogArticleCount(): Promise<number> {
  if (!adminDb) return 0;
  try {
    const snap = await adminDb.collection("blog_articles")
      .where("status", "==", "published")
      .count()
      .get();
    return snap.data().count;
  } catch (error) {
    console.error("Error fetching blog article count:", error);
    return 0;
  }
}
