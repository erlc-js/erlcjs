# Security Policy

erlc.js talks to the ER:LC API, holds private server API keys, and can expose a
webhook endpoint — so we care about key handling, signature verification, and
command injection.

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Instead, report privately by emailing the maintainers at `noinkin@gmail.com` or `me@devs-des1re.com`. You
can also use GitHub's private vulnerability reporting feature on the repository's
_Security_ tab.

Please include:

- A description of the vulnerability and the affected package or component
- Steps to reproduce (or a minimal test case)
- The impact and any potential exploit scenarios
- Suggested fixes, if you have them

You should receive an acknowledgement within 48 hours and a detailed response
(including next steps) within a week.

## Scope

The following are in scope:

- Webhook signature verification (Ed25519), timestamp/replay handling, and payload
  routing between servers
- API key and global key handling, including leaks through logs, errors, or output
- Command injection or privilege bypass in player helpers and custom in-game
  commands (`:kick`, `:ban`, `:pm`, and similar)
- The local webhook HTTP server: request handling, path matching, malformed or
  oversized payloads, and crash resistance
- Remote fetches performed by `@erlcjs/map` (ER:LC map downloads and Roblox
  headshots)
- Dependency supply chain and the build/publish configuration

Out of scope:

- Vulnerabilities in the ER:LC API or Roblox itself
- Issues that require a compromised server key or an already-compromised machine
- Rate-limit or terms-of-service abuse against the ER:LC API

## Safe defaults

- Webhook requests must carry valid `x-signature-ed25519` and
  `x-signature-timestamp` headers. The signature is verified against ER:LC's
  Ed25519 public key over `timestamp || body`.
- Timestamps outside `webhook.timestampTolerance` (default 5 seconds) are rejected
  as replays.
- Malformed payloads and events for unknown servers are rejected without crashing
  the process.
- Server keys are sent only to `api.erlc.gg` in the `Server-Key` header, and global
  keys only in the `Authorization` header.

## Safe Harbor

We support coordinated disclosure. Researchers who act in good faith — avoiding
privacy violations, destruction of data, and disruption of production services —
will not face legal action from us.

## Security Considerations for Contributors

- Never log API keys or global keys, and never include them in error messages.
- Treat player usernames, reasons, and messages as untrusted when building in-game
  commands. Do not let input change the intended command.
- Never weaken webhook signature verification or the replay/timestamp checks, and
  never make them optional.
- Keep webhook failures contained: a bad payload should not take the process down.
- Do not add remote fetches of user-controlled URLs without validating the target.
