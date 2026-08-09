import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

for (const direction of ["fromXML", "fromYAML", "toXML", "toYAML"]) {
  test(`${direction}: ядро не импортирует совместимые leaf-файлы`, () => {
    const source = readFileSync(
      `packages/core/metadata/commonObjects/metadataValue/${direction}.ts`,
      "utf8"
    )
    assert.doesNotMatch(
      source,
      new RegExp(`from "\\./(?:fixedArray|formChoiceList)/${direction}"`, "u")
    )
  })
}
