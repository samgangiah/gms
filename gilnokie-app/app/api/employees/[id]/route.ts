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

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        production: {
          take: 20,
          orderBy: { productionDate: 'desc' },
          include: {
            jobCard: {
              select: {
                jobCardNumber: true,
                customer: { select: { name: true } },
              },
            },
          },
        },
        _count: {
          select: {
            production: true,
          },
        },
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: employee });
  } catch (error) {
    console.error('GET /api/employees/[id] error:', error);
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

    const employee = await prisma.employee.update({
      where: { id },
      data: {
        employeeCode: body.employeeCode,
        firstName: body.firstName,
        lastName: body.lastName,
        role: body.role,
        contactNumber: body.contactNumber,
        email: body.email,
        hireDate: body.hireDate ? new Date(body.hireDate) : null,
        active: body.active,
      },
    });

    return NextResponse.json({ data: employee });
  } catch (error: any) {
    console.error('PATCH /api/employees/[id] error:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

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

    // Soft delete by setting active to false and deletedAt timestamp
    const employee = await prisma.employee.update({
      where: { id },
      data: {
        active: false,
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({ data: employee });
  } catch (error: any) {
    console.error('DELETE /api/employees/[id] error:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
