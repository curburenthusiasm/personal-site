import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const projects = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    summary: z.string().max(200),
    status: z.enum(['production', 'prototype', 'research', 'concept', 'in-progress']),
    featured: z.boolean(),
    tags: z.array(z.string()),
    stack: z.array(z.string()),
    diagram: z.boolean(),
    order: z.number(),
    repoUrl: z.string().url().optional(),
    liveUrl: z.string().url().optional(),
  }),
});

const notes = defineCollection({
  loader: glob({ base: './src/content/notes', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    draft: z.boolean().default(false),
    category: z.string().default('Field note'),
  }),
});

export const collections = { projects, notes };
