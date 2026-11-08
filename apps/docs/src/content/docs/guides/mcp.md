---
title: MCP server
description: Use the erlc.js docs from any MCP-capable AI agent.
order: 10
---

`@erlcjs/core` ships an MCP server with the full erlc.js documentation bundled into the package. Agents can search guides and API pages, read full Markdown pages, and browse the docs without making network requests.

## Requirements

- Node.js 20 or newer
- `@erlcjs/core` installed globally, or available through `npx`

## Commands

```sh
erlcjs version
erlcjs mcp
```

`erlcjs version` prints the installed core version. `erlcjs mcp` starts the MCP server over stdio. The command stays quiet on stdout so the MCP client can use the stream for protocol messages.

## Client configuration

Add the server to any MCP client:

```json
{
  "mcpServers": {
    "erlcjs": {
      "command": "erlcjs",
      "args": ["mcp"]
    }
  }
}
```

If `@erlcjs/core` is not installed globally, launch it with `npx`:

```json
{
  "mcpServers": {
    "erlcjs": {
      "command": "npx",
      "args": ["-y", "@erlcjs/core", "mcp"]
    }
  }
}
```

## Tools

- `search_docs` finds pages by topic, symbol, event, error, or configuration name.
- `get_doc` reads a page as Markdown. It accepts `/docs/...` paths, slugs, full URLs, and `erlcjs://docs/...` URIs.
- `list_docs` lists every page grouped by section, with an optional `overview`, `guides`, or `api` filter.

## Resources

- `erlcjs://docs` is a JSON index of every page.
- `erlcjs://docs/<slug>` is a Markdown page, for example `erlcjs://docs/guides/getting-started`.

## Prompt

The `answer-from-docs` prompt gives an agent a simple workflow: search the docs, read the relevant pages, then answer with the paths it used.
