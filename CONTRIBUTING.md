# Contributing to H2 Online Judge

Thanks for your interest in improving H2 Online Judge! This guide helps you get set up and make effective contributions.

## Getting Started

- Node.js 22+, pnpm 9+
- Clone and install: `pnpm install`
- Start dev servers: `pnpm dev`
- Run tests: `pnpm test`
- Lint and type check: `pnpm lint && pnpm check-types`

## Repo Structure

- `apps/web` — Next.js 16 frontend (app router)
- `apps/docs` — Documentation site
- `h2lang` — Rust compiler (WASM)
- `packages/*` — Shared UI, ESLint and TS configs

## Picking an Issue

- Good first issues: https://github.com/ekusiadadus/h2-online-judge/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22
- Help wanted: https://github.com/ekusiadadus/h2-online-judge/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22

If you are unsure, open a discussion or comment on the issue to get guidance.

## Development Tips

- Keep PRs focused and small; include tests when possible.
- Follow existing code style and naming patterns.
- For UI changes, add screenshots or a brief video if helpful.
- Avoid committing secrets. Use `.env.example` as a reference and keep your local `.env` untracked.
- Run `pnpm secret-scan` before opening a PR to avoid accidental leaks.

## Commit Messages

Use conventional, clear messages (e.g., `feat:`, `fix:`, `chore:`, `docs:`). A short summary line and a few bullets in the body goes a long way.

## Code of Conduct

Be kind, respectful, and constructive. We strive for a welcoming and inclusive community.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
