-- Create drink preference enums.
CREATE TYPE "DrinkCategory" AS ENUM ('COFFEE', 'TEA', 'CHAI', 'CHOCOLATE', 'MILK', 'OTHER');
CREATE TYPE "MilkType" AS ENUM ('FULL', 'LITE', 'ALMOND', 'SOY', 'LACTOSE_FREE', 'OAT', 'NONE');
CREATE TYPE "DrinkStrength" AS ENUM ('HALF', 'ONE', 'TWO', 'THREE', 'FOUR');
CREATE TYPE "PortionAmount" AS ENUM ('ZERO', 'HALF', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE');

-- Create drink configurations table.
CREATE TABLE "drink_configurations" (
    "id" TEXT NOT NULL,
    "category" "DrinkCategory" NOT NULL,
    "drink_type" TEXT NOT NULL,
    "milk" "MilkType" NOT NULL DEFAULT 'NONE',
    "strength" "DrinkStrength",
    "sugar" "PortionAmount" NOT NULL DEFAULT 'ZERO',
    "sweetener" "PortionAmount" NOT NULL DEFAULT 'ZERO',
    "tea_bag_count" "PortionAmount",
    "powder_scoops" "PortionAmount",
    "iced" BOOLEAN NOT NULL DEFAULT false,
    "decaf" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drink_configurations_pkey" PRIMARY KEY ("id")
);

-- Create preferred drinks table.
CREATE TABLE "preferred_drinks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "drink_configuration_id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "sort_order" INTEGER,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "preferred_drinks_pkey" PRIMARY KEY ("id")
);

-- Create indexes.
CREATE UNIQUE INDEX "drink_configurations_unique_config_key" ON "drink_configurations"("category", "drink_type", "milk", "strength", "sugar", "sweetener", "tea_bag_count", "powder_scoops", "iced", "decaf");
CREATE INDEX "preferred_drinks_user_id_idx" ON "preferred_drinks"("user_id");
CREATE INDEX "preferred_drinks_drink_configuration_id_idx" ON "preferred_drinks"("drink_configuration_id");

-- Add foreign keys.
ALTER TABLE "preferred_drinks" ADD CONSTRAINT "preferred_drinks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "preferred_drinks" ADD CONSTRAINT "preferred_drinks_drink_configuration_id_fkey" FOREIGN KEY ("drink_configuration_id") REFERENCES "drink_configurations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
