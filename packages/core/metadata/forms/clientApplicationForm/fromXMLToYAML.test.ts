import { describe, expect, it } from "vitest"
import { mockContextFromXML } from "../../../tests/mockContext"
import { readAndParseXMLFixture } from "../../../tests/readFixtureXML"
import { fullClientApplicationFormYAML, minimalClientApplicationFormYAML } from "./__fixtures__/data"
import { importClientApplicationFormFromXMLToYAML } from "./fromXMLToYAML"
import type { ClientApplicationFormXML, FormMetadataXML } from "./types"

describe("importClientApplicationFormFromXMLToYAML", () => {
  it("совпадает с действующим YAML полной формы", () => {
    const form = readAndParseXMLFixture<{ Form: ClientApplicationFormXML }>(import.meta.url, "full.xml")
    const metadata = readAndParseXMLFixture<{ MetaDataObject: FormMetadataXML }>(
      import.meta.url,
      "fullMetadata.xml"
    )

    const result = importClientApplicationFormFromXMLToYAML({
      context: { ...mockContextFromXML(), exportToYAML: { toTyped: true } },
      formName: "Форма",
      formXML: form.Form,
      metadataXML: metadata.MetaDataObject,
    })

    expect(result.yaml).toEqual(fullClientApplicationFormYAML)
    expect(result.localIndexes.metadata.formDataPathIndex?.getRoot("Объект")).toMatchObject({
      kind: "formAttribute",
      name: "Объект",
    })
  })

  it("объединяет минимальные Form XML и metadata XML без модели", () => {
    const form = readAndParseXMLFixture<{ Form: ClientApplicationFormXML }>(import.meta.url, "minimal.xml")
    const metadata = readAndParseXMLFixture<{ MetaDataObject: FormMetadataXML }>(
      import.meta.url,
      "minimalMetadata.xml"
    )

    const result = importClientApplicationFormFromXMLToYAML({
      context: { ...mockContextFromXML(), exportToYAML: { toTyped: true } },
      formName: "Форма",
      formXML: form.Form,
      metadataXML: metadata.MetaDataObject,
    })

    expect(result.yaml).toEqual(minimalClientApplicationFormYAML)
    expect(result).not.toHaveProperty("model")
    expect(result).not.toHaveProperty("xml")
  })
})
