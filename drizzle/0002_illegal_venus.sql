CREATE TABLE `provisioned_databases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`type` enum('postgresql','mysql','mongodb','redis') NOT NULL,
	`name` varchar(255) NOT NULL,
	`host` varchar(255) NOT NULL,
	`port` int NOT NULL,
	`username` varchar(255) NOT NULL,
	`password` varchar(255) NOT NULL,
	`database` varchar(255) NOT NULL,
	`status` enum('provisioning','active','failed','deleted') NOT NULL DEFAULT 'provisioning',
	`connectionString` text,
	`size` varchar(50) DEFAULT 'small',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `provisioned_databases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `provisioned_databases` ADD CONSTRAINT `provisioned_databases_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;