CREATE TABLE `built_in_deployments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`userId` int NOT NULL,
	`containerId` varchar(255),
	`subdomain` varchar(255) NOT NULL,
	`deploymentUrl` varchar(500) NOT NULL,
	`status` enum('pending','building','running','stopped','failed') NOT NULL DEFAULT 'pending',
	`buildLogs` text,
	`runtimeLogs` text,
	`errorMessage` text,
	`port` int,
	`cpuLimit` int DEFAULT 1000,
	`memoryLimit` int DEFAULT 512,
	`storageLimit` int DEFAULT 1024,
	`healthCheckUrl` varchar(500),
	`lastHealthCheck` timestamp,
	`healthStatus` enum('healthy','unhealthy','unknown') DEFAULT 'unknown',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`stoppedAt` timestamp,
	CONSTRAINT `built_in_deployments_id` PRIMARY KEY(`id`),
	CONSTRAINT `built_in_deployments_subdomain_unique` UNIQUE(`subdomain`)
);
--> statement-breakpoint
CREATE TABLE `deployment_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deploymentId` int NOT NULL,
	`logType` enum('build','runtime','error') NOT NULL,
	`message` text NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `deployment_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `built_in_deployments` ADD CONSTRAINT `built_in_deployments_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `built_in_deployments` ADD CONSTRAINT `built_in_deployments_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `deployment_logs` ADD CONSTRAINT `deployment_logs_deploymentId_built_in_deployments_id_fk` FOREIGN KEY (`deploymentId`) REFERENCES `built_in_deployments`(`id`) ON DELETE no action ON UPDATE no action;