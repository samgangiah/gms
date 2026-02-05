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
    const active = searchParams.get('active');

    const fabricQualities = await prisma.fabricQuality.findMany({
      where: active !== null ? { active: active === 'true' } : undefined,
      include: {
        fabricContent: {
          include: {
            yarnType: true,
          },
          orderBy: { position: 'asc' },
        },
      },
      orderBy: { qualityCode: 'asc' },
    });

    return NextResponse.json({ data: fabricQualities });
  } catch (error) {
    console.error('GET /api/fabric-quality error:', error);
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

    const fabricQuality = await prisma.fabricQuality.create({
      data: {
        qualityCode: body.qualityCode,
        description: body.description || null,
        greigeDimensions: body.greigeDimensions || null,
        finishedDimensions: body.finishedDimensions || null,
        greigeDensity: body.greigeDensity || null,
        finishedDensity: body.finishedDensity || null,
        greigeWidth: body.greigeWidth || null,
        greigeWeight: body.greigeWeight || null,
        finishedWidth: body.finishedWidth || null,
        finishedWeight: body.finishedWeight || null,
        percentageLoss: body.percentageLoss || null,
        fabricType: body.fabricType || null,
        texCount: body.texCount || null,
        metersPerKg: body.metersPerKg || null,
        width: body.width || null,
        weight: body.weight || null,
        machineGauge: body.machineGauge || null,
        machineType: body.machineType || null,
        specSheetRef: body.specSheetRef || null,
        slittingRequired: body.slittingRequired || false,
        active: body.active ?? true,
      },
    });

    return NextResponse.json({ data: fabricQuality }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/fabric-quality error:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Quality code already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
