import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://curburenthusiasm.github.io',
  base: '/personal-site',
  output: 'static',
  trailingSlash: 'always',
});
