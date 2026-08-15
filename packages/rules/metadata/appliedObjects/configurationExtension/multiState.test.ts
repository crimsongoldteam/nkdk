import { describe, expect, it } from "vitest"
import { markYAMLScalarTag, yamlScalarTagAt } from "@nkdk/runtime"
import { mockContext, mockContextFromXML } from "../../../tests/mockContext"
import { exportMultiStateType, importMultiStateType } from "./multiState"

describe("configuration extension MultiState type", () => {
  it("imports CheckValue and ExtendValue without losing their modes", () => {
    const yaml = importMultiStateType(mockContextFromXML(), undefined, extendedProperty({
      "xr:CheckValue": typeDescription("cfg:CatalogRef.СправочникПолный"),
      "xr:ExtendValue": typeDescription("cfg:CatalogRef.СправочникРеквизит"),
    }))

    expect(yaml).toEqual([
      "Справочник.СправочникПолный",
      "Справочник.СправочникРеквизит",
    ])
    expect(yamlScalarTagAt(yaml, 0)).toBeUndefined()
    expect(yamlScalarTagAt(yaml, 1)).toBe("изменять")
  })

  it("imports NotifyValue and ExtendValue in source order", () => {
    const yaml = importMultiStateType(mockContextFromXML(), undefined, extendedProperty({
      "xr:ExtendValue": typeDescription("xs:boolean"),
      "xr:NotifyValue": {
        ...typeDescription("xs:dateTime"),
        "v8:DateQualifiers": { "v8:DateFractions": "Date" },
      },
    }))

    expect(yaml).toEqual(["Булево", "Дата"])
    expect(yamlScalarTagAt(yaml, 0)).toBe("изменять")
    expect(yamlScalarTagAt(yaml, 1)).toBe("проверять")
  })

  it("keeps a sole ExtendValue as a one-element array", () => {
    const yaml = importMultiStateType(mockContextFromXML(), undefined, extendedProperty({
      "xr:ExtendValue": typeDescription("xs:string"),
    }))

    expect(yaml).toEqual(["Строка"])
    expect(yamlScalarTagAt(yaml, 0)).toBe("изменять")
  })

  it("preserves an empty CheckValue as an empty untagged item", () => {
    const yaml = importMultiStateType(mockContextFromXML(), undefined, extendedProperty({
      "xr:CheckValue": { "_xsi:type": "v8:TypeDescription" },
      "xr:ExtendValue": typeDescription("cfg:CatalogRef.ПроектныеЗадачи"),
    }))

    expect(yaml).toEqual([[], "Справочник.ПроектныеЗадачи"])
    expect(yamlScalarTagAt(yaml, 0)).toBeUndefined()
    expect(yamlScalarTagAt(yaml, 1)).toBe("изменять")
  })

  it("exports ordinary and tagged items into ExtendedProperty groups", () => {
    const yaml: unknown[] = ["Справочник.СправочникПолный", "Дата", "Булево"]
    markYAMLScalarTag(yaml, 1, "проверять")
    markYAMLScalarTag(yaml, 2, "изменять")

    expect(exportMultiStateType(mockContext, undefined, yaml)).toEqual({
      state: "MultiState",
      value: {
        "_xsi:type": "xr:ExtendedProperty",
        "xr:CheckValue": typeDescription("cfg:CatalogRef.СправочникПолный"),
        "xr:NotifyValue": {
          ...typeDescription("xs:dateTime"),
          "v8:DateQualifiers": { "v8:DateFractions": "Date" },
        },
        "xr:ExtendValue": typeDescription("xs:boolean"),
      },
    })
  })

  it.each([
    [
      "ExtendValue перед NotifyValue",
      ["Булево", "Дата"],
      ["изменять", "проверять"],
      ["_xsi:type", "xr:ExtendValue", "xr:NotifyValue"],
    ],
    [
      "CheckValue перед ExtendValue",
      ["Строка", "Булево"],
      [undefined, "изменять"],
      ["_xsi:type", "xr:CheckValue", "xr:ExtendValue"],
    ],
    [
      "одиночный ExtendValue",
      ["Строка"],
      ["изменять"],
      ["_xsi:type", "xr:ExtendValue"],
    ],
  ] as const)("сохраняет порядок первого появления групп: %s", (_name, parts, tags, expectedKeys) => {
    const yaml: unknown[] = [...parts]
    tags.forEach((tag, index) => {
      if (tag !== undefined) markYAMLScalarTag(yaml, index, tag)
    })

    expect(Object.keys(exportMultiStateType(mockContext, undefined, yaml).value)).toEqual(expectedKeys)
  })

  it("сохраняет порядок элементов внутри группы", () => {
    const yaml: unknown[] = ["Булево", "Строка"]
    markYAMLScalarTag(yaml, 0, "изменять")
    markYAMLScalarTag(yaml, 1, "изменять")

    expect(exportMultiStateType(mockContext, undefined, yaml).value["xr:ExtendValue"]?.["v8:Type"]).toEqual([
      "xs:boolean",
      "xs:string",
    ])
  })

  it("exports an empty CheckValue and rejects unrelated tags", () => {
    const yaml: unknown[] = [[], "Строка"]
    markYAMLScalarTag(yaml, 1, "изменять")

    expect(exportMultiStateType(mockContext, undefined, yaml)).toEqual({
      state: "MultiState",
      value: {
        "_xsi:type": "xr:ExtendedProperty",
        "xr:CheckValue": { "_xsi:type": "v8:TypeDescription" },
        "xr:ExtendValue": typeDescription("xs:string"),
      },
    })

    markYAMLScalarTag(yaml, 1, "xml/value")
    expect(() => exportMultiStateType(mockContext, undefined, yaml)).toThrow("Недопустимый тег части MultiState: xml")
  })
})

function extendedProperty(
  groups: Record<string, Record<string, unknown>>,
): Record<string, unknown> {
  return { "_xsi:type": "xr:ExtendedProperty", ...groups }
}

function typeDescription(type: string): Record<string, unknown> {
  return {
    "_xsi:type": "v8:TypeDescription",
    "v8:Type": type,
    ...(type === "xs:string"
      ? { "v8:StringQualifiers": { "v8:Length": 0, "v8:AllowedLength": "Variable" } }
      : {}),
  }
}
