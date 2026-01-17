'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
} from 'lucide-react';

export function HomeFooter() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to subscribe');
        return;
      }

      setSuccess(true);
      setEmail('');
      setTimeout(() => setSuccess(false), 5000);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="border-t bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <Image
              src="/BrandAssets/logo-dark.png"
              alt="Best of Goa"
              width={200}
              height={64}
              className="h-16 w-auto"
            />
            <p className="text-slate-400 text-sm">
              Your trusted guide to Goa's finest places. Discover top-rated restaurants,
              hotels, beaches, and attractions.
            </p>
            {/* Social Links */}
            <div className="flex items-center space-x-4">
              <a
                href="https://instagram.com/bestofgoa"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://facebook.com/bestofgoa"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com/bestofgoa"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-white transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://linkedin.com/company/bestofgoa"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-white transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/application" className="hover:text-white transition-colors">
                  Submit Business
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-white transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold mb-4">Categories</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link href="/places-to-eat" className="hover:text-white transition-colors">
                  Places to Eat
                </Link>
              </li>
              <li>
                <Link href="/places-to-stay" className="hover:text-white transition-colors">
                  Places to Stay
                </Link>
              </li>
              <li>
                <Link href="/places-to-shop" className="hover:text-white transition-colors">
                  Places to Shop
                </Link>
              </li>
              <li>
                <Link href="/places-to-visit" className="hover:text-white transition-colors">
                  Places to Visit
                </Link>
              </li>
              <li>
                <Link href="/places-to-learn" className="hover:text-white transition-colors">
                  Places to Learn
                </Link>
              </li>
              <li>
                <Link href="/things-to-do" className="hover:text-white transition-colors">
                  Things to Do
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter & Legal */}
          <div>
            <h3 className="font-semibold mb-4">Stay Updated</h3>
            <p className="text-sm text-slate-400 mb-4">
              Subscribe to our newsletter for the latest updates and recommendations.
            </p>
            {success ? (
              <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 text-green-400 text-sm mb-6">
                Subscribed successfully!
              </div>
            ) : (
              <div className="flex flex-col space-y-2 mb-6">
                <Input
                  type="email"
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  disabled={loading}
                />
                <Button
                  type="button"
                  size="sm"
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Subscribe'
                  )}
                </Button>
                {error && (
                  <p className="text-red-400 text-xs">{error}</p>
                )}
              </div>
            )}

            <h3 className="font-semibold mb-4 mt-6">Legal</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:text-white transition-colors">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8 bg-slate-800" />

        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-slate-400">
          <p>&copy; 2026 Best of Goa. All rights reserved.</p>
          <p className="mt-4 md:mt-0">
            Built with Next.js, TypeScript, and shadcn/ui
          </p>
        </div>
      </div>
    </footer>
  );
}
