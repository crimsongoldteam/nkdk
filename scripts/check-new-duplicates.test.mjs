import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { findNewDuplicates } from "./check-new-duplicates.mjs"

const clone = (fingerprint) => ({
  fingerprint,
  firstFile: { name: `${fingerprint}-a.ts` },
  secondFile: { name: `${fingerprint}-b.ts` },
})

describe("findNewDuplicates", () => {
  it("не считает существующий дубль новым", () => {
    assert.deepEqual(findNewDuplicates([clone("old")], [clone("old")]), [])
  })

  it("возвращает только новый отпечаток", () => {
    assert.deepEqual(
      findNewDuplicates([clone("old")], [clone("old"), clone("new")]),
      [clone("new")]
    )
  })

  it("учитывает увеличение числа пар с тем же отпечатком", () => {
    assert.deepEqual(
      findNewDuplicates([clone("copy")], [clone("copy"), clone("copy")]),
      [clone("copy")]
    )
  })
})
