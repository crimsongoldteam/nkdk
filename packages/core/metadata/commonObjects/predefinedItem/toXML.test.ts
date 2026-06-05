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

  it("exports Type for chart of characteristic types predefined item", () => {
    const { result } = testExportPropertyToXML({
      rule,
      itemsTree: [
        {
          itemType: "MetadataChartOfCharacteristicTypes",
          name: "ВидыСубконто",
          path: "MetadataChartOfCharacteristicTypes.ВидыСубконто",
        },
      ],
      value: {
        itemType: "PredefinedItem",
        name: "ПредопределенноеВсеСвойства",
        isFolder: false,
        code: "000000001",
        description: "Предопределенное все свойства",
        type: {
          type: ["string"],
          stringQualifiers: {
            length: 10,
            allowedLength: "Variable",
          },
        },
      },
      xmlRootTag: "Item",
    })

    expect(result).toContain("<Type>")
    expect(result).toContain("<v8:Type>xs:string</v8:Type>")
    expect(result).toContain("<v8:Length>10</v8:Length>")
  })

  it("exports empty Type for chart of characteristic types predefined folder", () => {
    const { result } = testExportPropertyToXML({
      rule,
      itemsTree: [
        {
          itemType: "MetadataChartOfCharacteristicTypes",
          name: "ВидыСубконто",
          path: "MetadataChartOfCharacteristicTypes.ВидыСубконто",
        },
      ],
      value: {
        itemType: "PredefinedItem",
        name: "Группа",
        isFolder: true,
        code: "000000002",
        description: "Группа",
      },
      xmlRootTag: "Item",
    })

    expect(result).toContain("<IsFolder>true</IsFolder>")
    expect(result).toContain("<Type/>")
  })
})
