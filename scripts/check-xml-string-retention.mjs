import assert from "node:assert/strict"
import { parseXmlDocumentWithSaxes, parseXmlRootStructuresWithSaxes } from "../packages/runtime/xml/import/saxesParser.ts"

// Отдельная проверка памяти: node --expose-gc --import tsx scripts/check-xml-string-retention.mjs
// Не входит в Vitest: проверяет реальный V8/GC, а не время unit-теста.
assert.equal(typeof global.gc, "function", "Запустите node с --expose-gc --import tsx")

function readValue(index, kind) {
  const name = `ДлинноеИмяКорняНомер${index}`
  const text = Buffer.from(`<${name} name="УникальноеИмяЭлементаНомер${index}"><!--${"x".repeat(512 * 1024)}--></${name}>`).toString()
  if (kind === "rootPath") return parseXmlRootStructuresWithSaxes(text).roots[0].path
  const root = parseXmlDocumentWithSaxes(text).roots[0]
  return kind === "nodePath" ? root.path : root.attributes[0].value
}

for (const kind of ["attribute", "nodePath", "rootPath"]) {
  readValue(-1, kind)
  global.gc()
  const before = process.memoryUsage().heapUsed
  const values = []
  for (let index = 0; index < 32; index++) values.push(readValue(index, kind))
  global.gc()
  const retainedBytes = process.memoryUsage().heapUsed - before
  assert.equal(values[31], kind === "attribute" ? "УникальноеИмяЭлементаНомер31" : "/ДлинноеИмяКорняНомер31[1]")
  console.log(JSON.stringify({ kind, retainedBytes, count: values.length }))
  assert.ok(retainedBytes < 4 * 1024 * 1024, `${kind}: короткие значения удерживают полные исходные XML-строки`)
}
