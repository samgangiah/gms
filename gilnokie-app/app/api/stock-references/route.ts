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

    const stockReferences = await prisma.yarnStockReference.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        yarnType: true,
      },
      orderBy: {
        stockReferenceNumber: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: stockReferences,
    });
  } catch (error) {
    console.error('Error fetching stock references:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock references' },
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
      yarnTypeId,
      currentQuantity,
      initialQuantity, // Accept both field names
      notes,
    } = body;

    // Use initialQuantity if currentQuantity not provided (field name compatibility)
    const quantity = currentQuantity ?? initialQuantity;

    // Validate required fields
    if (!yarnTypeId || quantity === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: yarnTypeId, currentQuantity' },
        { status: 400 }
      );
    }

    // Verify yarn type exists
    const yarnType = await prisma.yarnType.findUnique({
      where: { id: yarnTypeId },
    });

    if (!yarnType) {
      return NextResponse.json({ error: 'Yarn type not found' }, { status: 404 });
    }

    // Generate stock reference number (SR-YYYYMMDD-XXX)
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');

    const todayCount = await prisma.yarnStockReference.count({
      where: {
        stockReferenceNumber: {
          startsWith: `SR-${dateStr}`,
        },
      },
    });

    const stockReferenceNumber = `SR-${dateStr}-${String(todayCount + 1).padStart(3, '0')}`;

    // Create stock reference
    const stockReference = await prisma.yarnStockReference.create({
      data: {
        stockReferenceNumber,
        yarnTypeId,
        currentQuantity: parseFloat(quantity),
        stockDate: new Date(),
        notes: notes || null,
      },
      include: {
        yarnType: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: stockReference,
    });
  } catch (error) {
    console.error('Error creating stock reference:', error);
    return NextResponse.json(
      { error: 'Failed to create stock reference' },
      { status: 500 }
    );
  }
}
