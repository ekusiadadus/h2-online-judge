CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text,
	`role` text DEFAULT 'user' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `problems` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`difficulty` text DEFAULT 'easy' NOT NULL,
	`author_id` text NOT NULL,
	`is_public` integer DEFAULT false NOT NULL,
	`grid_size` integer DEFAULT 25 NOT NULL,
	`start_position_json` text NOT NULL,
	`goals_json` text DEFAULT '[]' NOT NULL,
	`walls_json` text DEFAULT '[]' NOT NULL,
	`traps_json` text DEFAULT '[]' NOT NULL,
	`sample_code` text DEFAULT '' NOT NULL,
	`max_steps` integer DEFAULT 1000 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `problems_is_public_created_at_idx` ON `problems` (`is_public`,`created_at`);--> statement-breakpoint
CREATE INDEX `problems_author_id_created_at_idx` ON `problems` (`author_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_slug_unique` ON `tags` (`slug`);--> statement-breakpoint
CREATE TABLE `problem_tags` (
	`problem_id` text NOT NULL,
	`tag_id` text NOT NULL,
	PRIMARY KEY(`problem_id`, `tag_id`),
	FOREIGN KEY (`problem_id`) REFERENCES `problems`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `problem_tags_problem_id_idx` ON `problem_tags` (`problem_id`);--> statement-breakpoint
CREATE INDEX `problem_tags_tag_id_idx` ON `problem_tags` (`tag_id`);