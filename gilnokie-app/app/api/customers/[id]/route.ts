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

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        orders: { take: 10, orderBy: { createdAt: 'desc' } },
        _count: {
          select: {
            orders: true,
            deliveryNotes: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: customer });
  } catch (error) {
    console.error('GET /api/customers/[id] error:', error);
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

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name: body.name,
        contactPerson: body.contactPerson,
        phone: body.phone,
        fax: body.fax,
        cellphone: body.cellphone,
        email: body.email,
        address: body.address,
        active: body.active,
      },
    });

    return NextResponse.json({ data: customer });
  } catch (error: any) {
    console.error('PATCH /api/customers/[id] error:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Customer name already exists' },
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

    // Soft delete by setting active to false
    const customer = await prisma.customer.update({
      where: { id },
      data: { active: false },
    });

    return NextResponse.json({ data: customer });
  } catch (error: any) {
    console.error('DELETE /api/customers/[id] error:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
