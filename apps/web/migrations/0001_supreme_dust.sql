ALTER TABLE `problems` ADD `status` text DEFAULT 'draft' NOT NULL;--> statement-breakpoint
CREATE INDEX `problems_status_created_at_idx` ON `problems` (`status`,`created_at`);