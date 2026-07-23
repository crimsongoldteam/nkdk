import { describe, expect, it } from "vitest"
import { testExportPropertyModelThroughYAMLToXML } from "../../../../tests/property/exportPropertyModelThroughYAMLToXML"
import { fullOrderExpressions, fullOrderExpressionsYAML } from "./__fixtures__/data"
import "./types"

describe("export CalculatedFieldOrderExpression to XML", () => {
  it("exports full.xml", () => {
    const { result, expectedResult } = testExportPropertyModelThroughYAMLToXML({
      rule: { type: "CalculatedFieldOrderExpression" },
      value: fullOrderExpressions,
      yaml: fullOrderExpressionsYAML,
      xmlRootTag: "dcssch:orderExpression",
      path: "full.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult!)
  })

  it("restores explicit Asc from reference XML", () => {
    const { result } = testExportPropertyModelThroughYAMLToXML({
      rule: { type: "CalculatedFieldOrderExpression" },
      value: [
        {
          itemType: "CalculatedFieldOrderExpression",
          expression: "Дата",
          autoOrder: false,
        },
      ],
      yaml: [{ Выражение: "Дата", Автоупорядочивание: "Ложь" }],
      referenceMetadata: [
        {
          expression: { "#text": "Дата", _xmlns: "http://v8.1c.ru/8.1/data-composition-system/common" },
          orderType: { "#text": "Asc", _xmlns: "http://v8.1c.ru/8.1/data-composition-system/common" },
          autoOrder: { "#text": "false", _xmlns: "http://v8.1c.ru/8.1/data-composition-system/common" },
        },
      ],
      xmlRootTag: "dcssch:orderExpression",
    })

    expect(result).toContain('<orderType xmlns="http://v8.1c.ru/8.1/data-composition-system/common">Asc</orderType>')
  })

  it("does not invent Asc without reference XML", () => {
    const { result } = testExportPropertyModelThroughYAMLToXML({
      rule: { type: "CalculatedFieldOrderExpression" },
      value: [
        {
          itemType: "CalculatedFieldOrderExpression",
          expression: "Дата",
          autoOrder: false,
        },
      ],
      yaml: [{ Выражение: "Дата", Автоупорядочивание: "Ложь" }],
      referenceMetadata: undefined,
      xmlRootTag: "dcssch:orderExpression",
    })

    expect(result).not.toContain("<orderType")
  })

  it("does not restore Desc from reference XML when current orderType is omitted", () => {
    const { result } = testExportPropertyModelThroughYAMLToXML({
      rule: { type: "CalculatedFieldOrderExpression" },
      value: [
        {
          itemType: "CalculatedFieldOrderExpression",
          expression: "Дата",
          autoOrder: false,
        },
      ],
      yaml: [{ Выражение: "Дата", Автоупорядочивание: "Ложь" }],
      referenceMetadata: [
        {
          expression: { "#text": "Дата", _xmlns: "http://v8.1c.ru/8.1/data-composition-system/common" },
          orderType: { "#text": "Desc", _xmlns: "http://v8.1c.ru/8.1/data-composition-system/common" },
          autoOrder: { "#text": "false", _xmlns: "http://v8.1c.ru/8.1/data-composition-system/common" },
        },
      ],
      xmlRootTag: "dcssch:orderExpression",
    })

    expect(result).not.toContain("<orderType")
    expect(result).not.toContain("Desc")
  })
})
