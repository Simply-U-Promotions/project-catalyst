CREATE TABLE `llm_api_calls` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`projectId` int,
	`feature` enum('code_generation','codebase_analysis','code_modification','chat') NOT NULL,
	`model` varchar(100) NOT NULL,
	`promptTokens` int NOT NULL,
	`completionTokens` int NOT NULL,
	`totalTokens` int NOT NULL,
	`estimatedCost` int NOT NULL,
	`responseTime` int,
	`success` int NOT NULL DEFAULT 1,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `llm_api_calls_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_cost_summary` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`totalCalls` int NOT NULL DEFAULT 0,
	`totalTokens` int NOT NULL DEFAULT 0,
	`totalCost` int NOT NULL DEFAULT 0,
	`monthlyCallsCount` int NOT NULL DEFAULT 0,
	`monthlyCost` int NOT NULL DEFAULT 0,
	`lastCallAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_cost_summary_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_cost_summary_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `llm_api_calls` ADD CONSTRAINT `llm_api_calls_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `llm_api_calls` ADD CONSTRAINT `llm_api_calls_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_cost_summary` ADD CONSTRAINT `user_cost_summary_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;