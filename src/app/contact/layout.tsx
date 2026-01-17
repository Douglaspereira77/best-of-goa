import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | Get in Touch with Best of Goa",
  description:
    "Have questions or feedback? Contact the Best of Goa team. We're here to help you discover Goa's finest places.",
  openGraph: {
    title: "Contact Best of Goa",
    description:
      "Reach out to our team with questions or feedback about Goa's best places.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Best of Goa",
    description: "Reach out to our team with questions or feedback.",
  },
  alternates: {
    canonical: "https://www.bestofgoa.com/contact",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
