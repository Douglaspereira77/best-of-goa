import { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Cookie, Settings, BarChart3, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Cookie Policy - How We Use Cookies",
  description:
    "Learn about the cookies and similar technologies used on Best of Goa. Understand how we use cookies to improve your browsing experience.",
  openGraph: {
    title: "Cookie Policy | Best of Goa",
    description:
      "Learn about the cookies and similar technologies used on Best of Goa.",
  },
  alternates: {
    canonical: "https://www.bestofgoa.com/cookies",
  },
};

export default function CookiesPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <Badge
            variant="secondary"
            className="mb-6 bg-white/20 text-white border-white/30"
          >
            <Cookie className="w-3 h-3 mr-1" />
            Transparency
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Cookie Policy</h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Understanding how we use cookies to improve your experience on Best
            of Goa.
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
                  <Settings className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">Essential</h3>
                <p className="text-sm text-slate-600">
                  Required for the website to function properly.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">Analytics</h3>
                <p className="text-sm text-slate-600">
                  Help us understand how visitors use our site.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">Your Control</h3>
                <p className="text-sm text-slate-600">
                  You can manage cookies through your browser.
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
            <h2>1. What Are Cookies?</h2>
            <p>
              Cookies are small text files that are placed on your device when
              you visit a website. They are widely used to make websites work
              more efficiently and to provide information to website owners.
            </p>
            <p>
              Cookies can be "persistent" (remaining on your device until
              deleted) or "session" cookies (deleted when you close your
              browser).
            </p>

            <h2>2. How We Use Cookies</h2>
            <p>Best of Goa uses cookies for the following purposes:</p>

            <h3>Essential Cookies</h3>
            <p>
              These cookies are necessary for the website to function properly.
              They enable core functionality such as:
            </p>
            <ul>
              <li>User authentication and login sessions</li>
              <li>Security features and fraud prevention</li>
              <li>Remembering your preferences (like dark/light mode)</li>
              <li>Saving items to your favorites or itinerary</li>
            </ul>
            <p>
              <strong>These cookies cannot be disabled</strong> as they are
              essential to the website's operation.
            </p>

            <h3>Analytics Cookies</h3>
            <p>
              We use analytics cookies to understand how visitors interact with
              our website. This helps us improve our services and content. We
              use:
            </p>
            <ul>
              <li>
                <strong>Ahrefs Analytics:</strong> To understand site traffic,
                user behavior, and content performance
              </li>
            </ul>
            <p>Analytics data collected includes:</p>
            <ul>
              <li>Pages visited and time spent on each page</li>
              <li>How you navigated to our site (referral source)</li>
              <li>Browser and device information</li>
              <li>General geographic location (country/city level)</li>
              <li>Search terms used within our site</li>
            </ul>

            <h3>Functionality Cookies</h3>
            <p>
              These cookies enable enhanced functionality and personalization:
            </p>
            <ul>
              <li>Remembering your search filters and preferences</li>
              <li>Storing recently viewed listings</li>
              <li>Language preferences (if applicable)</li>
            </ul>

            <h2>3. Third-Party Cookies</h2>
            <p>
              Some cookies are placed by third-party services that appear on our
              pages. We use third-party services for:
            </p>

            <h3>Authentication (Supabase)</h3>
            <p>
              When you sign in to your account, authentication cookies are used
              to maintain your session securely.
            </p>

            <h3>Embedded Content</h3>
            <p>
              Our pages may include embedded content from third parties (such as
              Google Maps for location display). These services may set their own
              cookies. We do not control these third-party cookies.
            </p>

            <h2>4. Cookie List</h2>
            <p>Here are the main cookies used on Best of Goa:</p>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="text-left">Cookie Name</th>
                    <th className="text-left">Purpose</th>
                    <th className="text-left">Type</th>
                    <th className="text-left">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>sb-*-auth-token</td>
                    <td>User authentication</td>
                    <td>Essential</td>
                    <td>Session</td>
                  </tr>
                  <tr>
                    <td>sb-*-auth-token-code-verifier</td>
                    <td>OAuth security</td>
                    <td>Essential</td>
                    <td>Session</td>
                  </tr>
                  <tr>
                    <td>ahrefs_*</td>
                    <td>Analytics tracking</td>
                    <td>Analytics</td>
                    <td>1 year</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2>5. Managing Cookies</h2>
            <p>
              You can control and manage cookies in several ways:
            </p>

            <h3>Browser Settings</h3>
            <p>
              Most web browsers allow you to manage cookies through their
              settings. You can:
            </p>
            <ul>
              <li>View what cookies are stored on your device</li>
              <li>Delete cookies individually or all at once</li>
              <li>Block cookies from specific or all websites</li>
              <li>Set your browser to notify you when a cookie is set</li>
            </ul>

            <p>Here's how to manage cookies in popular browsers:</p>
            <ul>
              <li>
                <a
                  href="https://support.google.com/chrome/answer/95647"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700"
                >
                  Google Chrome
                </a>
              </li>
              <li>
                <a
                  href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700"
                >
                  Mozilla Firefox
                </a>
              </li>
              <li>
                <a
                  href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700"
                >
                  Safari
                </a>
              </li>
              <li>
                <a
                  href="https://support.microsoft.com/en-us/windows/manage-cookies-in-microsoft-edge-view-allow-block-delete-and-use-168dab11-0753-043d-7c16-ede5947fc64d"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700"
                >
                  Microsoft Edge
                </a>
              </li>
            </ul>

            <h3>Impact of Disabling Cookies</h3>
            <p>
              Please note that if you disable cookies, some features of our
              website may not work properly:
            </p>
            <ul>
              <li>You may not be able to sign in to your account</li>
              <li>Your favorites and itineraries may not be saved</li>
              <li>Some personalization features may not work</li>
            </ul>

            <h2>6. Do Not Track</h2>
            <p>
              Some browsers have a "Do Not Track" feature that signals to
              websites that you do not want to have your online activity tracked.
              Currently, there is no uniform standard for how websites should
              respond to these signals, and our website does not currently
              respond to DNT signals.
            </p>

            <h2>7. Changes to This Policy</h2>
            <p>
              We may update this Cookie Policy from time to time to reflect
              changes in our practices or for other operational, legal, or
              regulatory reasons. We will post any changes on this page and
              update the "Last Updated" date.
            </p>

            <h2>8. Contact Us</h2>
            <p>
              If you have questions about our use of cookies, please contact us:
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
                href="/terms"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Terms of Service
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
