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

    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: {
        jobCard: {
          include: {
            customer: true,
            fabricQuality: true,
          },
        },
        packingLists: {
          include: {
            items: {
              include: {
                production: true,
              },
            },
          },
        },
      },
    });

    if (!delivery || delivery.deletedAt) {
      return NextResponse.json({ error: 'Delivery not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: delivery,
    });
  } catch (error) {
    console.error('Error fetching delivery:', error);
    return NextResponse.json(
      { error: 'Failed to fetch delivery' },
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
      deliveryDate,
      scheduledDeliveryDate,
      deliveryMethod,
      deliveryAddress,
      courierName,
      trackingNumber,
      deliveryNotes,
      deliveryStatus,
    } = body;

    // Check if delivery exists
    const existing = await prisma.delivery.findUnique({
      where: { id },
    });

    if (!existing || existing.deletedAt) {
      return NextResponse.json({ error: 'Delivery not found' }, { status: 404 });
    }

    // Update delivery
    const delivery = await prisma.delivery.update({
      where: { id },
      data: {
        deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
        scheduledDeliveryDate: scheduledDeliveryDate
          ? new Date(scheduledDeliveryDate)
          : undefined,
        deliveryMethod: deliveryMethod || undefined,
        deliveryAddress: deliveryAddress || undefined,
        courierName: courierName !== undefined ? courierName || null : undefined,
        trackingNumber: trackingNumber !== undefined ? trackingNumber || null : undefined,
        deliveryNotes: deliveryNotes !== undefined ? deliveryNotes || null : undefined,
        deliveryStatus: deliveryStatus || undefined,
      },
      include: {
        jobCard: {
          include: {
            customer: true,
            fabricQuality: true,
          },
        },
        packingLists: {
          include: {
            items: {
              include: {
                production: true,
              },
            },
          },
        },
      },
    });

    // If delivery is marked as delivered, update job card status to completed
    if (deliveryStatus === 'delivered' && existing.deliveryStatus !== 'delivered') {
      await prisma.customerOrder.update({
        where: { id: delivery.jobCardId },
        data: { status: 'completed' },
      });
    }

    return NextResponse.json({
      success: true,
      data: delivery,
    });
  } catch (error) {
    console.error('Error updating delivery:', error);
    return NextResponse.json(
      { error: 'Failed to update delivery' },
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

    // Check if delivery exists
    const existing = await prisma.delivery.findUnique({
      where: { id },
    });

    if (!existing || existing.deletedAt) {
      return NextResponse.json({ error: 'Delivery not found' }, { status: 404 });
    }

    // Soft delete
    await prisma.delivery.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: 'Delivery deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting delivery:', error);
    return NextResponse.json(
      { error: 'Failed to delete delivery' },
      { status: 500 }
    );
  }
}
