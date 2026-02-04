import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const jobCardId = searchParams.get('jobCardId');
    const date = searchParams.get('date');

    const where: any = {};
    if (jobCardId) where.jobCardId = jobCardId;
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      where.productionDate = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const production = await prisma.productionInfo.findMany({
      where,
      include: {
        jobCard: {
          include: {
            customer: true,
            fabricQuality: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ data: production });
  } catch (error) {
    console.error('GET /api/production error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    // Generate piece number (format: YYJJJJJ-###)
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

    // Count existing pieces for this job card
    const pieceCount = await prisma.productionInfo.count({
      where: { jobCardId: body.jobCardId },
    });

    // Extract year and job number from job card number (JC-YYYYMMDD-XXX)
    const year = new Date().getFullYear().toString().slice(-2);
    const jobNumberMatch = jobCard.jobCardNumber.match(/-(\d+)$/);
    const jobNumber = jobNumberMatch ? jobNumberMatch[1].padStart(5, '0') : '00001';
    const pieceNumber = `${year}${jobNumber}-${String(pieceCount + 1).padStart(3, '0')}`;

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

    const production = await prisma.productionInfo.create({
      data: {
        pieceNumber,
        jobCardId: body.jobCardId,
        weight: body.weight,
        productionDate: new Date(body.productionDate),
        productionTime: productionTimeDate,
        machineNumber: body.machineNumber || null,
        operatorName: body.operatorName || null,
        qualityGrade: body.qualityGrade || null,
        notes: body.notes || null,
      },
      include: {
        jobCard: {
          include: {
            customer: true,
            fabricQuality: true,
          },
        },
      },
    });

    return NextResponse.json({ data: production }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/production error:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Piece number already exists' },
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
