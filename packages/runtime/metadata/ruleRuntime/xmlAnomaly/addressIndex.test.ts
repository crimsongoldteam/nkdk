import { describe, expect, it } from "vitest"
import {
  createXmlRuleAddressIndex,
  type XmlRuleAddress,
} from "./addressIndex"

const address = (
  sourcePath: string,
  xmlPath: string,
  yamlPath: readonly (string | number)[],
  kind: XmlRuleAddress["kind"],
): XmlRuleAddress => ({
  sourcePath,
  xmlPath,
  yamlPath,
  rulePath: [{ propertyKey: "childItems", nestedItemType: "Button" }],
  kind,
})

describe("createXmlRuleAddressIndex", () => {
  it("finds the deepest rule address of the exact repeated XML item", () => {
    const sourcePath = "/source/Ext/Form.xml"
    const secondButton = address(
      sourcePath,
      "/Form[1]/ChildItems[1]/Button[2]",
      ["Форма", "Элементы", "ВтораяКнопка"],
      "item",
    )
    const index = createXmlRuleAddressIndex([
      address(sourcePath, "/Form[1]/ChildItems[1]", ["Форма", "Элементы"], "property"),
      address(
        sourcePath,
        "/Form[1]/ChildItems[1]/Button[1]",
        ["Форма", "Элементы", "ПерваяКнопка"],
        "item",
      ),
      secondButton,
    ])

    expect(index.deepest(
      sourcePath,
      "/Form[1]/ChildItems[1]/Button[2]/ExtendedTooltip[1]/@name[1]",
    )).toEqual(secondButton)
  })

  it("does not mix the same XML path from different source files", () => {
    const first = address("/first.xml", "/Root[1]/Value[1]", ["Первое"], "property")
    const second = address("/second.xml", "/Root[1]/Value[1]", ["Второе"], "property")
    const index = createXmlRuleAddressIndex([first, second])

    expect(index.deepest("/second.xml", "/Root[1]/Value[1]/#text[1]")).toEqual(second)
  })

  it("prefers the item owner over sibling properties for an unknown descendant", () => {
    const sourcePath = "/source.xml"
    const item = address(sourcePath, "/Root[1]/Item[2]", ["Элементы", "Второй"], "item")
    const index = createXmlRuleAddressIndex([
      item,
      {
        ...address(sourcePath, "/Root[1]/Item[2]", ["Элементы", "Второй", "Имя"], "property"),
        rulePath: [
          { propertyKey: "items", nestedItemType: "Item" },
          { propertyKey: "name" },
        ],
      },
    ])

    expect(index.deepest(sourcePath, "/Root[1]/Item[2]/Future[1]/@mode[1]")).toEqual(item)
  })

  it("reports all candidates instead of choosing an ambiguous rule address", () => {
    const first = address("/source.xml", "/Root[1]/Item[1]", ["Первое"], "item")
    const second = address("/source.xml", "/Root[1]/Item[1]", ["Второе"], "item")
    const index = createXmlRuleAddressIndex([first, second])

    expect(index.deepest("/source.xml", "/Root[1]/Item[1]/@name[1]")).toBeUndefined()
    expect(index.deepestCandidates("/source.xml", "/Root[1]/Item[1]/@name[1]")).toEqual([
      first,
      second,
    ])
  })
})
