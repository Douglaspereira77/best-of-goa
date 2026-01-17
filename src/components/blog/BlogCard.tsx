import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { BlogArticle, blogCategories, BlogCategory } from "@/lib/queries/blog";

interface BlogCardProps {
  article: BlogArticle;
  featured?: boolean;
}

export function BlogCard({ article, featured = false }: BlogCardProps) {
  const categoryInfo = blogCategories[article.category as BlogCategory] || blogCategories.guides;
  const publishedDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  // Estimate read time based on content
  const contentLength = JSON.stringify(article.content).length;
  const readTime = Math.max(3, Math.ceil(contentLength / 1500));

  if (featured) {
    return (
      <Link href={`/blog/${article.category}/${article.slug}`} className="group">
        <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-[1.02]">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Image */}
            <div className="relative h-64 md:h-full min-h-[300px] bg-gradient-to-br from-slate-200 to-slate-300">
              {article.featured_image ? (
                <Image
                  src={article.featured_image}
                  alt={article.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              ) : (
                <div className={`absolute inset-0 bg-gradient-to-br ${categoryInfo.color} opacity-80`} />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <Badge className="absolute top-4 left-4 bg-white/90 text-slate-900">
                Featured
              </Badge>
            </div>

            {/* Content */}
            <CardContent className="p-8 flex flex-col justify-center">
              <Badge
                variant="secondary"
                className={`w-fit mb-4 bg-gradient-to-r ${categoryInfo.color} text-white border-0`}
              >
                {categoryInfo.name}
              </Badge>

              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4 group-hover:text-blue-600 transition-colors">
                {article.title}
              </h2>

              {article.excerpt && (
                <p className="text-slate-600 mb-6 line-clamp-3">
                  {article.excerpt}
                </p>
              )}

              <div className="flex items-center gap-4 text-sm text-slate-500 mb-6">
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
              </div>

              <span className="inline-flex items-center text-blue-600 font-medium group-hover:gap-2 transition-all">
                Read Article
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </span>
            </CardContent>
          </div>
        </Card>
      </Link>
    );
  }

  return (
    <Link href={`/blog/${article.category}/${article.slug}`} className="group">
      <Card className="overflow-hidden h-full border hover:border-blue-300 hover:shadow-lg transition-all duration-300">
        {/* Image */}
        <div className="relative h-48 bg-gradient-to-br from-slate-200 to-slate-300">
          {article.featured_image ? (
            <Image
              src={article.featured_image}
              alt={article.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className={`absolute inset-0 bg-gradient-to-br ${categoryInfo.color} opacity-80 group-hover:opacity-90 transition-opacity`} />
          )}
          <Badge
            className={`absolute top-3 left-3 bg-gradient-to-r ${categoryInfo.color} text-white border-0 text-xs`}
          >
            {categoryInfo.name}
          </Badge>
        </div>

        {/* Content */}
        <CardContent className="p-5">
          <h3 className="font-bold text-lg text-slate-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {article.title}
          </h3>

          {article.excerpt && (
            <p className="text-slate-600 text-sm mb-4 line-clamp-2">
              {article.excerpt}
            </p>
          )}

          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-3">
              {publishedDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {publishedDate}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {readTime} min
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-blue-500 group-hover:translate-x-1 transition-transform" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
