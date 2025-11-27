import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { prisma } from '@/lib/prisma';


import { renderToStream } from '@react-pdf/renderer';
import { JobCardPDF } from '@/lib/pdf-templates/job-card-pdf';

export async function GET(
  request: Request,
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

    // Fetch job card with all related data
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
              orderBy: { position: 'asc' },
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

    if (!jobCard || jobCard.deletedAt) {
      return NextResponse.json({ error: 'Job card not found' }, { status: 404 });
    }

    // Convert Decimal fields to numbers for PDF rendering
    const jobCardData = {
      ...jobCard,
      quantityRequired: jobCard.quantityRequired.toNumber(),
      targetPieceWeight: jobCard.targetPieceWeight?.toNumber() || null,
      targetWidth: jobCard.targetWidth?.toNumber() || null,
      targetLength: jobCard.targetLength?.toNumber() || null,
      targetGSM: jobCard.targetGSM?.toNumber() || null,
      estimatedYarnRequired: jobCard.estimatedYarnRequired?.toNumber() || null,
      estimatedCost: jobCard.estimatedCost?.toNumber() || null,
      sellingPrice: jobCard.sellingPrice?.toNumber() || null,
      marginPercentage: jobCard.marginPercentage?.toNumber() || null,
      targetEfficiency: jobCard.targetEfficiency?.toNumber() || null,
      fabricQuality: {
        ...jobCard.fabricQuality,
        weight: jobCard.fabricQuality.weight?.toNumber() || null,
        width: jobCard.fabricQuality.width?.toNumber() || null,
        fabricContent: jobCard.fabricQuality.fabricContent.map((fc) => ({
          ...fc,
          percentage: fc.percentage.toNumber(),
        })),
      },
      production: jobCard.production.map((p) => ({
        ...p,
        weight: p.weight.toNumber(),
      })),
    };

    // Generate PDF
    const stream = await renderToStream(<JobCardPDF jobCard={jobCardData} />);

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Return PDF as response
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="job-card-${jobCard.jobCardNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
