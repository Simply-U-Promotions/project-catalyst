CREATE TABLE `custom_domains` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deploymentId` int NOT NULL,
	`domain` varchar(255) NOT NULL,
	`status` enum('pending','verifying','active','failed') NOT NULL DEFAULT 'pending',
	`sslStatus` enum('none','pending','active','expired','failed') NOT NULL DEFAULT 'none',
	`sslCertificate` text,
	`sslPrivateKey` text,
	`sslExpiresAt` timestamp,
	`verificationToken` varchar(255),
	`verifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `custom_domains_id` PRIMARY KEY(`id`),
	CONSTRAINT `custom_domains_domain_unique` UNIQUE(`domain`)
);
--> statement-breakpoint
CREATE TABLE `deployment_env_vars` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deploymentId` int NOT NULL,
	`key` varchar(255) NOT NULL,
	`value` text NOT NULL,
	`isSecret` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `deployment_env_vars_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `custom_domains` ADD CONSTRAINT `custom_domains_deploymentId_built_in_deployments_id_fk` FOREIGN KEY (`deploymentId`) REFERENCES `built_in_deployments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `deployment_env_vars` ADD CONSTRAINT `deployment_env_vars_deploymentId_built_in_deployments_id_fk` FOREIGN KEY (`deploymentId`) REFERENCES `built_in_deployments`(`id`) ON DELETE no action ON UPDATE no action;