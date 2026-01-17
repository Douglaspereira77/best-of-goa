import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Star,
  MapPin,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import {
  BlogArticle as BlogArticleType,
  BlogArticleSection,
  blogCategories,
  BlogCategory,
} from "@/lib/queries/blog";

interface BlogArticleProps {
  article: BlogArticleType;
}

// Get listing URL based on type
function getListingUrl(type: string, slug: string): string {
  const urlMap: Record<string, string> = {
    restaurant: `/places-to-eat/restaurants/${slug}`,
    hotel: `/places-to-stay/hotels/${slug}`,
    mall: `/places-to-shop/malls/${slug}`,
    attraction: `/places-to-visit/attractions/${slug}`,
    fitness: `/things-to-do/fitness/${slug}`,
    school: `/places-to-learn/schools/${slug}`,
  };
  return urlMap[type] || "#";
}

// Render a listing item
function ListingItem({
  listing,
  showRank = true,
}: {
  listing: NonNullable<BlogArticleSection["listings"]>[0];
  showRank?: boolean;
}) {
  return (
    <Link href={getListingUrl(listing.type, listing.slug)} className="group">
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-blue-300">
        <div className="flex flex-col sm:flex-row">
          {/* Image */}
          <div className="relative w-full sm:w-48 h-40 sm:h-auto flex-shrink-0 bg-gradient-to-br from-slate-200 to-slate-300">
            {listing.image ? (
              <Image
                src={listing.image}
                alt={listing.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl font-bold text-white/80">
                  {showRank ? `#${listing.rank}` : listing.name.charAt(0)}
                </span>
              </div>
            )}
            {showRank && listing.image && (
              <div className="absolute top-2 left-2 bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                {listing.rank}
              </div>
            )}
          </div>

          {/* Content */}
          <CardContent className="flex-1 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h3 className="font-bold text-lg text-slate-900 group-hover:text-blue-600 transition-colors">
                  {listing.name}
                </h3>
                {listing.highlight && (
                  <Badge variant="secondary" className="mt-1 text-xs bg-amber-100 text-amber-800">
                    {listing.highlight}
                  </Badge>
                )}
              </div>
              {listing.rating && listing.rating > 0 && (
                <div className="flex items-center gap-1 text-amber-500 flex-shrink-0">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="font-semibold text-sm">{listing.rating.toFixed(1)}</span>
                </div>
              )}
            </div>

            {listing.area && (
              <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {listing.area}
              </p>
            )}

            <p className="text-slate-600 text-sm mt-2 line-clamp-2">
              {listing.excerpt}
            </p>

            <div className="mt-3 flex items-center text-blue-600 text-sm font-medium group-hover:gap-2 transition-all">
              View Details
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </CardContent>
        </div>
      </Card>
    </Link>
  );
}

// Render FAQ section
function FAQSection({ faqs }: { faqs: Array<{ question: string; answer: string }> }) {
  return (
    <div className="space-y-4">
      {faqs.map((faq, index) => (
        <div
          key={index}
          className="border rounded-lg p-5 bg-slate-50"
          itemScope
          itemProp="mainEntity"
          itemType="https://schema.org/Question"
        >
          <h4 className="font-semibold text-lg text-slate-900 mb-2" itemProp="name">
            {faq.question}
          </h4>
          <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
            <p className="text-slate-600" itemProp="text">
              {faq.answer}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function BlogArticleContent({ article }: BlogArticleProps) {
  const categoryInfo = blogCategories[article.category as BlogCategory] || blogCategories.guides;
  const content = article.content;

  return (
    <article className="prose prose-lg max-w-none">
      {/* Introduction */}
      {content.introduction?.paragraphs?.map((paragraph, index) => (
        <p key={index} className="text-slate-700 leading-relaxed text-lg">
          {paragraph}
        </p>
      ))}

      {/* Sections */}
      {content.sections?.map((section, sectionIndex) => (
        <section key={sectionIndex} className="mt-10">
          {section.heading && (
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6">
              {section.heading}
            </h2>
          )}

          {/* Text section */}
          {section.type === "text" && section.content && (
            <p className="text-slate-700 leading-relaxed">{section.content}</p>
          )}

          {/* Listing section */}
          {section.type === "listing" && section.listings && (
            <div className="space-y-4 not-prose">
              {section.listings.map((listing, listingIndex) => (
                <ListingItem
                  key={listingIndex}
                  listing={listing}
                  showRank={article.template_type === "top-10"}
                />
              ))}
            </div>
          )}

          {/* FAQ section */}
          {section.type === "faq" && section.faqs && (
            <div
              className="not-prose"
              itemScope
              itemType="https://schema.org/FAQPage"
            >
              <FAQSection faqs={section.faqs} />
            </div>
          )}
        </section>
      ))}

      {/* Conclusion */}
      {content.conclusion && (
        <section className="mt-10 pt-8 border-t">
          {content.conclusion.paragraphs?.map((paragraph, index) => (
            <p key={index} className="text-slate-700 leading-relaxed">
              {paragraph}
            </p>
          ))}

          {content.conclusion.cta && (
            <div className="mt-8 not-prose">
              <Button size="lg" asChild>
                <Link href={content.conclusion.cta.link}>
                  {content.conclusion.cta.text}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          )}
        </section>
      )}
    </article>
  );
}

// Table of Contents component
export function TableOfContents({ article }: BlogArticleProps) {
  const sections = article.content.sections || [];
  const headings = sections
    .filter((s) => s.heading)
    .map((s, i) => ({
      id: `section-${i}`,
      title: s.heading!,
    }));

  if (headings.length < 2) return null;

  return (
    <nav className="bg-slate-50 rounded-lg p-5 sticky top-24">
      <h3 className="font-semibold text-slate-900 mb-3">In This Article</h3>
      <ul className="space-y-2">
        {headings.map((heading, index) => (
          <li key={index}>
            <a
              href={`#${heading.id}`}
              className="text-sm text-slate-600 hover:text-blue-600 transition-colors flex items-center gap-2"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              {heading.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
