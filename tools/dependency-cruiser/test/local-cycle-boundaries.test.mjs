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
