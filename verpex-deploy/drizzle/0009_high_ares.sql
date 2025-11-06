CREATE TABLE `billing_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`billingPeriodStart` timestamp NOT NULL,
	`billingPeriodEnd` timestamp NOT NULL,
	`totalCost` int NOT NULL,
	`aiCost` int NOT NULL,
	`deploymentCost` int NOT NULL,
	`databaseCost` int NOT NULL,
	`status` enum('pending','paid','overdue','waived') NOT NULL DEFAULT 'pending',
	`invoiceUrl` varchar(500),
	`paidAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `billing_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cost_alert_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alertId` int NOT NULL,
	`userId` int NOT NULL,
	`threshold` int NOT NULL,
	`actualValue` int NOT NULL,
	`message` text NOT NULL,
	`acknowledged` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cost_alert_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cost_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`alertType` enum('daily','weekly','monthly','total') NOT NULL,
	`threshold` int NOT NULL,
	`currentValue` int NOT NULL DEFAULT 0,
	`isActive` int NOT NULL DEFAULT 1,
	`lastTriggeredAt` timestamp,
	`notificationMethod` enum('email','dashboard','both') NOT NULL DEFAULT 'both',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cost_alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fair_use_policy_violations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`violationType` enum('daily_cost_limit','monthly_cost_limit','rate_limit','abuse_detected','suspicious_activity') NOT NULL,
	`description` text NOT NULL,
	`severity` enum('warning','critical') NOT NULL,
	`actionTaken` enum('none','warning_sent','rate_limited','account_suspended') NOT NULL DEFAULT 'none',
	`resolved` int NOT NULL DEFAULT 0,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fair_use_policy_violations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `usage_analytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`projectsCreated` int NOT NULL DEFAULT 0,
	`codeGenerations` int NOT NULL DEFAULT 0,
	`deploymentsTriggered` int NOT NULL DEFAULT 0,
	`githubCommits` int NOT NULL DEFAULT 0,
	`aiTokensUsed` int NOT NULL DEFAULT 0,
	`costIncurred` int NOT NULL DEFAULT 0,
	`activeMinutes` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `usage_analytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `billing_records` ADD CONSTRAINT `billing_records_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cost_alert_history` ADD CONSTRAINT `cost_alert_history_alertId_cost_alerts_id_fk` FOREIGN KEY (`alertId`) REFERENCES `cost_alerts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cost_alert_history` ADD CONSTRAINT `cost_alert_history_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cost_alerts` ADD CONSTRAINT `cost_alerts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fair_use_policy_violations` ADD CONSTRAINT `fair_use_policy_violations_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `usage_analytics` ADD CONSTRAINT `usage_analytics_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;