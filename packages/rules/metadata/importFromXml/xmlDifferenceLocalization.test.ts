import {
  createXmlRuleAddressIndex,
  type XmlRuleAddress,
  type XmlStructureDifference,
} from "@nkdk/runtime"
import { describe, expect, it } from "vitest"
import { localizeXmlDifferences } from "./xmlDifferenceLocalization"

const difference: XmlStructureDifference = {
  kind: "presence",
  path: "/Form[1]/Items[1]/Item[2]/Future[1]",
  ownerPath: "/Form[1]/Items[1]/Item[2]",
}

const itemAddress = (yamlName: string): XmlRuleAddress => ({
  sourcePath: "/source/Ext/Form.xml",
  xmlPath: "/Form[1]/Items[1]/Item[2]",
  yamlPath: ["Форма", "Элементы", yamlName],
  rulePath: [{ propertyKey: "items", nestedItemType: "Item" }],
  kind: "item",
})

describe("localizeXmlDifferences", () => {
  it("binds an unknown descendant to its exact repeated item", () => {
    const address = itemAddress("Второй")

    expect(localizeXmlDifferences({
      sourcePath: address.sourcePath,
      differences: [difference],
      addressIndex: createXmlRuleAddressIndex([address]),
    })).toEqual({
      localized: [{ difference, address }],
      unlocalized: [],
    })
  })

  it("does not choose between ambiguous logical owners", () => {
    const first = itemAddress("Первый")
    const second = itemAddress("Второй")

    expect(localizeXmlDifferences({
      sourcePath: first.sourcePath,
      differences: [difference],
      addressIndex: createXmlRuleAddressIndex([first, second]),
    })).toEqual({
      localized: [],
      unlocalized: [{
        difference,
        nearestAddresses: [first, second],
        reason: "ambiguous-item",
      }],
    })
  })

  it("reports a missing rule address without inventing a YAML path", () => {
    expect(localizeXmlDifferences({
      sourcePath: "/source/Ext/Form.xml",
      differences: [difference],
      addressIndex: createXmlRuleAddressIndex([]),
    })).toEqual({
      localized: [],
      unlocalized: [{
        difference,
        nearestAddresses: [],
        reason: "no-rule-address",
      }],
    })
  })
})
