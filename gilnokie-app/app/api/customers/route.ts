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

    const customers = await prisma.customer.findMany({
      where: active !== null ? { active: active === 'true' } : undefined,
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ data: customers });
  } catch (error) {
    console.error('GET /api/customers error:', error);
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

    const customer = await prisma.customer.create({
      data: {
        name: body.name,
        contactPerson: body.contactPerson || null,
        phone: body.phone || null,
        fax: body.fax || null,
        cellphone: body.cellphone || null,
        email: body.email || null,
        address: body.address || null,
        active: body.active ?? true,
      },
    });

    return NextResponse.json({ data: customer }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/customers error:', error);

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
