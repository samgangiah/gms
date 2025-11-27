/*
  Warnings:

  - You are about to drop the column `delivery_note_id` on the `production_information` table. All the data in the column will be lost.
  - You are about to drop the column `pack_info_id` on the `production_information` table. All the data in the column will be lost.
  - You are about to drop the `delivery_note` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pack_info` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `stock_adjust` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `stock_ref` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `yarn_stock` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "delivery_note" DROP CONSTRAINT "delivery_note_customer_id_fkey";

-- DropForeignKey
ALTER TABLE "fabric_content" DROP CONSTRAINT "fabric_content_quality_id_fkey";

-- DropForeignKey
ALTER TABLE "pack_info" DROP CONSTRAINT "pack_info_delivery_note_id_fkey";

-- DropForeignKey
ALTER TABLE "production_information" DROP CONSTRAINT "production_information_delivery_note_id_fkey";

-- DropForeignKey
ALTER TABLE "production_information" DROP CONSTRAINT "production_information_pack_info_id_fkey";

-- DropForeignKey
ALTER TABLE "stock_ref" DROP CONSTRAINT "stock_ref_customer_id_fkey";

-- DropForeignKey
ALTER TABLE "stock_ref" DROP CONSTRAINT "stock_ref_yarn_type_id_fkey";

-- DropForeignKey
ALTER TABLE "yarn_stock" DROP CONSTRAINT "yarn_stock_job_card_id_fkey";

-- DropForeignKey
ALTER TABLE "yarn_stock" DROP CONSTRAINT "yarn_stock_stock_ref_id_fkey";

-- DropIndex
DROP INDEX "production_information_delivery_note_id_idx";

-- DropIndex
DROP INDEX "production_information_pack_info_id_idx";

-- AlterTable
ALTER TABLE "customer_orders" ADD COLUMN     "actual_machine" TEXT,
ADD COLUMN     "approval_date" TIMESTAMP(3),
ADD COLUMN     "approved_by" TEXT,
ADD COLUMN     "customer_order_number" TEXT,
ADD COLUMN     "customer_po_number" TEXT,
ADD COLUMN     "customer_special_requirements" TEXT,
ADD COLUMN     "date_received" TIMESTAMP(3),
ADD COLUMN     "defect_tolerance" DECIMAL(65,30) DEFAULT 2,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "delivery_address" TEXT,
ADD COLUMN     "delivery_description" TEXT,
ADD COLUMN     "delivery_due_date" TIMESTAMP(3),
ADD COLUMN     "delivery_method" TEXT,
ADD COLUMN     "dye_method" TEXT,
ADD COLUMN     "estimated_cost" DECIMAL(65,30),
ADD COLUMN     "estimated_run_time" DECIMAL(65,30),
ADD COLUMN     "estimated_yarn_required" DECIMAL(65,30),
ADD COLUMN     "fabric_color" TEXT,
ADD COLUMN     "finish_type" TEXT,
ADD COLUMN     "finishing_instructions" TEXT,
ADD COLUMN     "finishing_reference" TEXT,
ADD COLUMN     "finishing_required" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "inspection_frequency" TEXT,
ADD COLUMN     "internal_notes" TEXT,
ADD COLUMN     "job_status_complete" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "machine_gauge" TEXT,
ADD COLUMN     "machine_speed" TEXT,
ADD COLUMN     "margin_percentage" DECIMAL(65,30),
ADD COLUMN     "number_of_slits" INTEGER,
ADD COLUMN     "override_flag" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "override_value" DECIMAL(65,30),
ADD COLUMN     "packing_instructions" TEXT,
ADD COLUMN     "priority" TEXT DEFAULT 'Normal',
ADD COLUMN     "quality_notes" TEXT,
ADD COLUMN     "quality_standard" TEXT,
ADD COLUMN     "quantity_unit" TEXT DEFAULT 'kg',
ADD COLUMN     "required_by_date" TIMESTAMP(3),
ADD COLUMN     "roll_count" INTEGER,
ADD COLUMN     "sample_quantity" INTEGER,
ADD COLUMN     "sampling_required" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "selling_price" DECIMAL(65,30),
ADD COLUMN     "setup_time" DECIMAL(65,30),
ADD COLUMN     "slitting_required" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "special_delivery_instructions" TEXT,
ADD COLUMN     "target_efficiency" DECIMAL(65,30) DEFAULT 85,
ADD COLUMN     "target_gsm" DECIMAL(65,30),
ADD COLUMN     "target_length" DECIMAL(65,30),
ADD COLUMN     "target_piece_weight" DECIMAL(65,30),
ADD COLUMN     "target_width" DECIMAL(65,30),
ADD COLUMN     "target_width_after_slitting" DECIMAL(65,30),
ADD COLUMN     "total_slip_quantity" DECIMAL(65,30),
ADD COLUMN     "yarn_allocation_status" TEXT DEFAULT 'pending',
ADD COLUMN     "yarn_calculation_method" TEXT DEFAULT 'manual';

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "fabric_quality" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "fabric_type" TEXT,
ADD COLUMN     "finished_weight" DECIMAL(65,30),
ADD COLUMN     "finished_width" DECIMAL(65,30),
ADD COLUMN     "greige_weight" DECIMAL(65,30),
ADD COLUMN     "greige_width" DECIMAL(65,30),
ADD COLUMN     "percentage_loss" DECIMAL(65,30),
ADD COLUMN     "tex_count" TEXT;

-- AlterTable
ALTER TABLE "production_information" DROP COLUMN "delivery_note_id",
DROP COLUMN "pack_info_id",
ADD COLUMN     "defect_type" TEXT,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "employee_id" TEXT;

-- AlterTable
ALTER TABLE "yarn_types" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- DropTable
DROP TABLE "delivery_note";

-- DropTable
DROP TABLE "pack_info";

-- DropTable
DROP TABLE "stock_adjust";

-- DropTable
DROP TABLE "stock_ref";

-- DropTable
DROP TABLE "yarn_stock";

-- CreateTable
CREATE TABLE "yarn_stock_job_card" (
    "id" TEXT NOT NULL,
    "job_card_id" TEXT NOT NULL,
    "stock_ref_id" TEXT NOT NULL,
    "quantity_received" DECIMAL(65,30) NOT NULL,
    "quantity_used" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "quantity_loss" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "received_date" TIMESTAMP(3) NOT NULL,
    "lot_number" TEXT,
    "notes" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "yarn_stock_job_card_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "yarn_stock_reference" (
    "id" TEXT NOT NULL,
    "stock_reference_number" TEXT NOT NULL,
    "yarn_type_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "current_quantity" DECIMAL(65,30) NOT NULL,
    "stock_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "yarn_stock_reference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "packing_list" (
    "id" TEXT NOT NULL,
    "packing_list_number" TEXT NOT NULL,
    "job_card_id" TEXT NOT NULL,
    "packing_date" TIMESTAMP(3) NOT NULL,
    "number_of_cartons" INTEGER NOT NULL,
    "total_gross_weight" DECIMAL(65,30),
    "total_net_weight" DECIMAL(65,30) NOT NULL,
    "packing_status" TEXT NOT NULL DEFAULT 'pending',
    "packing_notes" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "packing_list_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "packing_list_items" (
    "id" TEXT NOT NULL,
    "packing_list_id" TEXT NOT NULL,
    "production_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "packing_list_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery" (
    "id" TEXT NOT NULL,
    "delivery_note_number" TEXT NOT NULL,
    "job_card_id" TEXT NOT NULL,
    "delivery_date" TIMESTAMP(3),
    "scheduled_delivery_date" TIMESTAMP(3),
    "delivery_method" TEXT NOT NULL,
    "delivery_address" TEXT NOT NULL,
    "courier_name" TEXT,
    "tracking_number" TEXT,
    "driver_name" TEXT,
    "vehicle_reg" TEXT,
    "delivery_status" TEXT NOT NULL DEFAULT 'pending',
    "delivery_notes" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "employee_code" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "role" TEXT,
    "contact_number" TEXT,
    "email" TEXT,
    "hire_date" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "machine_specifications" (
    "id" TEXT NOT NULL,
    "machine_number" TEXT NOT NULL,
    "machine_name" TEXT NOT NULL,
    "machine_type" TEXT NOT NULL,
    "gauge" TEXT,
    "diameter" DECIMAL(65,30),
    "feeders" INTEGER,
    "max_speed" DECIMAL(65,30),
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "machine_specifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "category" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_adjustments" (
    "id" TEXT NOT NULL,
    "adjustment_number" TEXT NOT NULL,
    "stock_ref_id" TEXT NOT NULL,
    "adjustment_type" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "reason" TEXT,
    "adjusted_by" TEXT NOT NULL,
    "adjustment_date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DeliveryToPackingList" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DeliveryToPackingList_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "yarn_stock_job_card_job_card_id_idx" ON "yarn_stock_job_card"("job_card_id");

-- CreateIndex
CREATE INDEX "yarn_stock_job_card_stock_ref_id_idx" ON "yarn_stock_job_card"("stock_ref_id");

-- CreateIndex
CREATE INDEX "yarn_stock_job_card_deleted_at_idx" ON "yarn_stock_job_card"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "yarn_stock_reference_stock_reference_number_key" ON "yarn_stock_reference"("stock_reference_number");

-- CreateIndex
CREATE INDEX "yarn_stock_reference_yarn_type_id_idx" ON "yarn_stock_reference"("yarn_type_id");

-- CreateIndex
CREATE INDEX "yarn_stock_reference_customer_id_idx" ON "yarn_stock_reference"("customer_id");

-- CreateIndex
CREATE INDEX "yarn_stock_reference_deleted_at_idx" ON "yarn_stock_reference"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "packing_list_packing_list_number_key" ON "packing_list"("packing_list_number");

-- CreateIndex
CREATE INDEX "packing_list_job_card_id_idx" ON "packing_list"("job_card_id");

-- CreateIndex
CREATE INDEX "packing_list_packing_date_idx" ON "packing_list"("packing_date");

-- CreateIndex
CREATE INDEX "packing_list_deleted_at_idx" ON "packing_list"("deleted_at");

-- CreateIndex
CREATE INDEX "packing_list_items_packing_list_id_idx" ON "packing_list_items"("packing_list_id");

-- CreateIndex
CREATE INDEX "packing_list_items_production_id_idx" ON "packing_list_items"("production_id");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_delivery_note_number_key" ON "delivery"("delivery_note_number");

-- CreateIndex
CREATE INDEX "delivery_job_card_id_idx" ON "delivery"("job_card_id");

-- CreateIndex
CREATE INDEX "delivery_delivery_date_idx" ON "delivery"("delivery_date");

-- CreateIndex
CREATE INDEX "delivery_delivery_status_idx" ON "delivery"("delivery_status");

-- CreateIndex
CREATE INDEX "delivery_deleted_at_idx" ON "delivery"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "employees_employee_code_key" ON "employees"("employee_code");

-- CreateIndex
CREATE INDEX "employees_deleted_at_idx" ON "employees"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "machine_specifications_machine_number_key" ON "machine_specifications"("machine_number");

-- CreateIndex
CREATE INDEX "machine_specifications_deleted_at_idx" ON "machine_specifications"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "stock_adjustments_adjustment_number_key" ON "stock_adjustments"("adjustment_number");

-- CreateIndex
CREATE INDEX "stock_adjustments_stock_ref_id_idx" ON "stock_adjustments"("stock_ref_id");

-- CreateIndex
CREATE INDEX "stock_adjustments_adjustment_date_idx" ON "stock_adjustments"("adjustment_date");

-- CreateIndex
CREATE INDEX "_DeliveryToPackingList_B_index" ON "_DeliveryToPackingList"("B");

-- CreateIndex
CREATE INDEX "customer_orders_status_idx" ON "customer_orders"("status");

-- CreateIndex
CREATE INDEX "customer_orders_delivery_due_date_idx" ON "customer_orders"("delivery_due_date");

-- CreateIndex
CREATE INDEX "customer_orders_deleted_at_idx" ON "customer_orders"("deleted_at");

-- CreateIndex
CREATE INDEX "customers_deleted_at_idx" ON "customers"("deleted_at");

-- CreateIndex
CREATE INDEX "fabric_quality_deleted_at_idx" ON "fabric_quality"("deleted_at");

-- CreateIndex
CREATE INDEX "production_information_employee_id_idx" ON "production_information"("employee_id");

-- CreateIndex
CREATE INDEX "production_information_archived_idx" ON "production_information"("archived");

-- CreateIndex
CREATE INDEX "production_information_deleted_at_idx" ON "production_information"("deleted_at");

-- CreateIndex
CREATE INDEX "yarn_types_deleted_at_idx" ON "yarn_types"("deleted_at");

-- AddForeignKey
ALTER TABLE "production_information" ADD CONSTRAINT "production_information_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yarn_stock_job_card" ADD CONSTRAINT "yarn_stock_job_card_job_card_id_fkey" FOREIGN KEY ("job_card_id") REFERENCES "customer_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yarn_stock_job_card" ADD CONSTRAINT "yarn_stock_job_card_stock_ref_id_fkey" FOREIGN KEY ("stock_ref_id") REFERENCES "yarn_stock_reference"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yarn_stock_reference" ADD CONSTRAINT "yarn_stock_reference_yarn_type_id_fkey" FOREIGN KEY ("yarn_type_id") REFERENCES "yarn_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yarn_stock_reference" ADD CONSTRAINT "yarn_stock_reference_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fabric_content" ADD CONSTRAINT "fabric_content_quality_id_fkey" FOREIGN KEY ("quality_id") REFERENCES "fabric_quality"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packing_list" ADD CONSTRAINT "packing_list_job_card_id_fkey" FOREIGN KEY ("job_card_id") REFERENCES "customer_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packing_list_items" ADD CONSTRAINT "packing_list_items_packing_list_id_fkey" FOREIGN KEY ("packing_list_id") REFERENCES "packing_list"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packing_list_items" ADD CONSTRAINT "packing_list_items_production_id_fkey" FOREIGN KEY ("production_id") REFERENCES "production_information"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery" ADD CONSTRAINT "delivery_job_card_id_fkey" FOREIGN KEY ("job_card_id") REFERENCES "customer_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_stock_ref_id_fkey" FOREIGN KEY ("stock_ref_id") REFERENCES "yarn_stock_reference"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DeliveryToPackingList" ADD CONSTRAINT "_DeliveryToPackingList_A_fkey" FOREIGN KEY ("A") REFERENCES "delivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DeliveryToPackingList" ADD CONSTRAINT "_DeliveryToPackingList_B_fkey" FOREIGN KEY ("B") REFERENCES "packing_list"("id") ON DELETE CASCADE ON UPDATE CASCADE;
