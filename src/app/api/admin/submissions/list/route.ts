import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50");

    let query = supabase
      .from("business_submissions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    if (search) {
      query = query.or(
        `business_name.ilike.%${search}%,submitter_name.ilike.%${search}%,submitter_email.ilike.%${search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching submissions:", error);
      return NextResponse.json(
        { error: "Failed to fetch submissions" },
        { status: 500 }
      );
    }

    // Get counts by status
    const { data: countData } = await supabase
      .from("business_submissions")
      .select("status");

    const counts = {
      all: countData?.length || 0,
      pending: countData?.filter((s) => s.status === "pending").length || 0,
      in_review: countData?.filter((s) => s.status === "in_review").length || 0,
      approved: countData?.filter((s) => s.status === "approved").length || 0,
      rejected: countData?.filter((s) => s.status === "rejected").length || 0,
    };

    return NextResponse.json({
      submissions: data || [],
      counts,
    });
  } catch (error) {
    console.error("Error in submissions list:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
