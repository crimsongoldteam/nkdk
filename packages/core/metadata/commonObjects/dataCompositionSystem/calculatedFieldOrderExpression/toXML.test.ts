import { describe, expect, it } from "vitest"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
import { fullOrderExpressions } from "./__fixtures__/data"
import "./types"

describe("export CalculatedFieldOrderExpression to XML", () => {
  it("exports full.xml", () => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule: { type: "CalculatedFieldOrderExpression" },
      value: fullOrderExpressions,
      xmlRootTag: "dcssch:orderExpression",
      path: "full.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult!)
  })

  it("restores explicit Asc from reference XML", () => {
    const { result } = testExportPropertyToXML({
      rule: { type: "CalculatedFieldOrderExpression" },
      value: [
        {
          itemType: "CalculatedFieldOrderExpression",
          expression: "Дата",
          autoOrder: false,
        },
      ],
      referenceMetadata: [
        {
          itemType: "CalculatedFieldOrderExpression",
          expression: "Дата",
          orderType: "Asc",
          autoOrder: false,
        },
      ],
      xmlRootTag: "dcssch:orderExpression",
    })

    expect(result).toContain(
      '<orderType xmlns="http://v8.1c.ru/8.1/data-composition-system/common">Asc</orderType>'
    )
  })

  it("does not invent Asc without reference XML", () => {
    const { result } = testExportPropertyToXML({
      rule: { type: "CalculatedFieldOrderExpression" },
      value: [
        {
          itemType: "CalculatedFieldOrderExpression",
          expression: "Дата",
          autoOrder: false,
        },
      ],
      referenceMetadata: undefined,
      xmlRootTag: "dcssch:orderExpression",
    })

    expect(result).not.toContain("<orderType")
  })

  it("does not restore Desc from reference XML when current orderType is omitted", () => {
    const { result } = testExportPropertyToXML({
      rule: { type: "CalculatedFieldOrderExpression" },
      value: [
        {
          itemType: "CalculatedFieldOrderExpression",
          expression: "Дата",
          autoOrder: false,
        },
      ],
      referenceMetadata: [
        {
          itemType: "CalculatedFieldOrderExpression",
          expression: "Дата",
          orderType: "Desc",
          autoOrder: false,
        },
      ],
      xmlRootTag: "dcssch:orderExpression",
    })

    expect(result).not.toContain("<orderType")
    expect(result).not.toContain("Desc")
  })
})
