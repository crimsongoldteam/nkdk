import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
import { group } from "./__fixtures__/group"
import { item } from "./__fixtures__/item"
import { typedCode } from "./__fixtures__/typed-code"
import "./index"

const rule: PropertyRule = { type: "PredefinedItem" }

const cases = [
  { name: "group.xml", value: group },
  { name: "item.xml", value: item },
  { name: "typed-code.xml", value: typedCode },
] as const

describe("export PredefinedItem to XML", () => {
  it.each(cases)("exports $name", ({ name, value }) => {
    const source = readFileSync(join(__dirname, "__fixtures__", name), "utf-8")
      .replace(/^﻿/, "")
      .trimEnd()
    const { result } = testExportPropertyToXML({
      rule,
      value,
      xmlRootTag: "Item",
      path: name,
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(source)
  })
})
