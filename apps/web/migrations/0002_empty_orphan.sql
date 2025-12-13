CREATE TABLE `submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`problem_id` text NOT NULL,
	`user_id` text NOT NULL,
	`code` text NOT NULL,
	`status` text DEFAULT 'error' NOT NULL,
	`step_count` integer,
	`code_length` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`problem_id`) REFERENCES `problems`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `submissions_problem_id_idx` ON `submissions` (`problem_id`);--> statement-breakpoint
CREATE INDEX `submissions_user_id_idx` ON `submissions` (`user_id`);--> statement-breakpoint
CREATE INDEX `submissions_problem_status_idx` ON `submissions` (`problem_id`,`status`);