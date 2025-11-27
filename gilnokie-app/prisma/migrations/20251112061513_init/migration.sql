-- CreateTable
CREATE TABLE "customer_orders" (
    "id" TEXT NOT NULL,
    "job_card_number" TEXT NOT NULL,
    "stock_reference" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "order_number" TEXT,
    "order_date" TIMESTAMP(3) NOT NULL,
    "quality_id" TEXT NOT NULL,
    "quantity_required" DECIMAL(65,30) NOT NULL,
    "machine_assigned" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_information" (
    "id" TEXT NOT NULL,
    "piece_number" TEXT NOT NULL,
    "job_card_id" TEXT NOT NULL,
    "weight" DECIMAL(65,30) NOT NULL,
    "production_date" TIMESTAMP(3) NOT NULL,
    "production_time" TIMESTAMP(3),
    "delivery_note_id" TEXT,
    "pack_info_id" TEXT,
    "machine_number" TEXT,
    "operator_name" TEXT,
    "quality_grade" TEXT,
    "notes" TEXT,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_information_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "yarn_stock" (
    "id" TEXT NOT NULL,
    "job_card_id" TEXT NOT NULL,
    "stock_ref_id" TEXT NOT NULL,
    "quantity_received" DECIMAL(65,30) NOT NULL,
    "quantity_used" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "quantity_loss" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "date_received" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "yarn_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_ref" (
    "id" TEXT NOT NULL,
    "yarn_type_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "quantity_in_stock" DECIMAL(65,30) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "date_added" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_modified" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_ref_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fabric_quality" (
    "id" TEXT NOT NULL,
    "quality_code" TEXT NOT NULL,
    "description" TEXT,
    "greige_dimensions" TEXT,
    "finished_dimensions" TEXT,
    "greige_density" TEXT,
    "finished_density" TEXT,
    "width" DECIMAL(65,30),
    "weight" DECIMAL(65,30),
    "machine_gauge" TEXT,
    "machine_type" TEXT,
    "spec_sheet_ref" TEXT,
    "slitting_required" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fabric_quality_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fabric_content" (
    "id" TEXT NOT NULL,
    "quality_id" TEXT NOT NULL,
    "yarn_type_id" TEXT NOT NULL,
    "percentage" DECIMAL(65,30) NOT NULL,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fabric_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pack_info" (
    "id" TEXT NOT NULL,
    "pack_slip_number" TEXT NOT NULL,
    "delivery_note_id" TEXT,
    "total_weight" DECIMAL(65,30) NOT NULL,
    "piece_count" INTEGER NOT NULL,
    "pack_date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pack_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_note" (
    "id" TEXT NOT NULL,
    "delivery_number" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "delivery_date" TIMESTAMP(3) NOT NULL,
    "total_weight" DECIMAL(65,30),
    "driver_name" TEXT,
    "vehicle_reg" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'standard',
    "supabase_user_id" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" TEXT,
    "metadata" JSONB,

    CONSTRAINT "user_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact_person" TEXT,
    "phone" TEXT,
    "fax" TEXT,
    "cellphone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "yarn_types" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "material" TEXT,
    "tex_count" TEXT,
    "color" TEXT,
    "supplier_name" TEXT,
    "supplier_code" TEXT,
    "unit_price" DECIMAL(65,30),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "yarn_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "print_cust_orders" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "formatted_data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "print_cust_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "print_job_card" (
    "id" TEXT NOT NULL,
    "job_card_id" TEXT NOT NULL,
    "formatted_data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "print_job_card_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "print_pack_info" (
    "id" TEXT NOT NULL,
    "pack_info_id" TEXT NOT NULL,
    "formatted_data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "print_pack_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "print_prod_info" (
    "id" TEXT NOT NULL,
    "production_id" TEXT NOT NULL,
    "formatted_data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "print_prod_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "print_yarn_detail" (
    "id" TEXT NOT NULL,
    "yarn_stock_id" TEXT NOT NULL,
    "formatted_data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "print_yarn_detail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "print_yarn_info" (
    "id" TEXT NOT NULL,
    "stock_ref_id" TEXT NOT NULL,
    "formatted_data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "print_yarn_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "print_yarn_mod" (
    "id" TEXT NOT NULL,
    "yarn_type_id" TEXT NOT NULL,
    "formatted_data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "print_yarn_mod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prod_info_archive" (
    "id" TEXT NOT NULL,
    "original_id" TEXT NOT NULL,
    "piece_number" TEXT NOT NULL,
    "job_card_number" TEXT NOT NULL,
    "weight" DECIMAL(65,30) NOT NULL,
    "production_date" TIMESTAMP(3) NOT NULL,
    "archived_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archive_data" JSONB NOT NULL,

    CONSTRAINT "prod_info_archive_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_adjust" (
    "id" TEXT NOT NULL,
    "stock_ref_id" TEXT NOT NULL,
    "adjustment_type" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "reason" TEXT,
    "adjusted_by" TEXT NOT NULL,
    "adjusted_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_adjust_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customer_orders_job_card_number_key" ON "customer_orders"("job_card_number");

-- CreateIndex
CREATE INDEX "customer_orders_customer_id_idx" ON "customer_orders"("customer_id");

-- CreateIndex
CREATE INDEX "customer_orders_quality_id_idx" ON "customer_orders"("quality_id");

-- CreateIndex
CREATE INDEX "customer_orders_job_card_number_idx" ON "customer_orders"("job_card_number");

-- CreateIndex
CREATE UNIQUE INDEX "production_information_piece_number_key" ON "production_information"("piece_number");

-- CreateIndex
CREATE INDEX "production_information_job_card_id_idx" ON "production_information"("job_card_id");

-- CreateIndex
CREATE INDEX "production_information_delivery_note_id_idx" ON "production_information"("delivery_note_id");

-- CreateIndex
CREATE INDEX "production_information_pack_info_id_idx" ON "production_information"("pack_info_id");

-- CreateIndex
CREATE INDEX "production_information_production_date_idx" ON "production_information"("production_date");

-- CreateIndex
CREATE INDEX "yarn_stock_job_card_id_idx" ON "yarn_stock"("job_card_id");

-- CreateIndex
CREATE INDEX "yarn_stock_stock_ref_id_idx" ON "yarn_stock"("stock_ref_id");

-- CreateIndex
CREATE INDEX "stock_ref_yarn_type_id_idx" ON "stock_ref"("yarn_type_id");

-- CreateIndex
CREATE INDEX "stock_ref_customer_id_idx" ON "stock_ref"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "fabric_quality_quality_code_key" ON "fabric_quality"("quality_code");

-- CreateIndex
CREATE INDEX "fabric_content_quality_id_idx" ON "fabric_content"("quality_id");

-- CreateIndex
CREATE INDEX "fabric_content_yarn_type_id_idx" ON "fabric_content"("yarn_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "pack_info_pack_slip_number_key" ON "pack_info"("pack_slip_number");

-- CreateIndex
CREATE INDEX "pack_info_delivery_note_id_idx" ON "pack_info"("delivery_note_id");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_note_delivery_number_key" ON "delivery_note"("delivery_number");

-- CreateIndex
CREATE INDEX "delivery_note_customer_id_idx" ON "delivery_note"("customer_id");

-- CreateIndex
CREATE INDEX "delivery_note_delivery_date_idx" ON "delivery_note"("delivery_date");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_supabase_user_id_key" ON "users"("supabase_user_id");

-- CreateIndex
CREATE INDEX "user_logs_user_id_idx" ON "user_logs"("user_id");

-- CreateIndex
CREATE INDEX "user_logs_timestamp_idx" ON "user_logs"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "customers_name_key" ON "customers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "yarn_types_code_key" ON "yarn_types"("code");

-- CreateIndex
CREATE INDEX "prod_info_archive_job_card_number_idx" ON "prod_info_archive"("job_card_number");

-- CreateIndex
CREATE INDEX "prod_info_archive_archived_date_idx" ON "prod_info_archive"("archived_date");

-- CreateIndex
CREATE INDEX "stock_adjust_stock_ref_id_idx" ON "stock_adjust"("stock_ref_id");

-- CreateIndex
CREATE INDEX "stock_adjust_adjusted_date_idx" ON "stock_adjust"("adjusted_date");

-- AddForeignKey
ALTER TABLE "customer_orders" ADD CONSTRAINT "customer_orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_orders" ADD CONSTRAINT "customer_orders_quality_id_fkey" FOREIGN KEY ("quality_id") REFERENCES "fabric_quality"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_information" ADD CONSTRAINT "production_information_job_card_id_fkey" FOREIGN KEY ("job_card_id") REFERENCES "customer_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_information" ADD CONSTRAINT "production_information_delivery_note_id_fkey" FOREIGN KEY ("delivery_note_id") REFERENCES "delivery_note"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_information" ADD CONSTRAINT "production_information_pack_info_id_fkey" FOREIGN KEY ("pack_info_id") REFERENCES "pack_info"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yarn_stock" ADD CONSTRAINT "yarn_stock_job_card_id_fkey" FOREIGN KEY ("job_card_id") REFERENCES "customer_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yarn_stock" ADD CONSTRAINT "yarn_stock_stock_ref_id_fkey" FOREIGN KEY ("stock_ref_id") REFERENCES "stock_ref"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_ref" ADD CONSTRAINT "stock_ref_yarn_type_id_fkey" FOREIGN KEY ("yarn_type_id") REFERENCES "yarn_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_ref" ADD CONSTRAINT "stock_ref_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fabric_content" ADD CONSTRAINT "fabric_content_quality_id_fkey" FOREIGN KEY ("quality_id") REFERENCES "fabric_quality"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fabric_content" ADD CONSTRAINT "fabric_content_yarn_type_id_fkey" FOREIGN KEY ("yarn_type_id") REFERENCES "yarn_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pack_info" ADD CONSTRAINT "pack_info_delivery_note_id_fkey" FOREIGN KEY ("delivery_note_id") REFERENCES "delivery_note"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_note" ADD CONSTRAINT "delivery_note_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_logs" ADD CONSTRAINT "user_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
