import { describe, expect, it } from "vitest"
import { parseXmlRootStructuresWithSaxes } from "../import/saxesParser"
import { XML_ORDERED_CHILDREN, xmlExport } from "./exporter"
import { xmlObjectRootStructures } from "./structure"

describe("xmlObjectRootStructures", () => {
  it.each([
    ["лист из пробелов", { FillValue: "         " }],
    ["атрибуты и пустой элемент", { Root: { "_xsi:type": "xs:string", _custom: "x", Empty: "" } }],
    ["повторные элементы", { Root: { Item: [{ "#text": "one" }, { "#text": "two" }] } }],
    ["xsi:nil", { Root: { "_xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance", "_xsi:nil": "true" } }],
    ["вложенные свойства", { Root: { Properties: { MinValue: "1", MaxValue: "2" } } }],
  ])("совпадает со строковым XML: %s", (_name, value) => {
    expectSameStructure(value)
  })

  it("сохраняет явный порядок разноимённых и повторных детей", () => {
    const value = {
      Root: {
        [XML_ORDERED_CHILDREN]: [
          { key: "Panel", value: { _id: "first" } },
          { key: "Group", value: { _id: "middle" } },
          { key: "Panel", value: { _id: "last" } },
        ],
      },
    }

    expectSameStructure(value)
  })

  it("использует тот же порядок для специального массива ChildItems", () => {
    const value = {
      Root: {
        ChildItems: [
          { Panel: { _id: "first" } },
          { Group: { _id: "middle" } },
          { Panel: { _id: "last" } },
        ],
      },
    }

    expectSameStructure(value)
  })

  it("считает processing instruction без сериализации", () => {
    expectSameStructure({ Root: { "?future": "mode=x" } })
  })

  it("считает смешанный текст без сериализации", () => {
    expectSameStructure({ Root: { "#text": "prefix", Child: "value" } })
  })
})

function expectSameStructure(value: Parameters<typeof xmlExport>[0]): void {
  const direct = xmlObjectRootStructures(value)
  expect(direct.kind).toBe("supported")
  if (direct.kind !== "supported") return
  expect(direct.roots).toEqual(rootFingerprints(parseXmlRootStructuresWithSaxes(xmlExport(value)).roots))
}

function rootFingerprints(
  roots: ReturnType<typeof parseXmlRootStructuresWithSaxes>["roots"],
) {
  return roots.map(({ name, path, structuralHash }) => ({ name, path, structuralHash }))
}
