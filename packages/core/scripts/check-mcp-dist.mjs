import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const transport = new StdioClientTransport({
  command: process.execPath,
  args: ['dist/cli.js', 'mcp'],
  cwd: process.cwd(),
  stderr: 'pipe',
});

const client = new Client({ name: 'erlcjs-dist-smoke', version: '1.0.0' });

try {
  await client.connect(transport);

  const tools = await client.listTools();
  const names = tools.tools.map((tool) => tool.name).sort();
  if (names.join(',') !== 'get_doc,list_docs,search_docs') {
    throw new Error(`unexpected tools: ${names.join(', ')}`);
  }

  const search = await client.callTool({
    name: 'search_docs',
    arguments: { query: 'playerJoin', limit: 3 },
  });
  const searchText = search.content?.[0]?.text ?? '';
  if (!searchText.includes('/docs/guides/events/')) {
    throw new Error('search_docs did not return the events guide');
  }

  const resources = await client.listResources();
  if (resources.resources.length < 90) {
    throw new Error(`expected bundled docs resources, found ${resources.resources.length}`);
  }

  const page = await client.readResource({ uri: 'erlcjs://docs/guides/mcp' });
  const pageText = page.contents?.[0]?.text ?? '';
  if (!pageText.includes('erlcjs mcp')) {
    throw new Error('MCP docs page is missing or empty');
  }

  console.log(
    `dist MCP smoke test passed: ${names.length} tools, ${resources.resources.length} resources`,
  );
} finally {
  await client.close();
}
