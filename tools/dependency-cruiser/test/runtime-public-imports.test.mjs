import assert from "node:assert/strict"
import test from "node:test"

import { findRuntimeInternalImports } from "../src/runtime-public-imports.mjs"

test("reports only direct imports of runtime internals from rules", () => {
  const result = {
    modules: [
      {
        source: "packages/rules/metadata/example.ts",
        dependencies: [
          { resolved: "packages/runtime/rule-kit.ts" },
          { resolved: "packages/runtime/metadata/private.ts" },
        ],
      },
      {
        source: "packages/runtime/index.ts",
        dependencies: [{ resolved: "packages/runtime/metadata/private.ts" }],
      },
    ],
  }

  assert.deepEqual(findRuntimeInternalImports(result), [
    {
      from: "packages/rules/metadata/example.ts",
      to: "packages/runtime/metadata/private.ts",
    },
  ])
})
