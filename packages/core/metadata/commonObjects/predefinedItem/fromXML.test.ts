import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
import { testImportPropertyFromXML } from "~/tests/property/importPropertyFromXML"
import { group } from "./__fixtures__/group"
import { item } from "./__fixtures__/item"
import "./types"

const rule: PropertyRule = { type: "PredefinedItem" }

const fixtures = ["group.xml", "item.xml"] as const

describe("import PredefinedItem from XML", () => {
  it("imports group.xml", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "group.xml",
      xmlRootTag: "Item",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(group)
  })

  it("imports item.xml", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "item.xml",
      xmlRootTag: "Item",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(item)
  })

  it.each(fixtures)("round-trip: %s", (fixtureName) => {
    const source = readFileSync(join(__dirname, "__fixtures__", fixtureName), "utf-8")
      .replace(/^﻿/, "")
      .trimEnd()
    const imported = testImportPropertyFromXML({
      rule,
      path: fixtureName,
      xmlRootTag: "Item",
      importMetaUrl: import.meta.url,
    })
    const { result } = testExportPropertyToXML({
      rule,
      value: imported,
      xmlRootTag: "Item",
      path: fixtureName,
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(source)
  })
})
