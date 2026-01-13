CREATE TABLE "prelevements" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"day" integer NOT NULL,
	"amount" real NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
