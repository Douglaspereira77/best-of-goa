import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { Resend } from "resend";

// Lazy Resend initialization
function getResend() {
  return process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;
}

interface NewsletterBody {
  email: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: NewsletterBody = await request.json();

    // Validate email
    if (!body.email?.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const email = body.email.trim().toLowerCase();

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
    }

    if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

    // Check if already subscribed in Firestore
    const subscriberRef = adminDb.collection("newsletter_subscribers").doc(email);
    const doc = await subscriberRef.get();

    if (doc.exists) {
      const data = doc.data();
      if (data?.status === "active") {
        return NextResponse.json({ error: "This email is already subscribed" }, { status: 400 });
      }
      // Reactivate
      await subscriberRef.update({
        status: "active",
        updated_at: new Date().toISOString()
      });
    } else {
      // Create new subscriber
      await subscriberRef.set({
        email,
        status: "active",
        source: "homepage",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    // Send welcome email (logic remains same)
    const resend = getResend();
    if (resend) {
      try {
        await resend.emails.send({
          from: "Best of Goa <noreply@bestofgoa.com>",
          to: [email],
          subject: "Welcome to Best of Goa Newsletter!",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #1e40af, #f59e0b); padding: 40px 20px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Best of Goa!</h1>
              </div>
              <div style="padding: 40px 30px; background: #f8fafc;">
                <p style="color: #1e293b; font-size: 16px; line-height: 1.6;">
                  Thank you for subscribing to our newsletter! You'll now receive Goa's best recommendations and hidden gems.
                </p>
                <div style="margin-top: 30px; text-align: center;">
                  <a href="https://www.bestofgoa.com" style="display: inline-block; background: #1e40af; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                    Explore Best of Goa
                  </a>
                </div>
              </div>
            </div>
          `,
        });
      } catch (e) {
        console.error("Failed to send welcome email:", e);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Successfully subscribed!",
    });

  } catch (error) {
    console.error("Newsletter error:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
