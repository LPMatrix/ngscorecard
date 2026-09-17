ALTER TABLE `indicator_points` ADD `year` integer;--> statement-breakpoint
ALTER TABLE `indicator_points` ADD `period` text;--> statement-breakpoint
ALTER TABLE `indicator_points` ADD `source` text;--> statement-breakpoint
ALTER TABLE `indicator_points` ADD `source_label` text;--> statement-breakpoint
ALTER TABLE `indicator_points` ADD `basis` text;--> statement-breakpoint
ALTER TABLE `indicator_points` ADD `note` text;--> statement-breakpoint
ALTER TABLE `indicators` ADD `registry_key` text;--> statement-breakpoint
ALTER TABLE `indicators` ADD `status` text;--> statement-breakpoint
ALTER TABLE `indicators` ADD `checked` text;--> statement-breakpoint
ALTER TABLE `indicators` ADD `display_order` integer;