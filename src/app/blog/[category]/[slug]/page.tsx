import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { BlogCard } from "@/components/blog/BlogCard";
import {
  BlogArticleContent,
  TableOfContents,
} from "@/components/blog/BlogArticle";
import {
  getBlogArticleBySlug,
  getRelatedArticles,
  getAllBlogSlugs,
  blogCategories,
  BlogCategory,
} from "@/lib/queries/blog";
import { Calendar, Clock, ArrowLeft, Share2 } from "lucide-react";

interface Props {
  params: Promise<{ category: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, slug } = await params;
  const article = await getBlogArticleBySlug(category, slug);

  if (!article) {
    return {
      title: "Article Not Found",
    };
  }

  // Clean title - layout template adds " | Best of Goa"
  let metaTitle = article.meta_title || article.title;
  metaTitle = metaTitle.replace(/\s*\|\s*Best of Goa.*$/i, '');

  // Truncate if too long
  if (metaTitle.length > 45) {
    metaTitle = metaTitle.substring(0, 42) + '...';
  }

  return {
    title: metaTitle,
    description: article.meta_description || article.excerpt || "",
    keywords: article.keywords || [],
    openGraph: {
      title: article.meta_title || article.title,
      description: article.meta_description || article.excerpt || "",
      type: "article",
      locale: "en_KW",
      siteName: "Best of Goa",
      publishedTime: article.published_at || undefined,
      modifiedTime: article.updated_at,
      images: article.featured_image
        ? [{ url: article.featured_image, width: 1200, height: 630 }]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: article.meta_title || article.title,
      description: article.meta_description || article.excerpt || "",
      images: article.featured_image ? [article.featured_image] : [],
    },
    alternates: {
      canonical: `https://www.bestofgoa.com/blog/${category}/${slug}`,
    },
  };
}

export async function generateStaticParams() {
  const slugs = await getAllBlogSlugs();
  return slugs.map(({ category, slug }) => ({
    category,
    slug,
  }));
}

export default async function BlogArticlePage({ params }: Props) {
  const { category, slug } = await params;
  const article = await getBlogArticleBySlug(category, slug);

  if (!article) {
    notFound();
  }

  const relatedArticles = await getRelatedArticles(article.id, category, 3);
  const categoryInfo = blogCategories[category as BlogCategory] || blogCategories.guides;

  const publishedDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  // Estimate read time
  const contentLength = JSON.stringify(article.content).length;
  const readTime = Math.max(3, Math.ceil(contentLength / 1500));

  // Schema.org structured data
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.excerpt || article.meta_description,
    image: article.featured_image,
    datePublished: article.published_at,
    dateModified: article.updated_at,
    author: {
      "@type": "Organization",
      name: "Best of Goa",
      url: "https://www.bestofgoa.com",
    },
    publisher: {
      "@type": "Organization",
      name: "Best of Goa",
      logo: {
        "@type": "ImageObject",
        url: "https://www.bestofgoa.com/logo.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://www.bestofgoa.com/blog/${category}/${slug}`,
    },
  };

  return (
    <>
      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      <div className="min-h-screen bg-white">
        {/* Breadcrumbs */}
        <div className="container mx-auto px-4 pt-6">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Blog", href: "/blog" },
              { label: categoryInfo.name, href: `/blog/${category}` },
              { label: article.title },
            ]}
          />
        </div>

        {/* Hero */}
        <header className="container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-4xl mx-auto">
            {/* Category Badge */}
            <Link href={`/blog/${category}`}>
              <Badge
                className={`mb-4 bg-gradient-to-r ${categoryInfo.color} text-white border-0 hover:opacity-90 transition-opacity`}
              >
                {categoryInfo.name}
              </Badge>
            </Link>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
              {article.title}
            </h1>

            {/* Excerpt */}
            {article.excerpt && (
              <p className="text-xl text-slate-600 mb-6">{article.excerpt}</p>
            )}

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
              {publishedDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {publishedDate}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {readTime} min read
              </span>
              <Button variant="ghost" size="sm" className="ml-auto">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </header>

        {/* Featured Image */}
        {article.featured_image && (
          <div className="container mx-auto px-4 mb-12">
            <div className="max-w-5xl mx-auto">
              <div className="relative aspect-[2/1] rounded-2xl overflow-hidden bg-slate-200">
                <Image
                  src={article.featured_image}
                  alt={article.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="container mx-auto px-4 pb-16">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_250px] gap-12">
              {/* Main Content */}
              <main>
                <BlogArticleContent article={article} />
              </main>

              {/* Sidebar */}
              <aside className="hidden lg:block">
                <TableOfContents article={article} />
              </aside>
            </div>
          </div>
        </div>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <section className="bg-slate-50 py-16">
            <div className="container mx-auto px-4">
              <div className="max-w-5xl mx-auto">
                <h2 className="text-2xl font-bold text-slate-900 mb-8">
                  Related Articles
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {relatedArticles.map((related) => (
                    <BlogCard key={related.id} article={related} />
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Back to Blog */}
        <section className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <Button variant="outline" size="lg" asChild>
              <Link href="/blog">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Blog
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </>
  );
}
