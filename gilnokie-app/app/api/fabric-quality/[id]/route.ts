import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
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

    const fabricQuality = await prisma.fabricQuality.findUnique({
      where: { id },
      include: {
        fabricContent: {
          include: {
            yarnType: true,
          },
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!fabricQuality) {
      return NextResponse.json(
        { error: 'Fabric quality not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: fabricQuality });
  } catch (error) {
    console.error('GET /api/fabric-quality/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
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

    const fabricQuality = await prisma.fabricQuality.update({
      where: { id },
      data: {
        qualityCode: body.qualityCode,
        description: body.description,
        greigeDimensions: body.greigeDimensions,
        finishedDimensions: body.finishedDimensions,
        greigeDensity: body.greigeDensity,
        finishedDensity: body.finishedDensity,
        width: body.width,
        weight: body.weight,
        machineGauge: body.machineGauge,
        machineType: body.machineType,
        specSheetRef: body.specSheetRef,
        slittingRequired: body.slittingRequired,
        active: body.active,
      },
    });

    return NextResponse.json({ data: fabricQuality });
  } catch (error: any) {
    console.error('PATCH /api/fabric-quality/[id] error:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Fabric quality not found' },
        { status: 404 }
      );
    }

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

export async function DELETE(
  request: NextRequest,
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

    // Soft delete
    const fabricQuality = await prisma.fabricQuality.update({
      where: { id },
      data: { active: false },
    });

    return NextResponse.json({ data: fabricQuality });
  } catch (error: any) {
    console.error('DELETE /api/fabric-quality/[id] error:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Fabric quality not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
