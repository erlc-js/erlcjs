import { PACKAGE_VERSION } from './generated.js';
import { startMcpServer } from './mcp.js';

const HELP = `erlcjs <command>

Commands:
  mcp       Start the erlc.js documentation MCP server over stdio
  version   Print the installed @erlcjs/core version
  help      Show this help

MCP client configuration:
  {
    "mcpServers": {
      "erlcjs": {
        "command": "erlcjs",
        "args": ["mcp"]
      }
    }
  }

If @erlcjs/core is not installed globally, use:
  npx -y @erlcjs/core mcp
`;

function printHelp(): void {
  console.log(HELP.trimEnd());
}

export async function runCli(argv: string[]): Promise<void> {
  const [command] = argv;

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    printHelp();
    return;
  }

  if (command === 'version' || command === '--version' || command === '-v') {
    console.log(PACKAGE_VERSION);
    return;
  }

  if (command === 'mcp') {
    await startMcpServer();
    return;
  }

  console.error(`Unknown command: ${command}`);
  console.error('');
  printHelp();
  process.exitCode = 1;
}
