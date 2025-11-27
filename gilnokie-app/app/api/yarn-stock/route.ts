import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase-server';

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
    const stockRefId = searchParams.get('stockRefId');

    const where: any = {
      deletedAt: null,
    };

    if (jobCardId) {
      where.jobCardId = jobCardId;
    }

    if (stockRefId) {
      where.stockRefId = stockRefId;
    }

    const yarnStock = await prisma.yarnStockJobCard.findMany({
      where,
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
      orderBy: {
        createdAt: 'desc',
      },
    });

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
      stockRefId,
      quantityReceived,
      quantityUsed,
      quantityLoss,
      receivedDate,
      lotNumber,
      notes,
    } = body;

    // Validate required fields
    if (!jobCardId || !stockRefId || !quantityReceived) {
      return NextResponse.json(
        { error: 'Missing required fields: jobCardId, stockRefId, quantityReceived' },
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

    // Verify stock reference exists
    const stockRef = await prisma.yarnStockReference.findUnique({
      where: { id: stockRefId },
    });

    if (!stockRef) {
      return NextResponse.json({ error: 'Stock reference not found' }, { status: 404 });
    }

    // Create yarn stock allocation
    const yarnStock = await prisma.yarnStockJobCard.create({
      data: {
        jobCardId,
        stockRefId,
        quantityReceived: parseFloat(quantityReceived),
        quantityUsed: parseFloat(quantityUsed || 0),
        quantityLoss: parseFloat(quantityLoss || 0),
        receivedDate: receivedDate ? new Date(receivedDate) : new Date(),
        lotNumber: lotNumber || null,
        notes: notes || null,
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

    // Update yarn allocation status on job card if this is first allocation
    const allocationCount = await prisma.yarnStockJobCard.count({
      where: {
        jobCardId,
        deletedAt: null,
      },
    });

    if (allocationCount === 1 && jobCard.yarnAllocationStatus === 'pending') {
      await prisma.customerOrder.update({
        where: { id: jobCardId },
        data: { yarnAllocationStatus: 'partial' },
      });
    }

    return NextResponse.json({
      success: true,
      data: yarnStock,
    });
  } catch (error) {
    console.error('Error creating yarn stock allocation:', error);
    return NextResponse.json(
      { error: 'Failed to create yarn stock allocation' },
      { status: 500 }
    );
  }
}
