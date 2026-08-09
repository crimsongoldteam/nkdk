import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

test("workerPool types не импортирует реализации операций", () => {
  const source = readFileSync("packages/core/metadata/workerPool/types.ts", "utf8")
  assert.doesNotMatch(source, /\.\.\/(?:project|fullSyncToXml|importFromXml)\//u)
})
