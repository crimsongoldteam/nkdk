import { describe, expect, it } from "vitest"

import { testPropertyFixtureThroughYAML } from "../../../tests/directConversion"
import { urlTemplatesYAML } from "./__fixtures__/data"

import "./register"

describe("MetadataHTTPServiceURLTemplates XML → YAML", () => {
  it("imports URL template with nested methods", () => {
    const result = testPropertyFixtureThroughYAML({
      propertyType: "MetadataHTTPServiceURLTemplates",
      xmlRootTag: "URLTemplate",
      importMetaUrl: import.meta.url,
      fixture: "urlTemplates.xml",
    })
    expect(result.yaml).toEqual({
      Значение: {
        ...urlTemplatesYAML,
        ПустойШаблон: { Шаблон: "/*" },
      },
    })
  })

  it("exports URL template with nested methods", () => {
    const result = testPropertyFixtureThroughYAML({
      propertyType: "MetadataHTTPServiceURLTemplates",
      xmlRootTag: "URLTemplate",
      importMetaUrl: import.meta.url,
      fixture: "urlTemplates.xml",
    })
    expect(result.yaml).toMatchObject({ Значение: urlTemplatesYAML })
    expect(result.yaml).toHaveProperty("Значение.Шаблон.Методы.МетодHEAD.HTTPМетод", "HEAD")
  })
})
