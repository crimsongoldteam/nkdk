import { describe, expect, it } from "vitest"
import { urlTemplatesFromYAML, urlTemplatesYAML } from "./__fixtures__/data"
import { exportMetadataHTTPServiceURLTemplatesToYAML } from "./register"
import { MetadataHTTPServiceMethodsYAML } from "~/metadata/commonObjects/metadataHTTPServiceMethod/types"
import { mockContext } from "~/tests/mockContext"

describe("export MetadataHTTPServiceURLTemplates to YAML", () => {
  it("exports URL template with nested methods", () => {
    const result = exportMetadataHTTPServiceURLTemplatesToYAML(mockContext, undefined, urlTemplatesFromYAML)

    expect(result).toEqual(urlTemplatesYAML)
    const methods = result?.Шаблон?.Методы as MetadataHTTPServiceMethodsYAML | undefined
    expect(methods?.МетодHEAD).toHaveProperty("HTTPМетод", "HEAD")
  })
})
