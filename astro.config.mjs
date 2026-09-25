// @ts-check
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';

// Sem domínio próprio até a 1ª clínica pagante (ruling L-3). SITE_URL entra
// quando houver endereço definitivo; sem ele não emitimos canonical/sitemap
// apontando para lugar nenhum.
export default defineConfig({
  site: process.env.SITE_URL || undefined,
  integrations: [preact()],
  build: { inlineStylesheets: 'always' },
  compressHTML: true,
});
