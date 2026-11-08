import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { DOCS, PACKAGE_VERSION } from './generated.js';

const coreRoot = fileURLToPath(new URL('../../', import.meta.url));
const cliPath = path.join(coreRoot, 'src', 'cli.ts');

function cli(args: string[]) {
  return execFileSync(process.execPath, ['--import', 'tsx', cliPath, ...args], {
    cwd: coreRoot,
    encoding: 'utf8',
  }).trim();
}

describe('erlcjs CLI', () => {
  it('prints the package version', () => {
    expect(cli(['version'])).toBe(PACKAGE_VERSION);
  });

  it('prints help with the MCP command', () => {
    const help = cli(['help']);
    expect(help).toContain('erlcjs <command>');
    expect(help).toContain('mcp');
    expect(help).toContain('version');
    expect(help).toContain('npx -y @erlcjs/core mcp');
  });

  it('rejects unknown commands', () => {
    const result = spawnSync(process.execPath, ['--import', 'tsx', cliPath, 'nope'], {
      cwd: coreRoot,
      encoding: 'utf8',
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Unknown command: nope');
  });
});

describe('erlcjs mcp end to end', () => {
  let client: Client;

  beforeAll(async () => {
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: ['--import', 'tsx', cliPath, 'mcp'],
      cwd: coreRoot,
      stderr: 'pipe',
    });

    client = new Client({ name: 'erlcjs-e2e', version: '1.0.0' });
    await client.connect(transport);
  }, 20_000);

  afterAll(async () => {
    await client?.close();
  });

  it('identifies the server and exposes instructions', () => {
    const version = client.getServerVersion();
    expect(version?.name).toBe('erlcjs');
    expect(version?.version).toBe(PACKAGE_VERSION);
    expect(client.getInstructions()).toContain('search_docs');
  });

  it('lists the docs tools', async () => {
    const { tools } = await client.listTools();
    const names = tools.map((tool) => tool.name).sort();

    expect(names).toEqual(['get_doc', 'list_docs', 'search_docs']);
  });

  it('searches the bundled docs', async () => {
    const result = await client.callTool({
      name: 'search_docs',
      arguments: { query: 'playerJoin', limit: 5 },
    });

    expect(result.isError).not.toBe(true);
    expect(textOf(result)).toContain('/docs/guides/events/');
  });

  it('reads a full guide through get_doc', async () => {
    const result = await client.callTool({
      name: 'get_doc',
      arguments: { path: '/docs/guides/players/' },
    });

    expect(result.isError).not.toBe(true);
    expect(textOf(result)).toContain('# Managing Players');
    expect(textOf(result)).toContain('## Player properties');
  });

  it('lists API pages', async () => {
    const result = await client.callTool({
      name: 'list_docs',
      arguments: { section: 'api' },
    });

    expect(textOf(result)).toContain('## API Reference');
    expect(textOf(result)).toContain('/docs/api/core/client/');
  });

  it('returns a useful error for missing docs', async () => {
    const result = await client.callTool({
      name: 'get_doc',
      arguments: { path: 'guides/not-real' },
    });

    expect(result.isError).toBe(true);
    expect(textOf(result)).toContain('list_docs');
  });

  it('lists every doc as an MCP resource', async () => {
    const { resources } = await client.listResources();
    const uris = resources.map((resource) => resource.uri);

    expect(resources.length).toBe(DOCS.length + 1);
    expect(uris).toContain('erlcjs://docs');
    expect(uris).toContain('erlcjs://docs/guides/getting-started');
  });

  it('reads docs resources as markdown', async () => {
    const result = await client.readResource({
      uri: 'erlcjs://docs/guides/getting-started',
    });

    const content = result.contents[0];
    expect(content?.mimeType).toBe('text/markdown');
    expect(content && 'text' in content ? content.text : '').toContain(
      '# Getting Started with erlc.js',
    );
  });

  it('serves a JSON index resource', async () => {
    const result = await client.readResource({ uri: 'erlcjs://docs' });
    const content = result.contents[0];
    const text = content && 'text' in content ? content.text : '';
    const index = JSON.parse(text) as { count: number; docs: unknown[] };

    expect(index.count).toBe(DOCS.length);
    expect(index.docs.length).toBe(DOCS.length);
  });

  it('exposes a docs prompt', async () => {
    const { prompts } = await client.listPrompts();
    expect(prompts.some((prompt) => prompt.name === 'answer-from-docs')).toBe(true);

    const prompt = await client.getPrompt({
      name: 'answer-from-docs',
      arguments: { question: 'How do I kick a player?' },
    });

    const content = prompt.messages[0]?.content;
    expect(content && content.type === 'text' ? content.text : '').toContain(
      'How do I kick a player?',
    );
  });
});

function textOf(result: unknown): string {
  const content = (result as { content?: Array<{ type?: string; text?: string }> }).content;
  return (content ?? [])
    .filter((item) => item.type === 'text')
    .map((item) => item.text ?? '')
    .join('\n');
}
