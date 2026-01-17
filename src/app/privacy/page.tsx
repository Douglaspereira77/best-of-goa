import { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Eye, Lock, Database, Globe, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy - How We Protect Your Data",
  description:
    "A straightforward privacy policy that actually makes sense. Find out what data we collect, how we use it, and what rights you haveâ€”written in plain English.",
  openGraph: {
    title: "Privacy Policy | Best of Goa",
    description:
      "A privacy policy you can actually understand. Plain English, no corporate speak.",
  },
  alternates: {
    canonical: "https://www.bestofgoa.com/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <Badge
            variant="secondary"
            className="mb-6 bg-white/20 text-white border-white/30"
          >
            <Shield className="w-3 h-3 mr-1" />
            Your Privacy Matters
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Your privacy matters to us. Here's exactly what we do with your informationâ€”no legal jargon, just straight talk.
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
                  <Eye className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">Transparency</h3>
                <p className="text-sm text-slate-600">
                  No hidden surprisesâ€”just clear explanations of what we collect and why.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">Security</h3>
                <p className="text-sm text-slate-600">
                  We keep your information locked down tight with modern security practices.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Database className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">Minimal Collection</h3>
                <p className="text-sm text-slate-600">
                  We only grab what we actually need. Nothing more, nothing less.
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
            <h2>1. Introduction</h2>
            <p>
              Welcome to Best of Goa! We run bestofgoa.com as your go-to guide for discovering the best places across Goa. This policy breaks down how we handle your information when you're browsing our site, creating favorites, or submitting business listings. Think of it as the fine print, but actually readable.
            </p>

            <h2>2. What Information Do We Collect?</h2>
            <h3>Stuff You Directly Share With Us</h3>
            <p>Sometimes you'll give us information directly. Here's when that happens:</p>
            <ul>
              <li>When you suggest a restaurant, hotel, or attraction through our submission form</li>
              <li>If you reach out via our contact page</li>
              <li>When you create an account (we use Google OAuth or email/password)</li>
              <li>Saving your favorite places or building custom itineraries</li>
              <li>Signing up for updates (if we ever add that feature)</li>
            </ul>
            <p>
              This typically means your name and emailâ€”plus whatever details you choose to include in your messages or business submissions. It's your call on how much to share.
            </p>

            <h3>The Automatic Stuff</h3>
            <p>
              Like most websites, we automatically pick up some basic tech info when you visit. Nothing creepyâ€”just standard analytics:
            </p>
            <ul>
              <li>What device and browser you're using (helps us fix bugs)</li>
              <li>Which pages you check out and how long you stick around</li>
              <li>Your approximate locationâ€”think city level, not your exact address</li>
              <li>Where you came from (Google search, Instagram link, etc.)</li>
            </ul>

            <h2>3. What Do We Do With Your Info?</h2>
            <p>Here's the honest truth about how we use what we collect:</p>
            <ul>
              <li>Keep the site running smoothly and actually useful</li>
              <li>Review business submissions and answer your questions</li>
              <li>Figure out what's working and what's not (so we can make things better)</li>
              <li>Occasionally send updatesâ€”but only if you've opted in</li>
              <li>Spot weird activity that might be spam or security threats</li>
              <li>Remember your favorites and itineraries when you log back in</li>
            </ul>

            <h2>4. Analytics & Cookies</h2>
            <p>
              We use tools like Ahrefs Analytics and Google Analytics to see how people actually use our site. These help us answer questions like "Are people finding what they're looking for?" and "Is this new feature actually helpful?"
            </p>
            <p>What does that mean in practice? These tools track things like:</p>
            <ul>
              <li>Which pages get the most love (and which ones... don't)</li>
              <li>What you're clicking on</li>
              <li>What people search for (helps us know what's missing)</li>
              <li>General location data (like "lots of visitors from Salmiya today")</li>
            </ul>
            <p>
              Want the technical details on cookies? Check out our{" "}
              <Link href="/cookies" className="text-blue-600 hover:text-blue-700">
                Cookie Policy
              </Link>{" "}
              where we break it all down.
            </p>

            <h2>5. Do We Share Your Information?</h2>
            <p>
              Let's be crystal clear: <strong>we don't sell your data. Period.</strong> We're not in that business.
            </p>
            <p>That said, we do share info in a few specific situations:</p>
            <ul>
              <li>
                <strong>With our tech partners:</strong> We use services like Supabase (database), Vercel (hosting), and email tools. They need access to do their jobs, but they're contractually required to keep your data safe.
              </li>
              <li>
                <strong>If legally required:</strong> Court orders, government investigationsâ€”the stuff we legally can't refuse.
              </li>
              <li>
                <strong>During a business change:</strong> If Best of Goa ever gets acquired or merges with another company, your data would transfer with the business. (We'd notify you if this happened.)
              </li>
            </ul>

            <h2>6. How Secure Is Your Data?</h2>
            <p>
              We take security seriously. Your data gets encrypted when it travels between your browser and our servers (that's the SSL/TLS encryption you see in the padlock icon). Our database sits behind authentication walls, and we limit who on our team can access what.
            </p>
            <p>
              Here's the honest part: no website can promise 100% security. The internet just doesn't work that way. But we use the same security standards as major banks and online services. If we ever detect a breach, you'll hear from us immediatelyâ€”not months later.
            </p>

            <h2>7. Your Rights (The Important Part!)</h2>
            <p>Your data, your rules. Here's what you can do:</p>
            <ul>
              <li><strong>See what we have:</strong> Request a copy of all the data we've collected about you</li>
              <li><strong>Fix mistakes:</strong> Tell us if something's wrong and we'll update it</li>
              <li><strong>Delete everything:</strong> Want out? We'll erase your account and associated data</li>
              <li><strong>Unsubscribe:</strong> Opt out of any emails with one click</li>
              <li><strong>Change your mind:</strong> Revoke permissions you previously gave us</li>
            </ul>
            <p>
              To exercise any of these rights, just shoot us an email at the address below. We'll respond within a few days (not weeks).
            </p>

            <h2>8. Links to Other Sites</h2>
            <p>
              Our site links out to restaurants, hotels, Instagram pages, Google Mapsâ€”you name it. Once you click through to one of those sites, you're on their turf. We can't control their privacy policies (though we wish more companies would write theirs like this one). Always worth checking their policies if you're concerned about how they handle data.
            </p>

            <h2>9. Kids & Privacy</h2>
            <p>
              Best of Goa isn't designed for kids under 13. We don't knowingly collect information from children, and if we discover we accidentally did, we'll delete it right away. Parents, if you notice something off, please let us know immediately.
            </p>

            <h2>10. Policy Updates</h2>
            <p>
              Privacy laws change. Our business evolves. When we need to update this policy, we'll post the new version here and change the "Last Updated" date at the top. For major changes, we'll send an email to registered users. No sneaky edits buried in fine print.
            </p>

            <h2>11. Questions? Reach Out.</h2>
            <p>
              Got questions about this policy? Concerned about your data? Want to exercise one of your rights? We're here to help.
            </p>
            <ul>
              <li>
                <strong>Email us:</strong>{" "}
                <a
                  href="mailto:info@bestofgoa.com"
                  className="text-blue-600 hover:text-blue-700"
                >
                  info@bestofgoa.com
                </a>
              </li>
              <li>
                <strong>Use our contact form:</strong>{" "}
                <Link
                  href="/contact"
                  className="text-blue-600 hover:text-blue-700"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
            <p>
              We're a small team, but we read every message. You'll get a real response from a real personâ€”usually within 24-48 hours.
            </p>
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
                href="/terms"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Terms of Service
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
