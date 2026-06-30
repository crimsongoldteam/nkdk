# Rules Builder Migration

This folder contains temporary migration tooling for converting metadata `rules.ts` files from direct
`{ type: "..." }` property-rule objects to local builder calls.

Commands:

```bash
pnpm --filter @nakidka/core exec tsx metadata/rulesBuilderMigration/cli.ts inventory
pnpm --filter @nakidka/core exec tsx metadata/rulesBuilderMigration/cli.ts apply
```

The tooling is intentionally conservative: it rewrites only known rule positions and only property types listed in
`builderCatalog.ts`.
