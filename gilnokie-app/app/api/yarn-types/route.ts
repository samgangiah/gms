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

    const yarnTypes = await prisma.yarnType.findMany({
      where: active !== null ? { active: active === 'true' } : undefined,
      orderBy: { code: 'asc' },
    });

    return NextResponse.json({ data: yarnTypes });
  } catch (error) {
    console.error('GET /api/yarn-types error:', error);
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

    const yarnType = await prisma.yarnType.create({
      data: {
        code: body.code,
        description: body.description || null,
        material: body.material || null,
        texCount: body.texCount || null,
        color: body.color || null,
        supplierName: body.supplierName || null,
        supplierCode: body.supplierCode || null,
        unitPrice: body.unitPrice || null,
        active: body.active ?? true,
      },
    });

    return NextResponse.json({ data: yarnType }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/yarn-types error:', error);

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
