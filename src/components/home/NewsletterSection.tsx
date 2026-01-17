'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Star } from 'lucide-react';

export function NewsletterSection() {
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
    <section className="py-10 md:py-16 bg-[#1e3a8a]">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-2">
              Welcome To
            </h2>
            <h2 className="text-4xl md:text-5xl font-bold text-amber-400 mb-6">
              Best of Goa
            </h2>
            <p className="text-amber-400 font-semibold uppercase tracking-wide mb-4">
              Subscribe
            </p>
            <p className="text-white/80 text-lg mb-8">
              Get the latest updates on new restaurants, hotels, and attractions
              in Goa delivered straight to your inbox.
            </p>

            {/* Email Signup */}
            <div className="max-w-md">
              {success ? (
                <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 text-green-300">
                  Thanks for subscribing! Check your inbox for a welcome email.
                </div>
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError('');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSubmit();
                        }
                      }}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 py-6"
                      disabled={loading}
                    />
                    <Button
                      className="bg-amber-500 hover:bg-amber-600 text-white px-8 py-6 w-full sm:w-auto"
                      onClick={handleSubmit}
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        'Subscribe'
                      )}
                    </Button>
                  </div>
                  {error && (
                    <p className="text-red-400 text-sm mt-2">{error}</p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Phone Mockup */}
          <div className="hidden md:flex justify-center">
            <div className="relative">
              <div className="w-64 h-[500px] bg-gradient-to-b from-white/10 to-white/5 rounded-[3rem] border-4 border-white/20 flex items-center justify-center">
                <div className="text-center text-white/50">
                  <Star className="w-16 h-16 mx-auto mb-4" />
                  <p className="font-semibold">App Coming Soon</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
