# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Testing
```bash
# Run all tests (from packages/core)
cd packages/core && pnpm test

# Run a single test file
cd packages/core && pnpm vitest run path/to/file.test.ts

# Run tests with UI
cd packages/core && pnpm test:ui
```

**Do not use round-trip tests** (e.g. parse XML → model → serialize XML and assert equality with the input, or the same for YAML). They hide one-sided bugs, depend on canonical serialization, and make failures hard to localize. Prefer separate, explicit checks for `fromXML` / `toXML` and `fromYAML` / `toYAML` with clear expected outputs (snapshots, inline expectations, or dedicated fixtures).

### Type checking
```bash
cd packages/core && pnpm type-check
```

### Building
```bash
# Build core package
cd packages/core && pnpm build

# Build VS Code extension
cd packages/extension && pnpm build
```

### Language package (Langium DSL)
```bash
cd packages/language && pnpm langium:generate  # regenerate grammar artifacts
cd packages/language && pnpm build
```

## Architecture

This is a **pnpm monorepo** (`packages/*`) that implements a VS Code extension for editing **1C:Enterprise** configuration files in YAML/DSL format instead of raw XML.

### Packages
- **`@nakidka/core`** — core metadata conversion library (XML ↔ YAML ↔ internal types)
- **`@nakidka/cli`** — CLI tools for batch XML processing
- **`nkdk`** — VS Code extension (uses esbuild, React + Ant Design for webview UI)
- **`nkdk-language`** — Langium-based DSL parser for NKDK form syntax

### Core package structure (`packages/core/metadata/`)

The central pattern is **bidirectional format conversion** via rules-based transformers:

```
metadata/
├── appliedObjects/     # Top-level 1C objects (MetadataCatalog, Configuration, etc.)
├── commonObjects/      # Shared components (forms, data composition, i18n, etc.)
├── forms/              # Form element metadata
├── systemEnumerations/ # 1C system enum mappings
├── helpers/            # Utility functions
├── context/            # Conversion context (FromXMLContext, FromYAMLContext)
└── orchestration/      # Central registry for metadata items, properties, form elements
```

Each metadata object follows a **module pattern**:
```
someObject/
├── index.ts        # re-exports
├── types.ts        # XML type, YAML type, internal type
├── rules.ts        # processing rules (field mappings, transformations)
├── fromXML.ts      # XML → internal
├── fromYAML.ts     # YAML → internal
├── toXML.ts        # internal → XML
├── toYAML.ts       # internal → YAML
└── *.test.ts       # tests with __fixtures__/ subdirectory for XML/YAML samples
```

### Key conventions
- **TypeScript strict mode** in packages/core; path alias `~/` maps to `src/`
- **Prettier**: 120 char line width, no semicolons, trailing commas
- Tests use **Vitest** with `__fixtures__/` directories containing real XML/YAML files
- `fast-xml-parser` is patched (see `patches/`) — use it through the project's wrappers
- `@sinclair/typebox` is used for runtime schema validation alongside TypeScript types
