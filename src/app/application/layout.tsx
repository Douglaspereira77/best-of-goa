import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Submit Your Business | Add a Place to Best of Goa",
  description:
    "Submit your restaurant, hotel, mall or gym to Best of Goa. Get discovered by thousands across Goa.",
  openGraph: {
    title: "Submit Your Business to Best of Goa",
    description:
      "Get your business featured on Goa's most trusted directory.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Submit Your Business to Best of Goa",
    description: "Get your business featured on Goa's most trusted directory.",
  },
  alternates: {
    canonical: "https://www.bestofgoa.com/application",
  },
};

export default function ApplicationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
