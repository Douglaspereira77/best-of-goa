import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";

// Lazy Resend initialization
function getResend() {
  return process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;
}

interface ContactBody {
  name: string;
  email: string;
  reason: string;
  subject: string;
  message: string;
}

const reasonLabels: Record<string, string> = {
  general: "General Inquiry",
  suggestion: "Suggest a Place",
  correction: "Report an Error",
  partnership: "Partnership / Business",
  feedback: "Feedback",
  other: "Other",
};

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body: ContactBody = await request.json();

    // Validate required fields
    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    if (!body.email?.trim()) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email.trim())) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    if (!body.reason?.trim()) {
      return NextResponse.json(
        { error: "Please select a reason for contact" },
        { status: 400 }
      );
    }

    if (!body.subject?.trim()) {
      return NextResponse.json(
        { error: "Subject is required" },
        { status: 400 }
      );
    }

    if (!body.message?.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Validate reason
    const validReasons = [
      "general",
      "suggestion",
      "correction",
      "partnership",
      "feedback",
      "other",
    ];
    if (!validReasons.includes(body.reason)) {
      return NextResponse.json(
        { error: "Invalid reason for contact" },
        { status: 400 }
      );
    }

    // Insert into database
    const { data, error } = await supabase
      .from("contact_submissions")
      .insert({
        name: body.name.trim(),
        email: body.email.trim().toLowerCase(),
        reason: body.reason,
        subject: body.subject.trim(),
        message: body.message.trim(),
        status: "new",
      })
      .select()
      .single();

    if (error) {
      console.error("Error inserting contact submission:", error);
      return NextResponse.json(
        { error: "Failed to send message. Please try again." },
        { status: 500 }
      );
    }

    // Send email notification (if Resend is configured)
    const resend = getResend();
    if (resend) {
      try {
        await resend.emails.send({
          from: "Best of Goa <noreply@bestofgoa.com>",
          to: ["info@bestofgoa.com"],
          replyTo: body.email.trim().toLowerCase(),
          subject: `[Contact] ${reasonLabels[body.reason] || body.reason}: ${body.subject.trim()}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #2563eb, #7c3aed); padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">New Contact Form Submission</h1>
              </div>

              <div style="padding: 30px; background: #f8fafc;">
                <div style="background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                  <h2 style="color: #1e293b; margin-top: 0; font-size: 18px;">Contact Details</h2>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 8px 0; color: #64748b; width: 100px;">Name:</td>
                      <td style="padding: 8px 0; color: #1e293b; font-weight: 500;">${body.name.trim()}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #64748b;">Email:</td>
                      <td style="padding: 8px 0;"><a href="mailto:${body.email.trim()}" style="color: #2563eb;">${body.email.trim()}</a></td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #64748b;">Reason:</td>
                      <td style="padding: 8px 0;"><span style="background: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 4px; font-size: 14px;">${reasonLabels[body.reason] || body.reason}</span></td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #64748b;">Subject:</td>
                      <td style="padding: 8px 0; color: #1e293b; font-weight: 500;">${body.subject.trim()}</td>
                    </tr>
                  </table>
                </div>

                <div style="background: white; border-radius: 8px; padding: 20px;">
                  <h2 style="color: #1e293b; margin-top: 0; font-size: 18px;">Message</h2>
                  <p style="color: #475569; line-height: 1.6; white-space: pre-wrap;">${body.message.trim()}</p>
                </div>

                <div style="margin-top: 20px; text-align: center;">
                  <a href="https://www.bestofgoa.com/admin/contact" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">View in Admin Panel</a>
                </div>
              </div>

              <div style="padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
                <p>This email was sent from the Best of Goa contact form.</p>
              </div>
            </div>
          `,
        });
        console.log("Email notification sent successfully");
      } catch (emailError) {
        // Log error but don't fail the request - the submission is already saved
        console.error("Failed to send email notification:", emailError);
      }
    } else {
      console.log("Resend not configured - skipping email notification");
    }

    return NextResponse.json({
      success: true,
      message: "Message sent successfully",
      id: data.id,
    });
  } catch (error) {
    console.error("Error processing contact submission:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
