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

    const yarnStock = await prisma.yarnStockJobCard.findUnique({
      where: { id },
      include: {
        jobCard: {
          include: {
            customer: true,
            fabricQuality: true,
          },
        },
        stockRef: {
          include: {
            yarnType: true,
          },
        },
      },
    });

    if (!yarnStock || yarnStock.deletedAt) {
      return NextResponse.json({ error: 'Yarn stock not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: yarnStock,
    });
  } catch (error) {
    console.error('Error fetching yarn stock:', error);
    return NextResponse.json(
      { error: 'Failed to fetch yarn stock' },
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
      quantityReceived,
      quantityUsed,
      quantityLoss,
      receivedDate,
      lotNumber,
      notes,
    } = body;

    // Check if yarn stock exists
    const existing = await prisma.yarnStockJobCard.findUnique({
      where: { id },
    });

    if (!existing || existing.deletedAt) {
      return NextResponse.json({ error: 'Yarn stock not found' }, { status: 404 });
    }

    // Update yarn stock
    const yarnStock = await prisma.yarnStockJobCard.update({
      where: { id },
      data: {
        quantityReceived: quantityReceived ? parseFloat(quantityReceived) : undefined,
        quantityUsed: quantityUsed ? parseFloat(quantityUsed) : undefined,
        quantityLoss: quantityLoss ? parseFloat(quantityLoss) : undefined,
        receivedDate: receivedDate ? new Date(receivedDate) : undefined,
        lotNumber: lotNumber !== undefined ? lotNumber || null : undefined,
        notes: notes !== undefined ? notes || null : undefined,
      },
      include: {
        jobCard: {
          include: {
            customer: true,
            fabricQuality: true,
          },
        },
        stockRef: {
          include: {
            yarnType: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: yarnStock,
    });
  } catch (error) {
    console.error('Error updating yarn stock:', error);
    return NextResponse.json(
      { error: 'Failed to update yarn stock' },
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

    // Check if yarn stock exists
    const existing = await prisma.yarnStockJobCard.findUnique({
      where: { id },
    });

    if (!existing || existing.deletedAt) {
      return NextResponse.json({ error: 'Yarn stock not found' }, { status: 404 });
    }

    // Soft delete
    await prisma.yarnStockJobCard.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: 'Yarn stock allocation deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting yarn stock:', error);
    return NextResponse.json(
      { error: 'Failed to delete yarn stock' },
      { status: 500 }
    );
  }
}
