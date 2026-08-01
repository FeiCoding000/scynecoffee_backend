-- Add extra hot option to drink configurations.
ALTER TABLE "drink_configurations" ADD COLUMN "xhot" BOOLEAN NOT NULL DEFAULT false;

-- Include xhot in reusable configuration uniqueness.
DROP INDEX "drink_configurations_unique_config_key";
CREATE UNIQUE INDEX "drink_configurations_unique_config_key" ON "drink_configurations"("category", "drink_type", "milk", "strength", "sugar", "sweetener", "tea_bag_count", "powder_scoops", "iced", "xhot", "decaf");
