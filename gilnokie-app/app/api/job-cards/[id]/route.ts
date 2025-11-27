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

    const jobCard = await prisma.customerOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        fabricQuality: {
          include: {
            fabricContent: {
              include: {
                yarnType: true,
              },
            },
          },
        },
        production: {
          orderBy: { createdAt: 'desc' },
        },
        yarnStock: {
          include: {
            stockRef: {
              include: {
                yarnType: true,
              },
            },
          },
        },
      },
    });

    if (!jobCard) {
      return NextResponse.json(
        { error: 'Job card not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: jobCard });
  } catch (error) {
    console.error('GET /api/job-cards/[id] error:', error);
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

    const jobCard = await prisma.customerOrder.update({
      where: { id },
      data: {
        stockReference: body.stockReference,
        customerId: body.customerId,
        orderNumber: body.orderNumber,
        orderDate: body.orderDate ? new Date(body.orderDate) : undefined,
        qualityId: body.qualityId,
        quantityRequired: body.quantityRequired,
        machineAssigned: body.machineAssigned,
        notes: body.notes,
        status: body.status,
      },
      include: {
        customer: true,
        fabricQuality: true,
      },
    });

    return NextResponse.json({ data: jobCard });
  } catch (error: any) {
    console.error('PATCH /api/job-cards/[id] error:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Job card not found' },
        { status: 404 }
      );
    }

    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Invalid customer or fabric quality' },
        { status: 400 }
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

    // Check if there are any production records
    const productionCount = await prisma.productionInfo.count({
      where: { jobCardId: id },
    });

    if (productionCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete job card with production records. Archive it instead.' },
        { status: 400 }
      );
    }

    // Soft delete by setting status to cancelled
    const jobCard = await prisma.customerOrder.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    return NextResponse.json({ data: jobCard });
  } catch (error: any) {
    console.error('DELETE /api/job-cards/[id] error:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Job card not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
