import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { BlogCard } from "@/components/blog/BlogCard";
import {
  getBlogArticlesByCategory,
  blogCategories,
  BlogCategory,
} from "@/lib/queries/blog";
import { BookOpen, ArrowLeft } from "lucide-react";

interface Props {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const categoryInfo = blogCategories[category as BlogCategory];

  if (!categoryInfo) {
    return {
      title: "Category Not Found",
    };
  }

  // Layout template adds " | Best of Goa"
  return {
    title: `${categoryInfo.name} Guides`,
    description: `Discover the best ${categoryInfo.name.toLowerCase()} in Goa. Curated guides, local tips, and insider recommendations.`,
    openGraph: {
      title: `${categoryInfo.name} Guides | Best of Goa Blog`,
      description: `Discover the best ${categoryInfo.name.toLowerCase()} in Goa. Curated guides, local tips, and insider recommendations.`,
      type: "website",
      locale: "en_KW",
      siteName: "Best of Goa",
    },
    alternates: {
      canonical: `https://www.bestofgoa.com/blog/${category}`,
    },
  };
}

export function generateStaticParams() {
  return Object.keys(blogCategories).map((category) => ({
    category,
  }));
}

export default async function BlogCategoryPage({ params }: Props) {
  const { category } = await params;
  const categoryInfo = blogCategories[category as BlogCategory];

  if (!categoryInfo) {
    notFound();
  }

  const articles = await getBlogArticlesByCategory(category);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Breadcrumbs */}
      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Blog", href: "/blog" },
            { label: categoryInfo.name },
          ]}
        />
      </div>

      {/* Hero Section */}
      <section
        className={`bg-gradient-to-br ${categoryInfo.color} text-white py-16`}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge
              variant="secondary"
              className="mb-4 bg-white/20 text-white border-white/30"
            >
              <BookOpen className="w-3 h-3 mr-1" />
              {categoryInfo.description}
            </Badge>

            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {categoryInfo.name} Guides
            </h1>

            <p className="text-lg text-white/90 max-w-2xl mx-auto">
              Curated guides and insider tips for the best{" "}
              {categoryInfo.name.toLowerCase()} in Goa.
            </p>
          </div>
        </div>
      </section>

      {/* Articles */}
      <section className="container mx-auto px-4 py-12">
        {articles.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-8">
              <p className="text-slate-600">
                {articles.length} {articles.length === 1 ? "article" : "articles"}
              </p>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/blog">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  All Articles
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
                <BlogCard key={article.id} article={article} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-10 h-10 text-slate-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Coming Soon
            </h2>
            <p className="text-slate-600 max-w-md mx-auto mb-6">
              We're working on {categoryInfo.name.toLowerCase()} guides. Check
              back soon for helpful articles.
            </p>
            <Button variant="outline" asChild>
              <Link href="/blog">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Browse All Articles
              </Link>
            </Button>
          </div>
        )}
      </section>

      {/* Browse Other Categories */}
      <section className="bg-slate-100 py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-xl font-bold text-slate-900 mb-6 text-center">
            Explore Other Topics
          </h2>
          <div className="flex flex-wrap gap-3 justify-center">
            {Object.entries(blogCategories)
              .filter(([slug]) => slug !== category)
              .map(([slug, info]) => (
                <Link key={slug} href={`/blog/${slug}`}>
                  <Badge
                    variant="outline"
                    className="px-4 py-2 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    {info.name}
                  </Badge>
                </Link>
              ))}
          </div>
        </div>
      </section>
    </div>
  );
}
