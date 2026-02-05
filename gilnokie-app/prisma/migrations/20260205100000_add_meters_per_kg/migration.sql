-- Add meters_per_kg conversion factor to fabric_quality table
ALTER TABLE "fabric_quality" ADD COLUMN "meters_per_kg" DECIMAL;
