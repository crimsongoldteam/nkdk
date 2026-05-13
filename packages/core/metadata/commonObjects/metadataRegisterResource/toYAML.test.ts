import { describe, expect, it } from "vitest"
import { resourcesFromXML, resourcesYAML } from "./__fixtures__/data"
import { exportMetadataRegisterResourcesToYAML } from "./register"
import { mockContext } from "~/tests/mockContext"

describe("export MetadataRegisterResources to YAML", () => {
  it("exports collection as YAML map keyed by name", () => {
    const result = exportMetadataRegisterResourcesToYAML(mockContext, undefined, resourcesFromXML)

    expect(result).toEqual(resourcesYAML)
    expect(result?.РесурсВсеСвойства).toHaveProperty("ПолнотекстовыйПоиск", "НеИспользовать")
    expect(result?.РесурсВсеСвойства).toHaveProperty(
      "ПолеИспользованияХраненияВХранилищеДвоичныхДанных",
      "InformationRegister.Регистр.Attribute.ИспользоватьХранилищеДвоичныхДанных"
    )
  })
})
