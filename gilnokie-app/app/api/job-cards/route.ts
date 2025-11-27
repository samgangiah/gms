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

    const jobCards = await prisma.customerOrder.findMany({
      where: status ? { status } : undefined,
      include: {
        customer: true,
        fabricQuality: true,
        production: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            production: true,
            yarnStock: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data: jobCards });
  } catch (error) {
    console.error('GET /api/job-cards error:', error);
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

    // Generate job card number (format: JC-YYYYMMDD-XXX)
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await prisma.customerOrder.count({
      where: {
        jobCardNumber: {
          startsWith: `JC-${dateStr}`,
        },
      },
    });
    const jobCardNumber = `JC-${dateStr}-${String(count + 1).padStart(3, '0')}`;

    const jobCard = await prisma.customerOrder.create({
      data: {
        jobCardNumber,
        stockReference: body.stockReference,
        customerId: body.customerId,

        // Order Information
        orderNumber: body.orderNumber || null,
        customerOrderNumber: body.customerOrderNumber || null,
        customerPONumber: body.customerPONumber || null,
        orderDate: new Date(body.orderDate),
        dateReceived: body.dateReceived ? new Date(body.dateReceived) : null,
        requiredByDate: body.requiredByDate ? new Date(body.requiredByDate) : null,
        deliveryDueDate: body.deliveryDueDate ? new Date(body.deliveryDueDate) : null,
        priority: body.priority || 'Normal',

        // Fabric Specification
        qualityId: body.qualityId,
        quantityRequired: body.quantityRequired,
        quantityUnit: body.quantityUnit || 'kg',
        rollCount: body.rollCount || null,
        targetPieceWeight: body.targetPieceWeight || null,
        targetWidth: body.targetWidth || null,
        targetLength: body.targetLength || null,
        targetGSM: body.targetGSM || null,
        finishType: body.finishType || null,
        dyeMethod: body.dyeMethod || null,
        fabricColor: body.fabricColor || null,

        // Machine & Production
        machineAssigned: body.machineAssigned || null,
        actualMachine: body.actualMachine || null,
        machineGauge: body.machineGauge || null,
        machineSpeed: body.machineSpeed || null,
        estimatedRunTime: body.estimatedRunTime || null,
        setupTime: body.setupTime || null,
        targetEfficiency: body.targetEfficiency || 85,

        // Yarn Requirements
        yarnCalculationMethod: body.yarnCalculationMethod || 'manual',
        estimatedYarnRequired: body.estimatedYarnRequired || null,
        yarnAllocationStatus: body.yarnAllocationStatus || 'pending',

        // Costing
        estimatedCost: body.estimatedCost || null,
        sellingPrice: body.sellingPrice || null,
        marginPercentage: body.marginPercentage || null,

        // Quality Control
        qualityStandard: body.qualityStandard || null,
        inspectionFrequency: body.inspectionFrequency || null,
        defectTolerance: body.defectTolerance || 2,
        samplingRequired: body.samplingRequired || false,
        sampleQuantity: body.sampleQuantity || null,

        // Slitting & Finishing
        slittingRequired: body.slittingRequired || false,
        targetWidthAfterSlitting: body.targetWidthAfterSlitting || null,
        numberOfSlits: body.numberOfSlits || null,
        finishingRequired: body.finishingRequired || false,
        finishingInstructions: body.finishingInstructions || null,
        finishingReference: body.finishingReference || null,

        // Delivery
        deliveryMethod: body.deliveryMethod || null,
        deliveryAddress: body.deliveryAddress || null,
        deliveryDescription: body.deliveryDescription || null,
        specialDeliveryInstructions: body.specialDeliveryInstructions || null,
        packingInstructions: body.packingInstructions || null,
        totalSlipQuantity: body.totalSlipQuantity || null,

        // Documentation
        notes: body.notes || null,
        internalNotes: body.internalNotes || null,
        customerSpecialRequirements: body.customerSpecialRequirements || null,
        qualityNotes: body.qualityNotes || null,

        // Status & Control
        status: body.status || 'active',
        approvedBy: body.approvedBy || null,
        approvalDate: body.approvalDate ? new Date(body.approvalDate) : null,
        jobStatusComplete: body.jobStatusComplete || false,
        overrideFlag: body.overrideFlag || false,
        overrideValue: body.overrideValue || null,
      },
      include: {
        customer: true,
        fabricQuality: true,
      },
    });

    return NextResponse.json({ data: jobCard }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/job-cards error:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Job card number already exists' },
        { status: 409 }
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