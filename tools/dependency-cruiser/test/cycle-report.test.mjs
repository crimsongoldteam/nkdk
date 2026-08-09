import assert from "node:assert/strict"
import test from "node:test"
import {
  findProductionCycleComponents,
  formatProductionCycleReport,
} from "../src/cycle-report.mjs"

test("группирует production-цикл в одну компоненту", () => {
  const components = findProductionCycleComponents({
    modules: [
      {
        source: "packages/core/helpers/runtime/cycle-b.ts",
        dependencies: [
          { resolved: "packages/core/helpers/runtime/cycle-a.ts" },
        ],
      },
      {
        source: "packages/core/helpers/runtime/cycle-a.ts",
        dependencies: [
          { resolved: "packages/core/helpers/runtime/cycle-b.ts" },
        ],
      },
    ],
  })

  assert.deepEqual(components, [
    {
      dependencyCount: 2,
      modules: [
        "packages/core/helpers/runtime/cycle-a.ts",
        "packages/core/helpers/runtime/cycle-b.ts",
      ],
      keyModules: [
        "packages/core/helpers/runtime/cycle-a.ts",
        "packages/core/helpers/runtime/cycle-b.ts",
      ],
      areas: [{ name: "packages/core", moduleCount: 2 }],
    },
  ])
})

test("форматирует компактную сводку циклических компонент", () => {
  const report = formatProductionCycleReport([
    {
      dependencyCount: 2,
      modules: [
        "packages/core/helpers/runtime/cycle-a.ts",
        "packages/core/helpers/runtime/cycle-b.ts",
      ],
      keyModules: [
        "packages/core/helpers/runtime/cycle-a.ts",
        "packages/core/helpers/runtime/cycle-b.ts",
      ],
      areas: [{ name: "packages/core", moduleCount: 2 }],
    },
  ])

  assert.equal(
    report,
    [
      "Циклические компоненты: 1; модулей в циклах: 2.",
      "1. 2 модуля, внутренних зависимостей: 2",
      "   Области: packages/core — 2",
      "   Ключевые модули: packages/core/helpers/runtime/cycle-a.ts; packages/core/helpers/runtime/cycle-b.ts",
    ].join("\n")
  )
})
