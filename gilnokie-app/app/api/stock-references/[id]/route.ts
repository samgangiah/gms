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

    const stockRef = await prisma.yarnStockReference.findUnique({
      where: { id },
      include: {
        yarnType: true,
        customer: true,
        yarnStock: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            jobCard: {
              select: {
                jobCardNumber: true,
                customer: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    if (!stockRef) {
      return NextResponse.json(
        { error: 'Stock reference not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: stockRef });
  } catch (error) {
    console.error('GET /api/stock-references/[id] error:', error);
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

    const stockRef = await prisma.yarnStockReference.update({
      where: { id },
      data: {
        currentQuantity: body.currentQuantity !== undefined
          ? parseFloat(body.currentQuantity)
          : undefined,
        status: body.status,
        notes: body.notes,
      },
      include: {
        yarnType: true,
      },
    });

    return NextResponse.json({ success: true, data: stockRef });
  } catch (error: any) {
    console.error('PATCH /api/stock-references/[id] error:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Stock reference not found' },
        { status: 404 }
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

    // Soft delete - set status to inactive and deletedAt
    const stockRef = await prisma.yarnStockReference.update({
      where: { id },
      data: {
        status: 'inactive',
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: stockRef });
  } catch (error: any) {
    console.error('DELETE /api/stock-references/[id] error:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Stock reference not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
