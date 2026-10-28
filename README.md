# Field Notes — anonymous engineering portfolio

This repository builds a static Astro site for engineering case studies and reviewed field notes. It contains no analytics, trackers, third-party cookies, or externally hosted fonts. Theme preference is stored locally in the browser only.

The public site deliberately omits personal identity, employer and customer names, internal host or database identifiers, and sensitive operational details. Case studies distinguish established results from prototypes, research, and plans. The portfolio includes live `/macro/` and `/picks/` pages; their source scripts read public JSON feeds.

## Add a project

1. Copy `templates/project.md` into `src/content/projects/` using a short kebab-case filename.
2. Fill in the frontmatter. `slug` should match the filename, `summary` must stay under 200 characters, `status` must be one of `production`, `prototype`, `research`, `concept`, or `in-progress`, and `order` controls listing order.
3. Use the seven case-study headings in the template. Set `featured: true` only for a project shown on Home. Set `diagram: true` when a pre-rendered diagram is available under `public/diagrams/` and add its slug to `src/pages/projects/[slug].astro`.
4. Include `repoUrl` only for a public repository that has been checked for secrets and confidential material.

## Add a note

1. Copy `templates/note.md` into `src/content/notes/`.
2. Write a short description and set `pubDate`.
3. Keep `draft: true` until reviewed. Draft pages are built for direct review but are excluded from the Notes listing and RSS feed. Change to `false` to publish them in those surfaces.

## Local build and publication

```sh
npm ci
bash scripts/redaction-check.sh
npm run dev
npm run build
```

The redaction check runs in CI before the build. GitHub Pages deploys from the `master` branch using the official Astro build action and Pages deploy action. In repository settings, Pages must use **GitHub Actions** as its source. The live pick publisher and scoreboard refresh scripts retain `data/` as their canonical write location; the build copies that directory into `public/data/`.

## Privacy review

Before publishing a new project, recheck the text, diagrams, code samples, links, and generated output against the redaction rules in the site specification. The automated check catches known patterns but does not replace a human review.
