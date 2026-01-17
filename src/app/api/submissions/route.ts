import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

interface SubmissionBody {
  businessName: string;
  category: string;
  website?: string;
  googleMapsUrl?: string;
  address?: string;
  area?: string;
  governorate: string;
  phone?: string;
  email?: string;
  instagram?: string;
  submitterName: string;
  submitterEmail: string;
  submitterPhone?: string;
  relationship: string;
  description?: string;
  whyBest?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SubmissionBody = await request.json();

    // Basic Validation
    if (!body.businessName?.trim() || !body.category?.trim() || !body.submitterEmail?.trim()) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 500 });

    const submissionData = {
      business_name: body.businessName.trim(),
      category: body.category,
      website: body.website?.trim() || null,
      google_maps_url: body.googleMapsUrl?.trim() || null,
      address: body.address?.trim() || null,
      area: body.area?.trim() || null,
      governorate: body.governorate,
      phone: body.phone?.trim() || null,
      email: body.email?.trim() || null,
      instagram: body.instagram?.trim() || null,
      submitter_name: body.submitterName.trim(),
      submitter_email: body.submitterEmail.trim(),
      submitter_phone: body.submitterPhone?.trim() || null,
      relationship: body.relationship,
      description: body.description?.trim() || null,
      why_best: body.whyBest?.trim() || null,
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // user_id logic removed for now as we transition auth
    };

    const docRef = await adminDb.collection("business_submissions").add(submissionData);

    return NextResponse.json({
      success: true,
      message: "Application submitted successfully",
      id: docRef.id,
    });

  } catch (error) {
    console.error("Submission error:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
