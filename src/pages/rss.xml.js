import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const notes = await getCollection('notes', ({ data }) => !data.draft);
  return rss({
    title: 'Field Notes',
    description: 'Reviewed engineering notes on systems, evidence, and research.',
    site: context.site,
    items: notes
      .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
      .map((note) => ({
        title: note.data.title,
        pubDate: note.data.pubDate,
        description: note.data.description,
        link: `/notes/${note.data.slug}/`,
      })),
  });
}
