import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all production records grouped by fabric quality
    // We need to join through job cards to get the quality
    const rollAverages = await prisma.$queryRaw<
      Array<{
        quality_id: string;
        quality_code: string;
        quality_description: string | null;
        total_rolls: bigint;
        total_weight_kg: number;
        avg_roll_weight_kg: number;
        min_roll_weight_kg: number;
        max_roll_weight_kg: number;
        std_dev_weight: number | null;
      }>
    >`
      SELECT
        fq.id as quality_id,
        fq.quality_code,
        fq.description as quality_description,
        COUNT(pi.id) as total_rolls,
        COALESCE(SUM(pi.weight), 0)::float as total_weight_kg,
        COALESCE(AVG(pi.weight), 0)::float as avg_roll_weight_kg,
        COALESCE(MIN(pi.weight), 0)::float as min_roll_weight_kg,
        COALESCE(MAX(pi.weight), 0)::float as max_roll_weight_kg,
        STDDEV(pi.weight)::float as std_dev_weight
      FROM fabric_quality fq
      LEFT JOIN customer_orders co ON co.quality_id = fq.id
      LEFT JOIN production_information pi ON pi.job_card_id = co.id
        AND pi.deleted_at IS NULL
        AND pi.archived = false
      WHERE fq.deleted_at IS NULL
      GROUP BY fq.id, fq.quality_code, fq.description
      HAVING COUNT(pi.id) > 0
      ORDER BY COUNT(pi.id) DESC
    `;

    // Convert BigInt to Number for JSON serialization
    const formattedData = rollAverages.map((row) => ({
      qualityId: row.quality_id,
      qualityCode: row.quality_code,
      qualityDescription: row.quality_description,
      totalRolls: Number(row.total_rolls),
      totalWeightKg: Number(row.total_weight_kg.toFixed(2)),
      avgRollWeightKg: Number(row.avg_roll_weight_kg.toFixed(2)),
      minRollWeightKg: Number(row.min_roll_weight_kg.toFixed(2)),
      maxRollWeightKg: Number(row.max_roll_weight_kg.toFixed(2)),
      stdDevWeight: row.std_dev_weight ? Number(row.std_dev_weight.toFixed(2)) : null,
      // Calculated helper: how many rolls per 1000kg
      rollsPer1000Kg: row.avg_roll_weight_kg > 0
        ? Number((1000 / row.avg_roll_weight_kg).toFixed(1))
        : null,
    }));

    // Also calculate overall averages
    const overallStats = {
      totalQualities: formattedData.length,
      totalRollsAllQualities: formattedData.reduce((sum, q) => sum + q.totalRolls, 0),
      totalWeightAllQualities: formattedData.reduce((sum, q) => sum + q.totalWeightKg, 0),
      overallAvgRollWeight: formattedData.length > 0
        ? Number(
            (formattedData.reduce((sum, q) => sum + q.totalWeightKg, 0) /
              formattedData.reduce((sum, q) => sum + q.totalRolls, 0)).toFixed(2)
          )
        : 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        byQuality: formattedData,
        overall: overallStats,
      },
    });
  } catch (error) {
    console.error('Error calculating roll averages:', error);
    return NextResponse.json(
      { error: 'Failed to calculate roll averages' },
      { status: 500 }
    );
  }
}
