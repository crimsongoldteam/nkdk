import { describe, expect, it } from "vitest"

import { testPropertyFixtureThroughYAML } from "../../../tests/directConversion"
import { urlTemplatesYAML } from "./__fixtures__/data"

import "./register"

describe("MetadataHTTPServiceURLTemplates YAML → XML", () => {
  it("imports collection with nested methods from YAML map keyed by name", () => {
    const result = convert({ Значение: urlTemplatesYAML })
    expect(result.result).toContain("<Name>Шаблон</Name>")
    expect(result.result).toContain("<Name>МетодHEAD</Name>")
    expect(result.result).not.toContain("<Name>ПустойШаблон</Name>")
  })

  it("round-trips URL template with nested methods", () => {
    const result = convert()
    expect(normalize(result.result)).toBe(normalize(result.expected))
  })
})

const convert = (yaml?: unknown) =>
  testPropertyFixtureThroughYAML({
    propertyType: "MetadataHTTPServiceURLTemplates",
    xmlRootTag: "URLTemplate",
    importMetaUrl: import.meta.url,
    fixture: "urlTemplates.xml",
    yaml,
  })

const normalize = (value: string): string => value.replace(/^\ufeff?<\?xml[^\n]*\?>\r?\n?/, "").replace(/\r\n/g, "\n").trimEnd()
