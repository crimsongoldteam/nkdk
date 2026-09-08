import { describe, expect, it } from "vitest"
import { parseXmlDocumentWithSaxes } from "../../../xml/import/saxesParser"
import { createFormElementCollectionNestedRule } from "./fromYAMLToXML"

describe("подготовленные маршруты коллекции элементов", () => {
  it("разрешает правило один раз и использует его для обоих направлений", () => {
    let reads = 0
    const rule = { itemType: "Cell", xmlTag: "InputField", properties: {} }
    const descriptor = createFormElementCollectionNestedRule({
      elementRules: { get Cell() { reads++; return rule } },
      elementKinds: { Cell: "ПолеВвода" }, allowedTypes: ["Cell"],
      resolveXMLItemType: () => "Cell",
    })
    const xml = parseXmlDocumentWithSaxes('<InputField name="Поле"/>').roots[0]!
    expect(descriptor.resolveXMLItemRule).toBeTypeOf("function")
    for (let index = 0; index < 5; index++) {
      const selected = descriptor.resolveItemRule!({ yaml: { Вид: "ПолеВвода" }, name: "Поле", index, propertyRule: undefined })
      expect(selected.itemType).toBe("Cell")
      expect(descriptor.resolveXMLItemRule!(xml)).toBe(selected)
      expect(descriptor.normalizeItemYAML!({ yaml: { Вид: "ПолеВвода", Ширина: 20 }, name: "Поле", index,
        propertyRule: undefined, itemRule: selected })).toEqual({ Ширина: 20 })
    }
    expect(reads).toBe(1)
  })
})
