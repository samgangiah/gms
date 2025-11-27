import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { prisma } from '@/lib/prisma';


import { renderToStream } from '@react-pdf/renderer';
import { DeliveryNotePDF } from '@/lib/pdf-templates/delivery-note-pdf';

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

    // Fetch delivery with all related data
    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: {
        jobCard: {
          include: {
            customer: true,
            fabricQuality: true,
          },
        },
        packingLists: {
          include: {
            items: {
              include: {
                production: true,
              },
            },
          },
        },
      },
    });

    if (!delivery || delivery.deletedAt) {
      return NextResponse.json({ error: 'Delivery not found' }, { status: 404 });
    }

    // Convert Decimal fields to numbers for PDF rendering
    const deliveryData = {
      ...delivery,
      packingLists: delivery.packingLists.map((packing) => ({
        ...packing,
        totalGrossWeight: packing.totalGrossWeight?.toNumber() || null,
        totalNetWeight: packing.totalNetWeight.toNumber(),
        items: packing.items.map((item) => ({
          ...item,
          production: {
            ...item.production,
            weight: item.production.weight.toNumber(),
          },
        })),
      })),
    };

    // Generate PDF
    const stream = await renderToStream(<DeliveryNotePDF delivery={deliveryData} />);

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
        'Content-Disposition': `inline; filename="delivery-note-${delivery.deliveryNoteNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
