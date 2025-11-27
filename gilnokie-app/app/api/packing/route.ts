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
      where.packingStatus = status;
    }

    const packingRecords = await prisma.packingList.findMany({
      where,
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
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: packingRecords,
    });
  } catch (error) {
    console.error('Error fetching packing records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch packing records' },
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
      packingDate,
      numberOfCartons,
      totalGrossWeight,
      totalNetWeight,
      packingNotes,
      packingStatus,
      productionIds,
    } = body;

    // Validate required fields
    if (!jobCardId || !numberOfCartons || !totalNetWeight) {
      return NextResponse.json(
        { error: 'Missing required fields: jobCardId, numberOfCartons, totalNetWeight' },
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

    // Generate packing list number (PL-YYYYMMDD-XXX)
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');

    const todayCount = await prisma.packingList.count({
      where: {
        packingListNumber: {
          startsWith: `PL-${dateStr}`,
        },
      },
    });

    const packingListNumber = `PL-${dateStr}-${String(todayCount + 1).padStart(3, '0')}`;

    // Create packing list with items
    const packingList = await prisma.packingList.create({
      data: {
        packingListNumber,
        jobCardId,
        packingDate: packingDate ? new Date(packingDate) : new Date(),
        numberOfCartons: parseInt(numberOfCartons),
        totalGrossWeight: totalGrossWeight ? parseFloat(totalGrossWeight) : null,
        totalNetWeight: parseFloat(totalNetWeight),
        packingNotes: packingNotes || null,
        packingStatus: packingStatus || 'pending',
        items: productionIds?.length
          ? {
              create: productionIds.map((prodId: string) => ({
                productionId: prodId,
              })),
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
    console.error('Error creating packing list:', error);
    return NextResponse.json(
      { error: 'Failed to create packing list' },
      { status: 500 }
    );
  }
}
