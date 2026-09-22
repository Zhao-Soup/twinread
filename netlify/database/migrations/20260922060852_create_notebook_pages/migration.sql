CREATE TABLE "pages" (
	"id" text PRIMARY KEY,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "pages_user_updated_idx" ON "pages" ("user_id","updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "pages_user_title_unique" ON "pages" ("user_id","title");