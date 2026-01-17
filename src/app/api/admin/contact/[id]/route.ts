import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - Fetch single contact submission
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createClient();

    const { data, error } = await supabase
      .from("contact_submissions")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching contact submission:", error);
      return NextResponse.json(
        { error: "Contact submission not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ submission: data });
  } catch (error) {
    console.error("Error in GET contact:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// PATCH - Update contact submission status/notes
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createClient();
    const body = await request.json();

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.status) {
      const validStatuses = ["new", "read", "responded", "archived"];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: "Invalid status" },
          { status: 400 }
        );
      }
      updateData.status = body.status;
    }

    if (body.admin_notes !== undefined) {
      updateData.admin_notes = body.admin_notes;
    }

    const { data, error } = await supabase
      .from("contact_submissions")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating contact submission:", error);
      return NextResponse.json(
        { error: "Failed to update contact submission" },
        { status: 500 }
      );
    }

    return NextResponse.json({ submission: data });
  } catch (error) {
    console.error("Error in PATCH contact:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// DELETE - Delete contact submission
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createClient();

    const { error } = await supabase
      .from("contact_submissions")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting contact submission:", error);
      return NextResponse.json(
        { error: "Failed to delete contact submission" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE contact:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
