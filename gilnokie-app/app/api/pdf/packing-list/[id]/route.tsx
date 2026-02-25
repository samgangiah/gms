import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { prisma } from '@/lib/prisma';


import { renderToStream } from '@react-pdf/renderer';
import { PackingListPDF } from '@/lib/pdf-templates/packing-list-pdf';

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

    // Fetch packing list with all related data
    const packingList = await prisma.packingList.findUnique({
      where: { id },
      include: {
        jobCard: {
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
          },
        },
        items: {
          include: {
            production: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!packingList || packingList.deletedAt) {
      return NextResponse.json({ error: 'Packing list not found' }, { status: 404 });
    }

    // Convert Decimal fields to numbers for PDF rendering
    const packingListData = {
      ...packingList,
      totalGrossWeight: packingList.totalGrossWeight?.toNumber() || null,
      totalNetWeight: packingList.totalNetWeight.toNumber(),
      jobCard: {
        ...packingList.jobCard,
        quantityRequired: packingList.jobCard.quantityRequired?.toNumber?.() || packingList.jobCard.quantityRequired,
        fabricQuality: {
          ...packingList.jobCard.fabricQuality,
          weight: packingList.jobCard.fabricQuality.weight?.toNumber?.() || null,
          width: packingList.jobCard.fabricQuality.width?.toNumber?.() || null,
          fabricContent: packingList.jobCard.fabricQuality.fabricContent?.map((fc: any) => ({
            ...fc,
            percentage: fc.percentage?.toNumber?.() || fc.percentage,
          })) || [],
        },
      },
      items: packingList.items.map((item) => ({
        ...item,
        production: {
          ...item.production,
          weight: item.production.weight.toNumber(),
        },
      })),
    };

    // Generate PDF
    const stream = await renderToStream(<PackingListPDF packingList={packingListData} />);

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
        'Content-Disposition': `inline; filename="packing-list-${packingList.packingListNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
