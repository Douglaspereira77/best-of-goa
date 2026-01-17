import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/admin/malls/[id]
 *
 * Fetches mall data for review/edit page
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Mall ID is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    const { data: mall, error } = await supabase
      .from('malls')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !mall) {
      return NextResponse.json(
        { error: 'Mall not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      mall: mall
    });

  } catch (error) {
    console.error('Get mall error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/malls/[id]
 *
 * Updates mall data
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Mall ID is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Validate that the mall exists
    const { data: existingMall, error: fetchError } = await supabase
      .from('malls')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !existingMall) {
      return NextResponse.json(
        { error: 'Mall not found' },
        { status: 404 }
      );
    }

    // Filter out protected fields that shouldn't be updated directly
    const protectedFields = ['id', 'created_at', 'google_place_id'];
    const safeUpdates: any = {};

    for (const [key, value] of Object.entries(updates)) {
      if (!protectedFields.includes(key)) {
        safeUpdates[key] = value;
      }
    }

    // Add updated_at timestamp
    safeUpdates.updated_at = new Date().toISOString();

    const { data: updatedMall, error: updateError } = await supabase
      .from('malls')
      .update(safeUpdates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update mall' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      mall: updatedMall
    });

  } catch (error) {
    console.error('Update mall error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/malls/[id]
 *
 * Deletes a mall
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Mall ID is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    const { error } = await supabase
      .from('malls')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete error:', error);
      return NextResponse.json(
        { error: 'Failed to delete mall' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Mall deleted successfully'
    });

  } catch (error) {
    console.error('Delete mall error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
