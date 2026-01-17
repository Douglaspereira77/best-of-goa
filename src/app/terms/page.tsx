import { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Scale, Users, AlertTriangle } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service - Usage Guidelines",
  description:
    "Read the terms and conditions for using Best of Goa directory. Understand your rights and responsibilities when using our platform to discover places in Goa.",
  openGraph: {
    title: "Terms of Service | Best of Goa",
    description:
      "Read the terms and conditions for using Best of Goa directory.",
  },
  alternates: {
    canonical: "https://www.bestofgoa.com/terms",
  },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <Badge
            variant="secondary"
            className="mb-6 bg-white/20 text-white border-white/30"
          >
            <FileText className="w-3 h-3 mr-1" />
            Legal
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Terms of Service
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Please read these terms carefully before using Best of Goa.
          </p>
        </div>
      </section>

      {/* Last Updated */}
      <section className="py-6 bg-slate-50 border-b">
        <div className="container mx-auto px-4">
          <p className="text-sm text-slate-600 text-center">
            Last Updated: December 3, 2025
          </p>
        </div>
      </section>

      {/* Quick Overview */}
      <section className="py-12 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="border-0 shadow-md">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Scale className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">Fair Use</h3>
                <p className="text-sm text-slate-600">
                  Use our platform responsibly and respect others.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">Community</h3>
                <p className="text-sm text-slate-600">
                  Help us maintain accurate and helpful information.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="font-semibold mb-2">Accuracy</h3>
                <p className="text-sm text-slate-600">
                  Information is for guidance; always verify with businesses.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto prose prose-slate prose-lg">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using Best of Goa (bestofgoa.com), you
              accept and agree to be bound by these Terms of Service. If you do
              not agree to these terms, please do not use our website.
            </p>

            <h2>2. Description of Service</h2>
            <p>
              Best of Goa is a directory platform that provides information
              about restaurants, hotels, malls, attractions, schools, and fitness
              centers in Goa. Our services include:
            </p>
            <ul>
              <li>Business listings with details, photos, and contact information</li>
              <li>Search and filtering functionality</li>
              <li>User accounts for saving favorites and creating itineraries</li>
              <li>Business submission forms for adding new listings</li>
              <li>Contact forms for general inquiries</li>
            </ul>

            <h2>3. User Accounts</h2>
            <p>
              To access certain features (such as saving favorites or creating
              itineraries), you may need to create an account. You agree to:
            </p>
            <ul>
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Notify us immediately of any unauthorized access</li>
            </ul>

            <h2>4. Acceptable Use</h2>
            <p>When using Best of Goa, you agree NOT to:</p>
            <ul>
              <li>
                Submit false, misleading, or fraudulent information
              </li>
              <li>
                Scrape, harvest, or collect data without permission
              </li>
              <li>
                Attempt to gain unauthorized access to our systems
              </li>
              <li>
                Use the platform for any unlawful purpose
              </li>
              <li>
                Interfere with the proper functioning of the website
              </li>
              <li>
                Post spam, malware, or malicious content
              </li>
              <li>
                Impersonate others or misrepresent your affiliation
              </li>
            </ul>

            <h2>5. Business Submissions</h2>
            <p>
              When submitting a business listing through our application form:
            </p>
            <ul>
              <li>
                You represent that you have the authority to submit information
                about the business
              </li>
              <li>
                You agree that the information provided is accurate and not
                misleading
              </li>
              <li>
                We reserve the right to review, edit, or reject any submission
              </li>
              <li>
                Submission does not guarantee listing on our platform
              </li>
            </ul>

            <h2>6. Content and Accuracy</h2>
            <p>
              While we strive to provide accurate and up-to-date information:
            </p>
            <ul>
              <li>
                <strong>No Warranty:</strong> We do not guarantee the accuracy,
                completeness, or reliability of any information on our platform
              </li>
              <li>
                <strong>Third-Party Information:</strong> Much of our content is
                sourced from third parties and may change without notice
              </li>
              <li>
                <strong>Verify Before Visiting:</strong> We recommend contacting
                businesses directly to confirm details such as opening hours,
                prices, and availability
              </li>
              <li>
                <strong>Report Errors:</strong> If you find inaccurate
                information, please{" "}
                <Link
                  href="/contact"
                  className="text-blue-600 hover:text-blue-700"
                >
                  contact us
                </Link>{" "}
                so we can correct it
              </li>
            </ul>

            <h2>7. Intellectual Property</h2>
            <p>
              All content on Best of Goa, including but not limited to text,
              graphics, logos, images, and software, is the property of Best of
              Goa or its content suppliers and is protected by copyright and
              other intellectual property laws.
            </p>
            <p>You may:</p>
            <ul>
              <li>View and print pages for personal, non-commercial use</li>
              <li>Share links to our content</li>
            </ul>
            <p>You may NOT:</p>
            <ul>
              <li>
                Reproduce, distribute, or republish content without permission
              </li>
              <li>Use our content for commercial purposes without authorization</li>
              <li>Remove any copyright or proprietary notices</li>
            </ul>

            <h2>8. Third-Party Links</h2>
            <p>
              Our website contains links to third-party websites, including
              business websites, social media pages, and booking platforms. We:
            </p>
            <ul>
              <li>Do not control or endorse these external sites</li>
              <li>Are not responsible for their content or practices</li>
              <li>
                Encourage you to review their terms and privacy policies
              </li>
            </ul>

            <h2>9. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, Best of Goa shall not be
              liable for any:
            </p>
            <ul>
              <li>
                Indirect, incidental, special, or consequential damages
              </li>
              <li>
                Loss of profits, data, or business opportunities
              </li>
              <li>
                Damages arising from your use of or inability to use our services
              </li>
              <li>
                Actions or inactions of businesses listed on our platform
              </li>
            </ul>
            <p>
              Our total liability shall not exceed the amount you paid to us (if
              any) in the 12 months preceding the claim.
            </p>

            <h2>10. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless Best of Goa, its
              officers, directors, employees, and agents from any claims,
              damages, losses, or expenses arising from:
            </p>
            <ul>
              <li>Your use of our services</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any rights of third parties</li>
            </ul>

            <h2>11. Termination</h2>
            <p>
              We may terminate or suspend your access to our services at any
              time, without prior notice, for conduct that we believe:
            </p>
            <ul>
              <li>Violates these Terms of Service</li>
              <li>Is harmful to other users or our business</li>
              <li>Is fraudulent or illegal</li>
            </ul>

            <h2>12. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. Changes
              will be effective immediately upon posting to this page. Your
              continued use of the website after changes constitutes acceptance
              of the new Terms.
            </p>

            <h2>13. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with
              the laws of Goa. Any disputes arising from these Terms shall be
              subject to the exclusive jurisdiction of the courts of Goa.
            </p>

            <h2>14. Contact Information</h2>
            <p>
              For questions about these Terms of Service, please contact us:
            </p>
            <ul>
              <li>
                Email:{" "}
                <a
                  href="mailto:info@bestofgoa.com"
                  className="text-blue-600 hover:text-blue-700"
                >
                  info@bestofgoa.com
                </a>
              </li>
              <li>
                Contact Form:{" "}
                <Link
                  href="/contact"
                  className="text-blue-600 hover:text-blue-700"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Related Links */}
      <section className="py-12 bg-slate-50 border-t">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="font-semibold mb-4">Related Policies</h3>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/privacy"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Privacy Policy
              </Link>
              <span className="text-slate-300">|</span>
              <Link
                href="/cookies"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Cookie Policy
              </Link>
              <span className="text-slate-300">|</span>
              <Link
                href="/contact"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
