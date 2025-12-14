# H2 Online Judge

[![CI](https://github.com/ekusiadadus/h2-online-judge/actions/workflows/ci.yml/badge.svg)](https://github.com/ekusiadadus/h2-online-judge/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

> A visual online judge for the H2 programming language — control robots with minimal code, powered by Rust/WebAssembly.

## Features

- **HOJ-Compatible H2 Language**: Based on the Herbert Online Judge language with extended features
- **Multi-Agent Support**: Control multiple robots simultaneously with parallel execution
- **Visual Execution**: Watch your code run step-by-step on a 25x25 grid
- **Problem Editor**: Create and share custom puzzles with goals, walls, and traps
- **Fully Client-Side**: Runs entirely in the browser using WebAssembly — fast and secure
- **Internationalization**: Available in English and Japanese

## Quick Start

### Prerequisites

- Node.js 22+
- pnpm 9+

### Development

```bash
# Clone the repository
git clone https://github.com/ekusiadadus/h2-online-judge.git
cd h2-online-judge

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Open [http://localhost:4000](http://localhost:4000) in your browser.

## H2 Language Overview

H2 is a minimal robot programming language:

```
# Basic commands
s     # Move straight (forward)
r     # Rotate right (90°)
l     # Rotate left (90°)

# Repeat
sss   # Move forward 3 times
rr    # Rotate 180°

# Macros (uppercase names)
M: ss r ss l
M M   # Execute macro twice

# Functions with parameters
F(n): s F(n-1)
F(n=0):
F(5)  # Move forward 5 times (recursive)

# Multi-agent
@0: sss
@1: rrr
```

## Architecture

```
h2-online-judge/
├── apps/
│   ├── web/          # Next.js 16 frontend
│   └── docs/         # Documentation site
├── h2lang/           # Rust compiler (WASM)
└── packages/
    ├── ui/           # Shared UI components
    ├── eslint-config/
    └── typescript-config/
```

### Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS v4
- **Compiler**: Rust, wasm-bindgen, wasm-pack
- **Database**: Turso (libSQL)
- **Auth**: Auth0
- **i18n**: next-intl

## Contributing

Contributions are welcome! Please see our contributing guidelines.

### Development Commands

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm test         # Run tests
pnpm lint         # Lint code
pnpm check-types  # Type check
```

## Acknowledgments

- [Herbert Online Judge](https://herbert.tealang.info/) - Original H2 language specification
- [HOJ](https://kk.rulez.sk/~visual/hoj/) - Inspiration for visual programming education

## License

MIT License - see [LICENSE](LICENSE) for details.
