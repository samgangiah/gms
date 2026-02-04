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
    const status = searchParams.get('status');
    const machineType = searchParams.get('machineType');

    const machines = await prisma.machineSpecification.findMany({
      where: {
        deletedAt: null,
        ...(status ? { status } : {}),
        ...(machineType ? { machineType } : {}),
      },
      orderBy: { machineNumber: 'asc' },
    });

    return NextResponse.json({ data: machines });
  } catch (error) {
    console.error('GET /api/machines error:', error);
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

    // Validate required fields
    if (!body.machineNumber || !body.machineName || !body.machineType) {
      return NextResponse.json(
        { error: 'Machine number, name, and type are required' },
        { status: 400 }
      );
    }

    const machine = await prisma.machineSpecification.create({
      data: {
        machineNumber: body.machineNumber,
        machineName: body.machineName,
        machineType: body.machineType,
        gauge: body.gauge || null,
        diameter: body.diameter ? parseFloat(body.diameter) : null,
        feeders: body.feeders ? parseInt(body.feeders, 10) : null,
        maxSpeed: body.maxSpeed ? parseFloat(body.maxSpeed) : null,
        status: body.status || 'active',
        notes: body.notes || null,
      },
    });

    return NextResponse.json({ data: machine }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/machines error:', error);

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
