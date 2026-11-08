import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { DOCS, PACKAGE_VERSION } from './generated.js';
import {
  findDoc,
  formatDocList,
  formatSearchResults,
  renderDoc,
  renderDocsIndex,
  searchDocs,
} from './docs.js';

const SERVER_INSTRUCTIONS = `This server exposes the official erlc.js documentation for the Emergency Response: Liberty County API.

Before answering questions about erlc.js, use search_docs to find relevant pages and get_doc to read the full Markdown. Do not guess API names, method signatures, event names, or configuration options. If a page does not cover the answer, say so.

The documentation is bundled with @erlcjs/core, so it works offline. Paths use /docs/... routes. Resources are also available under erlcjs://docs.`;

function toolError(message: string) {
  return {
    content: [{ type: 'text' as const, text: message }],
    isError: true,
  };
}

export async function createMcpServer(): Promise<McpServer> {
  const server = new McpServer(
    {
      name: 'erlcjs',
      version: PACKAGE_VERSION,
    },
    {
      instructions: SERVER_INSTRUCTIONS,
    },
  );

  server.registerTool(
    'search_docs',
    {
      title: 'Search erlc.js docs',
      description:
        'Search the bundled erlc.js documentation. Returns matching pages with a path, URL, description, and snippet. Use get_doc to read a result in full.',
      inputSchema: {
        query: z.string().min(1).describe('Search query, symbol name, event name, or error message'),
        limit: z
          .number()
          .int()
          .min(1)
          .max(20)
          .optional()
          .describe('Maximum number of results to return (default 8)'),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ query, limit }) => {
      const hits = searchDocs(query, limit ?? 8);
      return {
        content: [{ type: 'text', text: formatSearchResults(query, hits) }],
      };
    },
  );

  server.registerTool(
    'get_doc',
    {
      title: 'Read an erlc.js doc page',
      description:
        'Read a full documentation page as Markdown. Accepts /docs/... paths, slugs such as guides/getting-started, full URLs, or erlcjs://docs/... resource URIs.',
      inputSchema: {
        path: z
          .string()
          .min(1)
          .describe('Doc path, slug, URL, or erlcjs://docs/... URI'),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ path }) => {
      const doc = findDoc(path);

      if (!doc) {
        return toolError(
          `Doc not found: ${path}. Use search_docs to find the right page, or list_docs to browse available pages.`,
        );
      }

      return {
        content: [{ type: 'text', text: renderDoc(doc) }],
      };
    },
  );

  server.registerTool(
    'list_docs',
    {
      title: 'List erlc.js doc pages',
      description:
        'List the bundled documentation pages grouped by section. Use the optional section filter to narrow results to overview, guides, or api.',
      inputSchema: {
        section: z
          .string()
          .optional()
          .describe('Optional section filter: overview, guides, or api'),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ section }) => {
      return {
        content: [{ type: 'text', text: formatDocList(section) }],
      };
    },
  );

  server.registerPrompt(
    'answer-from-docs',
    {
      title: 'Answer from erlc.js docs',
      description:
        'Guide an agent to search and read the bundled erlc.js docs before answering.',
      argsSchema: {
        question: z.string().min(1).describe('The erlc.js question to answer'),
      },
    },
    ({ question }) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Use the erlcjs MCP server to answer this question.

1. Call search_docs with the key terms from the question.
2. Call get_doc on the most relevant paths.
3. Answer only from those docs, and mention the doc paths you used.

Question: ${question}`,
          },
        },
      ],
    }),
  );

  server.registerResource(
    'docs-index',
    'erlcjs://docs',
    {
      title: 'erlc.js documentation index',
      description: `JSON index of all ${DOCS.length} bundled erlc.js documentation pages.`,
      mimeType: 'application/json',
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: 'application/json',
          text: renderDocsIndex(),
        },
      ],
    }),
  );

  for (const doc of DOCS) {
    const uri = `erlcjs://docs/${doc.slug}`;
    server.registerResource(
      `doc-${doc.slug}`,
      uri,
      {
        title: doc.title,
        description: doc.description,
        mimeType: 'text/markdown',
      },
      async (resourceUri) => ({
        contents: [
          {
            uri: resourceUri.href,
            mimeType: 'text/markdown',
            text: renderDoc(doc),
          },
        ],
      }),
    );
  }

  return server;
}

export async function startMcpServer(): Promise<void> {
  const server = await createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
