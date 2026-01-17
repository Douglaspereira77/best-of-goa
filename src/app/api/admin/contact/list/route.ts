import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status");
    const search = searchParams.get("search");

    // Build query
    let query = supabase
      .from("contact_submissions")
      .select("*")
      .order("created_at", { ascending: false });

    // Apply status filter
    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    // Apply search filter
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,email.ilike.%${search}%,subject.ilike.%${search}%`
      );
    }

    const { data: submissions, error } = await query;

    if (error) {
      console.error("Error fetching contact submissions:", error);
      return NextResponse.json(
        { error: "Failed to fetch contact submissions" },
        { status: 500 }
      );
    }

    // Get counts for all statuses
    const { data: allData } = await supabase
      .from("contact_submissions")
      .select("status");

    const counts = {
      all: allData?.length || 0,
      new: allData?.filter((s) => s.status === "new").length || 0,
      read: allData?.filter((s) => s.status === "read").length || 0,
      responded: allData?.filter((s) => s.status === "responded").length || 0,
      archived: allData?.filter((s) => s.status === "archived").length || 0,
    };

    return NextResponse.json({
      submissions: submissions || [],
      counts,
    });
  } catch (error) {
    console.error("Error in contact list API:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
