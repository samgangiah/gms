import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.jobCardId) {
      return NextResponse.json(
        { error: 'jobCardId is required' },
        { status: 400 }
      );
    }

    if (!body.machineNumber) {
      return NextResponse.json(
        { error: 'machineNumber is required for piece number generation' },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.rolls) || body.rolls.length === 0) {
      return NextResponse.json(
        { error: 'rolls array is required and must contain at least one item' },
        { status: 400 }
      );
    }

    // Validate that each roll has a weight
    if (body.rolls.some((roll: any) => typeof roll.weight !== 'number' || roll.weight <= 0)) {
      return NextResponse.json(
        { error: 'Each roll must have a valid weight (positive number)' },
        { status: 400 }
      );
    }

    // Validate job card exists
    const jobCard = await prisma.customerOrder.findUnique({
      where: { id: body.jobCardId },
      select: { jobCardNumber: true },
    });

    if (!jobCard) {
      return NextResponse.json(
        { error: 'Job card not found' },
        { status: 404 }
      );
    }

    // Extract machine number from "Machine X" and multiply by 100
    // e.g., Machine 1 = 100, Machine 8 = 800
    const machineMatch = (body.machineNumber || '').match(/(\d+)/);
    const machinePrefix = machineMatch ? String(parseInt(machineMatch[1], 10) * 100) : '000';

    // Extract job card number from job card number (JC-YYYYMMDD-XXX)
    const jobNumberMatch = jobCard.jobCardNumber.match(/-(\d+)$/);
    const jobNumber = jobNumberMatch ? jobNumberMatch[1].padStart(4, '0') : '0001';
    const piecePrefix = `${machinePrefix}${jobNumber}-`;

    // Find the highest existing piece number for this prefix to avoid race conditions
    const lastPiece = await prisma.productionInfo.findFirst({
      where: {
        pieceNumber: { startsWith: piecePrefix },
      },
      orderBy: { pieceNumber: 'desc' },
      select: { pieceNumber: true },
    });

    let nextNumber = 1;
    if (lastPiece) {
      const match = lastPiece.pieceNumber.match(/-(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    // Combine date and time into proper DateTime for productionTime
    let productionTimeDate: Date | null = null;
    if (body.productionTime && body.productionDate) {
      // productionTime is in format "HH:mm" (e.g., "15:52")
      productionTimeDate = new Date(`${body.productionDate}T${body.productionTime}:00`);
      // Check if the date is valid
      if (isNaN(productionTimeDate.getTime())) {
        productionTimeDate = null;
      }
    }

    // Prepare all production entries with sequential piece numbers
    const productionEntries = body.rolls.map((roll: any, index: number) => ({
      pieceNumber: `${piecePrefix}${String(nextNumber + index).padStart(3, '0')}`,
      jobCardId: body.jobCardId,
      weight: roll.weight,
      productionDate: new Date(body.productionDate),
      productionTime: productionTimeDate,
      machineNumber: body.machineNumber || null,
      operatorName: body.operatorName || null,
      qualityGrade: body.qualityGrade || null,
      notes: body.notes || null,
    }));

    // Create all production entries in a single transaction
    const createdProduction = await prisma.$transaction(
      productionEntries.map((entry) =>
        prisma.productionInfo.create({
          data: entry,
          include: {
            jobCard: {
              include: {
                customer: true,
                fabricQuality: true,
              },
            },
          },
        })
      )
    );

    return NextResponse.json({ data: createdProduction }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/production/bulk error:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'One or more piece numbers already exist' },
        { status: 409 }
      );
    }

    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Invalid job card' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
