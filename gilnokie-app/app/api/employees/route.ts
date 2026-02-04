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
    const role = searchParams.get('role');

    const employees = await prisma.employee.findMany({
      where: {
        deletedAt: null,
        ...(active !== null ? { active: active === 'true' } : {}),
        ...(role ? { role } : {}),
      },
      include: {
        _count: {
          select: {
            production: true,
          },
        },
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' },
      ],
    });

    return NextResponse.json({ data: employees });
  } catch (error) {
    console.error('GET /api/employees error:', error);
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
    if (!body.employeeCode || !body.firstName || !body.lastName) {
      return NextResponse.json(
        { error: 'Employee code, first name, and last name are required' },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.create({
      data: {
        employeeCode: body.employeeCode,
        firstName: body.firstName,
        lastName: body.lastName,
        role: body.role || null,
        contactNumber: body.contactNumber || null,
        email: body.email || null,
        hireDate: body.hireDate ? new Date(body.hireDate) : null,
        active: body.active ?? true,
      },
    });

    return NextResponse.json({ data: employee }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/employees error:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Employee code already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
