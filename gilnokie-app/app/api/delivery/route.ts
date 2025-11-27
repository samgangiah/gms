import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { prisma } from '@/lib/prisma';



export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const jobCardId = searchParams.get('jobCardId');
    const status = searchParams.get('status');

    const where: any = {
      deletedAt: null,
    };

    if (jobCardId) {
      where.jobCardId = jobCardId;
    }

    if (status) {
      where.deliveryStatus = status;
    }

    const deliveries = await prisma.delivery.findMany({
      where,
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: deliveries,
    });
  } catch (error) {
    console.error('Error fetching deliveries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deliveries' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      jobCardId,
      deliveryDate,
      scheduledDeliveryDate,
      deliveryMethod,
      deliveryAddress,
      courierName,
      trackingNumber,
      deliveryNotes,
      deliveryStatus,
      packingListIds,
    } = body;

    // Validate required fields
    if (!jobCardId || !deliveryMethod || !deliveryAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: jobCardId, deliveryMethod, deliveryAddress' },
        { status: 400 }
      );
    }

    // Verify job card exists
    const jobCard = await prisma.customerOrder.findUnique({
      where: { id: jobCardId },
    });

    if (!jobCard) {
      return NextResponse.json({ error: 'Job card not found' }, { status: 404 });
    }

    // Generate delivery note number (DN-YYYYMMDD-XXX)
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');

    const todayCount = await prisma.delivery.count({
      where: {
        deliveryNoteNumber: {
          startsWith: `DN-${dateStr}`,
        },
      },
    });

    const deliveryNoteNumber = `DN-${dateStr}-${String(todayCount + 1).padStart(3, '0')}`;

    // Create delivery record
    const delivery = await prisma.delivery.create({
      data: {
        deliveryNoteNumber,
        jobCardId,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        scheduledDeliveryDate: scheduledDeliveryDate
          ? new Date(scheduledDeliveryDate)
          : null,
        deliveryMethod,
        deliveryAddress,
        courierName: courierName || null,
        trackingNumber: trackingNumber || null,
        deliveryNotes: deliveryNotes || null,
        deliveryStatus: deliveryStatus || 'pending',
        packingLists: packingListIds?.length
          ? {
              connect: packingListIds.map((id: string) => ({ id })),
            }
          : undefined,
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

    return NextResponse.json({
      success: true,
      data: delivery,
    });
  } catch (error) {
    console.error('Error creating delivery:', error);
    return NextResponse.json(
      { error: 'Failed to create delivery' },
      { status: 500 }
    );
  }
}
