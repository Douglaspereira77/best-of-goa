import { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { BlogCard } from "@/components/blog/BlogCard";
import {
  getBlogArticles,
  getFeaturedBlogArticles,
  getBlogCategoriesWithCounts,
  getTotalBlogArticleCount,
  blogCategories,
  BlogCategory,
} from "@/lib/queries/blog";
import { BookOpen, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog - Guides, Tips & Local Insights",
  description:
    "Discover the best of Goa through our curated guides, local tips, and insider recommendations. From restaurant guides to attraction roundups.",
  openGraph: {
    title: "Blog | Best of Goa - Guides, Tips & Local Insights",
    description:
      "Discover the best of Goa through our curated guides, local tips, and insider recommendations.",
    type: "website",
    locale: "en_KW",
    siteName: "Best of Goa",
  },
  alternates: {
    canonical: "https://www.bestofgoa.com/blog",
  },
};

export default async function BlogPage() {
  const [allArticles, featuredArticles, categoryCounts, totalCount] =
    await Promise.all([
      getBlogArticles({ limit: 12 }),
      getFeaturedBlogArticles(1),
      getBlogCategoriesWithCounts(),
      getTotalBlogArticleCount(),
    ]);

  const featuredArticle = featuredArticles[0];
  const regularArticles = allArticles.filter(
    (a) => a.id !== featuredArticle?.id
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Breadcrumbs */}
      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Blog" }]} />
      </div>

      {/* Hero Section */}
      <section className="bg-white border-b">
        <div className="container mx-auto px-4 py-16 md:py-20">
          <div className="max-w-4xl mx-auto text-center">
            <Badge
              variant="secondary"
              className="mb-4 bg-blue-100 text-blue-700 border-blue-200"
            >
              <BookOpen className="w-3 h-3 mr-1" />
              Guides & Insights
            </Badge>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-4">
              Discover{" "}
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Goa's Best
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
              Curated guides, local tips, and insider recommendations to help you
              explore the best of what Goa has to offer.
            </p>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-2 justify-center">
              {categoryCounts.map(({ category, count }) => {
                const info = blogCategories[category as BlogCategory];
                if (!info) return null;
                return (
                  <Link key={category} href={`/blog/${category}`}>
                    <Badge
                      variant="outline"
                      className="px-4 py-2 text-sm hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      {info.name}
                      <span className="ml-2 text-slate-400">({count})</span>
                    </Badge>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Article */}
      {featuredArticle && (
        <section className="container mx-auto px-4 py-12">
          <BlogCard article={featuredArticle} featured />
        </section>
      )}

      {/* All Articles */}
      {regularArticles.length > 0 && (
        <section className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
                Latest Articles
              </h2>
              <p className="text-slate-600 mt-1">
                {totalCount} guides to explore
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularArticles.map((article) => (
              <BlogCard key={article.id} article={article} />
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {allArticles.length === 0 && (
        <section className="container mx-auto px-4 py-20">
          <div className="text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-10 h-10 text-slate-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Coming Soon
            </h2>
            <p className="text-slate-600 max-w-md mx-auto">
              We're working on curated guides and local insights. Check back
              soon for helpful articles about the best of Goa.
            </p>
          </div>
        </section>
      )}

      {/* Browse by Category */}
      <section className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge
              variant="secondary"
              className="mb-3 bg-white/20 text-white border-white/30"
            >
              Categories
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Browse by Topic
            </h2>
            <p className="text-blue-100 max-w-2xl mx-auto">
              Find guides and recommendations for every interest
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-5xl mx-auto">
            {Object.entries(blogCategories).map(([slug, info]) => (
              <Link key={slug} href={`/blog/${slug}`} className="group">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${info.color} mx-auto mb-3 flex items-center justify-center`}
                  >
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-white group-hover:text-blue-200 transition-colors">
                    {info.name}
                  </h3>
                  <p className="text-xs text-blue-200 mt-1">{info.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Know a Hidden Gem?
          </h2>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            Help us discover the best places in Goa. Submit your favorite
            spots and share the local love.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/application">
              Suggest a Place
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
