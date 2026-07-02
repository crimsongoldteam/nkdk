import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../orchestration"
import { testExportPropertyToXML } from "../../../tests/property/exportPropertyToXML"
import { testImportPropertyFromXML } from "../../../tests/property/importPropertyFromXML"
import { group } from "./__fixtures__/group"
import { item } from "./__fixtures__/item"
import { typedCode } from "./__fixtures__/typed-code"
import "./index"

const rule: PropertyRule = { type: "PredefinedItem" }

const fixtures = ["group.xml", "item.xml", "typed-code.xml"] as const

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

  it("imports typed-code.xml", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "typed-code.xml",
      xmlRootTag: "Item",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(typedCode)
  })

  it("imports Type for chart of characteristic types predefined item", () => {
    const result = testImportPropertyFromXML({
      rule,
      xmlString: `
        <Item>
          <Name>ПредопределенноеВсеСвойства</Name>
          <IsFolder>false</IsFolder>
          <Code>000000001</Code>
          <Description>Предопределенное все свойства</Description>
          <Type>
            <v8:Type>xs:string</v8:Type>
            <v8:StringQualifiers>
              <v8:Length>10</v8:Length>
              <v8:AllowedLength>Variable</v8:AllowedLength>
            </v8:StringQualifiers>
          </Type>
        </Item>
      `,
      xmlRootTag: "Item",
    })

    expect(result).toMatchObject({
      itemType: "PredefinedItem",
      name: "ПредопределенноеВсеСвойства",
      isFolder: false,
      type: {
        type: ["string"],
        stringQualifiers: {
          length: 10,
          allowedLength: "Variable",
        },
      },
    })
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
