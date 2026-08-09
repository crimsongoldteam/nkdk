import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import test from "node:test"

test("PR quality содержит отдельную обязательную архитектурную проверку", () => {
  const workflowPath = ".github/workflows/pr-quality.yml"
  assert.equal(existsSync(workflowPath), true)
  assert.equal(existsSync(".github/workflows/duplicate-code.yml"), false)

  const workflow = readFileSync(workflowPath, "utf8")
  assert.match(workflow, /^name: PR quality$/mu)
  assert.match(workflow, /^  architecture:$/mu)
  assert.match(workflow, /^  tests:$/mu)
  assert.match(workflow, /^  duplicates:$/mu)
  assert.match(workflow, /pnpm test:architecture:rules/u)
  assert.match(workflow, /pnpm test:architecture$/mu)
})

test("AGENTS запрещает PR-цикл при нарушениях dependency-cruiser", () => {
  const agents = readFileSync("AGENTS.md", "utf8")
  assert.match(agents, /перед созданием PR и запуском `finish-pr-cycle`/u)
  assert.match(agents, /`pnpm test:architecture:rules`/u)
  assert.match(agents, /`pnpm test:architecture`/u)
  assert.match(agents, /не перезаписывай baseline/u)
})
