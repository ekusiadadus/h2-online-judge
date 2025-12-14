ALTER TABLE `users` ADD `username` text;--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique_idx` ON `users` (`username`);