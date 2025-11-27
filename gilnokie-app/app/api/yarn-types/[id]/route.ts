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

    const yarnType = await prisma.yarnType.findUnique({
      where: { id },
    });

    if (!yarnType) {
      return NextResponse.json(
        { error: 'Yarn type not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: yarnType });
  } catch (error) {
    console.error('GET /api/yarn-types/[id] error:', error);
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

    const yarnType = await prisma.yarnType.update({
      where: { id },
      data: {
        code: body.code,
        description: body.description,
        material: body.material,
        texCount: body.texCount,
        color: body.color,
        supplierName: body.supplierName,
        supplierCode: body.supplierCode,
        unitPrice: body.unitPrice,
        active: body.active,
      },
    });

    return NextResponse.json({ data: yarnType });
  } catch (error: any) {
    console.error('PATCH /api/yarn-types/[id] error:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Yarn type not found' },
        { status: 404 }
      );
    }

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Yarn type code already exists' },
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
    const yarnType = await prisma.yarnType.update({
      where: { id },
      data: { active: false },
    });

    return NextResponse.json({ data: yarnType });
  } catch (error: any) {
    console.error('DELETE /api/yarn-types/[id] error:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Yarn type not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
