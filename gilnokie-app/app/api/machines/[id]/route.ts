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

    const machine = await prisma.machineSpecification.findUnique({
      where: { id },
    });

    if (!machine) {
      return NextResponse.json(
        { error: 'Machine not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: machine });
  } catch (error) {
    console.error('GET /api/machines/[id] error:', error);
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

    const machine = await prisma.machineSpecification.update({
      where: { id },
      data: {
        machineNumber: body.machineNumber,
        machineName: body.machineName,
        machineType: body.machineType,
        gauge: body.gauge || null,
        diameter: body.diameter ? parseFloat(body.diameter) : null,
        feeders: body.feeders ? parseInt(body.feeders, 10) : null,
        maxSpeed: body.maxSpeed ? parseFloat(body.maxSpeed) : null,
        status: body.status,
        notes: body.notes || null,
      },
    });

    return NextResponse.json({ data: machine });
  } catch (error: any) {
    console.error('PATCH /api/machines/[id] error:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Machine not found' },
        { status: 404 }
      );
    }

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Machine number already exists' },
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

    // Soft delete by setting deletedAt timestamp
    const machine = await prisma.machineSpecification.update({
      where: { id },
      data: {
        status: 'inactive',
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({ data: machine });
  } catch (error: any) {
    console.error('DELETE /api/machines/[id] error:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Machine not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
