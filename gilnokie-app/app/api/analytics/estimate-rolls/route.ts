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

    const { searchParams } = new URL(request.url);
    const qualityId = searchParams.get('qualityId');
    const kilos = searchParams.get('kilos');

    if (!qualityId || !kilos) {
      return NextResponse.json(
        { error: 'Missing required parameters: qualityId and kilos' },
        { status: 400 }
      );
    }

    const kilosNum = parseFloat(kilos);
    if (isNaN(kilosNum) || kilosNum <= 0) {
      return NextResponse.json(
        { error: 'Invalid kilos value' },
        { status: 400 }
      );
    }

    // Get the average roll weight for this quality from historical data
    const stats = await prisma.$queryRaw<
      Array<{
        total_rolls: bigint;
        avg_roll_weight: number;
        min_roll_weight: number;
        max_roll_weight: number;
      }>
    >`
      SELECT
        COUNT(pi.id) as total_rolls,
        COALESCE(AVG(pi.weight), 0)::float as avg_roll_weight,
        COALESCE(MIN(pi.weight), 0)::float as min_roll_weight,
        COALESCE(MAX(pi.weight), 0)::float as max_roll_weight
      FROM production_information pi
      JOIN customer_orders co ON pi.job_card_id = co.id
      WHERE co.quality_id = ${qualityId}
        AND pi.deleted_at IS NULL
        AND pi.archived = false
    `;

    const result = stats[0];
    const totalRolls = Number(result.total_rolls);
    const avgRollWeight = result.avg_roll_weight;

    if (totalRolls === 0 || avgRollWeight === 0) {
      return NextResponse.json({
        success: true,
        data: {
          hasHistoricalData: false,
          message: 'No historical production data available for this quality',
          kilosRequested: kilosNum,
          estimatedRolls: null,
          avgRollWeight: null,
          confidence: null,
        },
      });
    }

    // Calculate estimated rolls
    const estimatedRolls = kilosNum / avgRollWeight;

    // Calculate confidence based on sample size
    // More data = higher confidence
    let confidence: 'low' | 'medium' | 'high';
    if (totalRolls < 10) {
      confidence = 'low';
    } else if (totalRolls < 50) {
      confidence = 'medium';
    } else {
      confidence = 'high';
    }

    // Calculate range based on min/max historical weights
    const minRolls = result.max_roll_weight > 0
      ? Math.floor(kilosNum / result.max_roll_weight)
      : null;
    const maxRolls = result.min_roll_weight > 0
      ? Math.ceil(kilosNum / result.min_roll_weight)
      : null;

    return NextResponse.json({
      success: true,
      data: {
        hasHistoricalData: true,
        kilosRequested: kilosNum,
        estimatedRolls: Math.round(estimatedRolls),
        estimatedRollsExact: Number(estimatedRolls.toFixed(2)),
        avgRollWeight: Number(avgRollWeight.toFixed(2)),
        minRollWeight: Number(result.min_roll_weight.toFixed(2)),
        maxRollWeight: Number(result.max_roll_weight.toFixed(2)),
        range: {
          minRolls,
          maxRolls,
        },
        sampleSize: totalRolls,
        confidence,
      },
    });
  } catch (error) {
    console.error('Error estimating rolls:', error);
    return NextResponse.json(
      { error: 'Failed to estimate rolls' },
      { status: 500 }
    );
  }
}
