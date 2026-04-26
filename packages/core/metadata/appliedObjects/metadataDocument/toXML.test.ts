import { describe, expect, it } from "vitest"
import { testExportAppliedObjectToXML } from "~/tests/appliedObject"
import { full } from "./__fixtures__/full"
import { minimal } from "./__fixtures__/minimal"
import { withNumerator } from "./__fixtures__/withNumerator"
import { MetadataDocumentRules } from "./rules"

// TODO: побайтовый round-trip XML→model→XML для Document заблокирован общей
// инфраструктурой (uuid mock, порядок StandardAttributes, InternalInfo
// на CatalogTabularSection, формы/шаблоны для PRD-2, лишний
// <Use>ForItem</Use> у атрибутов). После устранения каждого пункта снять
// .skip и тесты заработают.
describe("export MetadataDocument to XML", () => {
  it.each([
    { fixture: "full.xml", data: full },
    { fixture: "minimal.xml", data: minimal },
    { fixture: "withNumerator.xml", data: withNumerator },
  ])("should export $fixture fixture", ({ fixture, data }) => {
    const { result, expected } = testExportAppliedObjectToXML({
      rule: MetadataDocumentRules,
      importMetaUrl: import.meta.url,
      fixture,
      data,
    })
    expect(result).toEqual(expected)
  })
})
