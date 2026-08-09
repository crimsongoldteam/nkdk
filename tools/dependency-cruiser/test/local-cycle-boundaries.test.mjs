import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const read = (path) => readFileSync(path, "utf8")

test("локальные декларации не импортируются из выведенных types.ts", () => {
  assert.doesNotMatch(
    read("packages/core/metadata/appliedObjects/configuration/childObjects.ts"),
    /from "\.\/rootIO"/u
  )
  assert.doesNotMatch(
    read("packages/core/metadata/appliedObjects/metadataCatalog/rules.ts"),
    /from "\.\/types"/u
  )
  assert.doesNotMatch(
    read("packages/core/metadata/forms/clientApplicationForm/rules.ts"),
    /from "\.\/types"/u
  )
  assert.doesNotMatch(
    read("packages/core/metadata/commonObjects/metadataPath/helper.ts"),
    /from "\.\/types"/u
  )
})

test("парные реализации зависят от leaf contracts", () => {
  assert.doesNotMatch(
    read("packages/core/metadata/appliedObjects/configuration/syncStateBinary.ts"),
    /from "\.\/syncState"/u
  )
  assert.doesNotMatch(
    read("packages/core/metadata/validation/dataPath/finalizationPredicate.ts"),
    /from "\.\/formatter"/u
  )
  assert.doesNotMatch(read("packages/core/xml/import/saxesParser.ts"), /from "\.\/importer"/u)
  assert.doesNotMatch(read("packages/platform/src/sessions/nodeRuntime.ts"), /from "\.\/manager"/u)
})

test("helpers элементов не импортируют выведенные types.ts", () => {
  for (const element of [
    "autoCommandBar",
    "contextMenu",
    "searchControlAddition",
    "viewStatusAddition",
    "extendedTooltip",
  ]) {
    assert.doesNotMatch(read(`packages/core/metadata/forms/elements/${element}/helper.ts`), /from "\.\/types"/u)
  }
})

test("baseForm использует независимое ядро", () => {
  assert.doesNotMatch(
    read("packages/core/metadata/forms/clientApplicationForm/baseForm.ts"),
    /from "\.\/fromYAMLToXML"/u
  )
  assert.doesNotMatch(
    read("packages/core/metadata/forms/clientApplicationForm/convertYAMLToXML.ts"),
    /from "\.\/baseForm"/u
  )
})
