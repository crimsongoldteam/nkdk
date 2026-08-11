import assert from "node:assert/strict"
import { mkdtemp, readFile, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"
import { updateCycleBaseline } from "../src/cycle-baseline-update.mjs"

const source = (name) => `packages/rules/helpers/${name}`

function component(names, dependencyCount) {
  return { modules: names.map(source).sort(), dependencyCount }
}

function resultWithCycle(names) {
  return {
    modules: names.map((name, index) => ({
      source: source(name),
      dependencies: [
        { resolved: source(names[(index + 1) % names.length]) },
      ],
    })),
  }
}

test("не заменяет cycle-baseline при ухудшении", async () => {
  const path = join(
    await mkdtemp(join(tmpdir(), "nkdk-cycles-")),
    "cycles.json"
  )
  const oldBaseline = {
    version: 1,
    components: [component(["a.ts", "b.ts"], 2)],
  }
  await writeFile(path, JSON.stringify(oldBaseline))

  await assert.rejects(
    updateCycleBaseline({
      path,
      currentResult: resultWithCycle(["a.ts", "b.ts", "c.ts"]),
    }),
    /модулей в циклах/ui
  )
  assert.deepEqual(JSON.parse(await readFile(path, "utf8")), oldBaseline)
})
