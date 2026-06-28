// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import fs from 'node:fs';
import path from 'node:path';

const sidebarFilePath = path.resolve('./src/api-sidebar.json');
const apiSidebarItems = fs.existsSync(sidebarFilePath)
  ? JSON.parse(fs.readFileSync(sidebarFilePath, 'utf-8'))
  : [];

export default defineConfig({
    site: 'https://noinkin.github.io',
    base: '/erlcapi',
	integrations: [
		starlight({
			title: 'ERLCApi',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/noinkin/erlcapi' }],
			sidebar: [
				{
					label: 'Guides',
					items: [
						{ label: 'Getting Started', slug: 'guides/getting-started' },
					],
				},
				{
					label: 'API Reference',
					items: [
                        { label: 'Overview', slug: 'api' },
                        ...apiSidebarItems
                    ]
				},
			],
		}),
	],
});
 