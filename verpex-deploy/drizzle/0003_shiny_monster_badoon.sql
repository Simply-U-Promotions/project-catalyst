ALTER TABLE `deployments` ADD `provider` enum('vercel','railway','kubernetes') DEFAULT 'vercel' NOT NULL;--> statement-breakpoint
ALTER TABLE `deployments` ADD `providerDeploymentId` varchar(255);