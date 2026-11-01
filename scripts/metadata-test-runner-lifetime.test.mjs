import assert from "node:assert/strict"
import { createRequire } from "node:module"
import { test } from "node:test"
import vm from "node:vm"
import { fileURLToPath } from "node:url"

const { build } = createRequire(new URL("../packages/rules/package.json", import.meta.url))("esbuild")

async function runnerHarness() {
  const probe = { created: 0, entered: [] }
  const modules = {
    vitest: `export class TestRunner {
      importFile() { return "imported" }
      async onBeforeRunSuite() {}
      onBeforeTryTask() {}
      async onAfterRunSuite(suite) { if (suite.reject) throw new Error("probe failure") }
    }`,
    context: `export function createMetadataExecutionRegistrySets() {
      return { id: ++globalThis.__registryProbe.created }
    }
    export function enterMetadataExecutionRegistrySets(registries) {
      globalThis.__registryProbe.entered.push(registries.id)
    }`,
    rules: "export const metadataRules = {}",
  }
  const output = await build({
    entryPoints: [fileURLToPath(new URL("../packages/rules/tests/metadataTestRunner.ts", import.meta.url))],
    bundle: true,
    write: false,
    platform: "node",
    format: "cjs",
    plugins: [{
      name: "runner-lifecycle-boundaries",
      setup(builder) {
        builder.onResolve({ filter: /^(vitest|.*metadataExecutionContext|.*metadataRules)$/ }, ({ path }) => ({
          path: path === "vitest" ? "vitest" : path.endsWith("metadataRules") ? "rules" : "context",
          namespace: "lifecycle-test",
        }))
        builder.onLoad({ filter: /.*/, namespace: "lifecycle-test" }, ({ path }) => ({ contents: modules[path] }))
      },
    }],
  })
  const module = { exports: {} }
  vm.runInNewContext(output.outputFiles[0].text, { module, exports: module.exports, __registryProbe: probe })
  return { runner: new module.exports.default(), probe }
}

function file(filepath) {
  const root = { filepath }
  root.file = root
  return root
}

test("metadata runner keeps pending/nested contexts and releases completed files even on failure", async () => {
  const { runner, probe } = await runnerHarness()
  const first = file("first.test.ts")
  const pending = file("pending.test.ts")
  runner.importFile(first.filepath, "collect")
  runner.importFile(pending.filepath, "collect")
  await runner.onBeforeRunSuite(first)
  await runner.onAfterRunSuite({ file: first })
  runner.onBeforeTryTask({ file: first })
  assert.equal(probe.created, 2)
  assert.equal(probe.entered.at(-1), 1)
  await runner.onAfterRunSuite(first)
  runner.onBeforeTryTask({ file: pending })
  assert.equal(probe.created, 2)
  assert.equal(probe.entered.at(-1), 2)
  runner.importFile(first.filepath, "collect")
  assert.equal(probe.created, 3, "completed file must no longer retain its registry")
  pending.reject = true
  await assert.rejects(runner.onAfterRunSuite(pending), /probe failure/)
  runner.importFile(pending.filepath, "collect")
  assert.equal(probe.created, 4, "failed completion must release ownership too")
})
