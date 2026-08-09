import assert from "node:assert/strict"
import test from "node:test"
import {
  assertCycleRewriteNotWorse,
  assertCyclesNotWorse,
} from "../src/cycle-baseline.mjs"

const source = (name) => `packages/core/helpers/${name}`

function baselineComponent(names, dependencyCount) {
  return { modules: names.map(source).sort(), dependencyCount }
}

function resultWithCycle(names, dependencyCount) {
  const modules = names.map((name, index) => ({
    source: source(name),
    dependencies: [{ resolved: source(names[(index + 1) % names.length]) }],
  }))
  for (let index = names.length; index < dependencyCount; index += 1) {
    modules[index % modules.length].dependencies.push({
      resolved: modules[(index + 1) % modules.length].source,
    })
  }
  return { modules }
}

test("принимает уменьшение известной компоненты", () => {
  const baseline = {
    version: 1,
    components: [baselineComponent(["a.ts", "b.ts", "c.ts"], 4)],
  }
  assert.doesNotThrow(() =>
    assertCyclesNotWorse(resultWithCycle(["a.ts", "b.ts"], 2), baseline)
  )
})

test("принимает разбиение известной компоненты на меньшие циклы", () => {
  const baseline = {
    version: 1,
    components: [baselineComponent(["a.ts", "b.ts", "c.ts", "d.ts"], 6)],
  }
  const result = {
    modules: [
      ...resultWithCycle(["a.ts", "b.ts"], 2).modules,
      ...resultWithCycle(["c.ts", "d.ts"], 2).modules,
    ],
  }

  assert.doesNotThrow(() => assertCyclesNotWorse(result, baseline))
  assert.doesNotThrow(() => assertCycleRewriteNotWorse(result, baseline))
})

test("отклоняет новый модуль и рост числа зависимостей", () => {
  const baseline = {
    version: 1,
    components: [baselineComponent(["a.ts", "b.ts"], 2)],
  }
  assert.throws(
    () => assertCyclesNotWorse(resultWithCycle(["a.ts", "new.ts"], 2), baseline),
    /новый модуль.*new\.ts/u
  )
  assert.throws(
    () => assertCyclesNotWorse(resultWithCycle(["a.ts", "b.ts"], 3), baseline),
    /внутренних зависимостей.*3.*2/u
  )
})

test("разрешает явную замену путей без роста показателей", () => {
  const baseline = {
    version: 1,
    components: [baselineComponent(["old-a.ts", "old-b.ts"], 2)],
  }
  assert.doesNotThrow(() =>
    assertCycleRewriteNotWorse(
      resultWithCycle(["new-a.ts", "new-b.ts"], 2),
      baseline
    )
  )
})

test("не разрешает явную перезапись с ростом суммарных показателей", () => {
  const baseline = {
    version: 1,
    components: [baselineComponent(["old-a.ts", "old-b.ts"], 2)],
  }
  assert.throws(
    () =>
      assertCycleRewriteNotWorse(
        resultWithCycle(["a.ts", "b.ts", "c.ts"], 3),
        baseline
      ),
    /модулей в циклах.*3.*2/ui
  )
})
