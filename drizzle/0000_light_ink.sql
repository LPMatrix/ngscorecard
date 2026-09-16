CREATE TABLE `api_keys` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`email` text NOT NULL,
	`tier` text DEFAULT 'free' NOT NULL,
	`created_at` text NOT NULL,
	`last_used_at` text,
	`request_count` integer DEFAULT 0 NOT NULL,
	`revoked` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `api_keys_key_unique` ON `api_keys` (`key`);--> statement-breakpoint
CREATE TABLE `appointments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`administration` text NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`agency` text NOT NULL,
	`category` text NOT NULL,
	`state` text NOT NULL,
	`geopolitical` text NOT NULL,
	`appointed` text NOT NULL,
	`status` text NOT NULL,
	`note` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `bills` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`administration` text NOT NULL,
	`title` text NOT NULL,
	`category` text NOT NULL,
	`status` text NOT NULL,
	`chamber` text,
	`introduced` text,
	`signed` text,
	`summary` text NOT NULL,
	`outcome` text NOT NULL,
	`source` text NOT NULL,
	`source_label` text NOT NULL,
	`updated` text NOT NULL,
	`source_tier` text
);
--> statement-breakpoint
CREATE TABLE `budget` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`administration` text NOT NULL,
	`year` integer NOT NULL,
	`total_bn` real NOT NULL,
	`revenue_bn` real,
	`actual_revenue_bn` real,
	`debt_service_bn` real,
	`capital_bn` real,
	`recurrent_bn` real,
	`implementation_pct` real,
	`deficit_bn` real,
	`note` text,
	`source` text NOT NULL,
	`source_label` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `budget_ministries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`budget_year` integer NOT NULL,
	`administration` text NOT NULL,
	`name` text NOT NULL,
	`allocation_bn` real NOT NULL,
	`released_pct` real,
	`note` text
);
--> statement-breakpoint
CREATE TABLE `corrections` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`entry_table` text,
	`entry_id` integer,
	`administration` text,
	`url` text,
	`kind` text DEFAULT 'other' NOT NULL,
	`body` text NOT NULL,
	`source_url` text,
	`email` text,
	`status` text DEFAULT 'new' NOT NULL,
	`admin_note` text,
	`ip_hash` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `entry_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`entry_table` text NOT NULL,
	`entry_id` integer NOT NULL,
	`administration` text,
	`kind` text NOT NULL,
	`field` text NOT NULL,
	`old_value` text,
	`new_value` text,
	`note` text,
	`changed_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `fraud` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`administration` text NOT NULL,
	`title` text NOT NULL,
	`category` text NOT NULL,
	`status` text NOT NULL,
	`amount` text,
	`year` integer,
	`allegation` text NOT NULL,
	`outcome` text NOT NULL,
	`response_verdict` text,
	`govt_response` text,
	`source` text NOT NULL,
	`source_label` text NOT NULL,
	`updated` text NOT NULL,
	`source_tier` text,
	`court_case_ref` text,
	`days_pending` integer
);
--> statement-breakpoint
CREATE TABLE `governors` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`administration` text NOT NULL,
	`name` text NOT NULL,
	`state` text NOT NULL,
	`party` text NOT NULL,
	`geopolitical` text NOT NULL,
	`term_start` text NOT NULL,
	`term_end` text,
	`status` text NOT NULL,
	`note` text
);
--> statement-breakpoint
CREATE TABLE `history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`administration` text NOT NULL,
	`label` text NOT NULL,
	`kept` integer NOT NULL,
	`partial` integer NOT NULL,
	`broken` integer NOT NULL,
	`pending` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `indicator_points` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`indicator_id` integer NOT NULL,
	`administration` text NOT NULL,
	`label` text NOT NULL,
	`value` real NOT NULL
);
--> statement-breakpoint
CREATE TABLE `indicators` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`administration` text NOT NULL,
	`key` text NOT NULL,
	`label` text NOT NULL,
	`unit` text NOT NULL,
	`color` text NOT NULL,
	`description` text NOT NULL,
	`source` text NOT NULL,
	`source_label` text NOT NULL,
	`note` text,
	`higher_is_better` integer
);
--> statement-breakpoint
CREATE TABLE `inherited` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`administration` text NOT NULL,
	`title` text NOT NULL,
	`category` text NOT NULL,
	`status` text NOT NULL,
	`problem` text NOT NULL,
	`resolution` text NOT NULL,
	`source` text NOT NULL,
	`source_label` text NOT NULL,
	`updated` text NOT NULL,
	`source_tier` text
);
--> statement-breakpoint
CREATE TABLE `judgments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`administration` text NOT NULL,
	`title` text NOT NULL,
	`court` text NOT NULL,
	`category` text NOT NULL,
	`status` text NOT NULL,
	`compliance` text,
	`ruled` text NOT NULL,
	`issue` text NOT NULL,
	`outcome` text NOT NULL,
	`source` text,
	`source_label` text,
	`source_tier` text
);
--> statement-breakpoint
CREATE TABLE `ministers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`administration` text NOT NULL,
	`name` text NOT NULL,
	`ministry` text NOT NULL,
	`appointed` text,
	`status` text NOT NULL,
	`serving` integer,
	`mandate` text NOT NULL,
	`performance` text NOT NULL,
	`source` text,
	`source_label` text,
	`updated` text,
	`source_tier` text
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`administration` text NOT NULL,
	`title` text NOT NULL,
	`category` text NOT NULL,
	`status` text NOT NULL,
	`signed` text,
	`directive` text NOT NULL,
	`effect` text NOT NULL,
	`source` text NOT NULL,
	`source_label` text NOT NULL,
	`updated` text NOT NULL,
	`source_tier` text
);
--> statement-breakpoint
CREATE TABLE `presidents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`name` text NOT NULL,
	`full_name` text NOT NULL,
	`term_start` text NOT NULL,
	`term_end` text,
	`tagline` text,
	`party` text,
	`reviewed` text NOT NULL,
	`level` text DEFAULT 'federal' NOT NULL,
	`state` text,
	`is_current` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `presidents_key_unique` ON `presidents` (`key`);--> statement-breakpoint
CREATE TABLE `promises` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`administration` text NOT NULL,
	`title` text NOT NULL,
	`category` text NOT NULL,
	`status` text NOT NULL,
	`promise` text NOT NULL,
	`assessment` text NOT NULL,
	`source` text NOT NULL,
	`source_label` text NOT NULL,
	`updated` text NOT NULL,
	`flag` text,
	`related` text,
	`theme` text,
	`source_tier` text
);
--> statement-breakpoint
CREATE TABLE `themes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`blurb` text NOT NULL,
	`category` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `themes_slug_unique` ON `themes` (`slug`);