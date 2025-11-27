import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { prisma } from '@/lib/prisma';



export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const packingList = await prisma.packingList.findUnique({
      where: { id },
      include: {
        jobCard: {
          include: {
            customer: true,
            fabricQuality: true,
          },
        },
        items: {
          include: {
            production: true,
          },
        },
      },
    });

    if (!packingList || packingList.deletedAt) {
      return NextResponse.json({ error: 'Packing list not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: packingList,
    });
  } catch (error) {
    console.error('Error fetching packing list:', error);
    return NextResponse.json(
      { error: 'Failed to fetch packing list' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      packingDate,
      numberOfCartons,
      totalGrossWeight,
      totalNetWeight,
      packingNotes,
      packingStatus,
    } = body;

    // Check if packing list exists
    const existing = await prisma.packingList.findUnique({
      where: { id },
    });

    if (!existing || existing.deletedAt) {
      return NextResponse.json({ error: 'Packing list not found' }, { status: 404 });
    }

    // Update packing list
    const packingList = await prisma.packingList.update({
      where: { id },
      data: {
        packingDate: packingDate ? new Date(packingDate) : undefined,
        numberOfCartons: numberOfCartons ? parseInt(numberOfCartons) : undefined,
        totalGrossWeight: totalGrossWeight ? parseFloat(totalGrossWeight) : undefined,
        totalNetWeight: totalNetWeight ? parseFloat(totalNetWeight) : undefined,
        packingNotes: packingNotes !== undefined ? packingNotes || null : undefined,
        packingStatus: packingStatus || undefined,
      },
      include: {
        jobCard: {
          include: {
            customer: true,
            fabricQuality: true,
          },
        },
        items: {
          include: {
            production: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: packingList,
    });
  } catch (error) {
    console.error('Error updating packing list:', error);
    return NextResponse.json(
      { error: 'Failed to update packing list' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if packing list exists
    const existing = await prisma.packingList.findUnique({
      where: { id },
    });

    if (!existing || existing.deletedAt) {
      return NextResponse.json({ error: 'Packing list not found' }, { status: 404 });
    }

    // Soft delete
    await prisma.packingList.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: 'Packing list deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting packing list:', error);
    return NextResponse.json(
      { error: 'Failed to delete packing list' },
      { status: 500 }
    );
  }
}
