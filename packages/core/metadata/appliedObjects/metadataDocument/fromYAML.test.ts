import { describe, expect, it } from "vitest"
import { testImportAppliedObjectFromYAML } from "../../../tests/appliedObject"
import { full, fullYAML } from "./__fixtures__/full"
import { minimal, minimalYAML } from "./__fixtures__/minimal"
import { withNumerator, withNumeratorYAML } from "./__fixtures__/withNumerator"
import { MetadataDocumentRules } from "./rules"
import { MetadataDocument } from "./types"

// TODO: import YAML фикстур (`fullYAML`/`minimalYAML`/`withNumeratorYAML`)
// падает на `toEqual` — расхождение между YAML-фикстурами и фактическим
// импортом (~2 ключа разницы). Подогнать фикстуры после стабилизации YAML-API.
describe("import MetadataDocument from YAML", () => {
  it("should import full", () => {
    const result = testImportAppliedObjectFromYAML<MetadataDocument>({
      rule: MetadataDocumentRules,
      yaml: fullYAML,
      name: "ДокументВсеСвойства",
    })
    expect(result).toEqual(full)
  })

  it("should import minimal", () => {
    const result = testImportAppliedObjectFromYAML<MetadataDocument>({
      rule: MetadataDocumentRules,
      yaml: minimalYAML,
      name: "ДокументПоУмолчанию",
    })
    expect(result).toEqual(minimal)
  })

  it("should import withNumerator", () => {
    const result = testImportAppliedObjectFromYAML<MetadataDocument>({
      rule: MetadataDocumentRules,
      yaml: withNumeratorYAML,
      name: "ДокументСНумератором",
    })
    expect(result).toEqual(withNumerator)
  })

  it("should apply common basedOn object restrictions", () => {
    const result = testImportAppliedObjectFromYAML<MetadataDocument>({
      rule: MetadataDocumentRules,
      yaml: {
        ВводитсяНаОсновании: ["Справочник.Номенклатура"],
      },
      name: "ЗаказПокупателя",
    })

    expect(result?.basedOn).toEqual(["Catalog.Номенклатура"])

    expect(() =>
      testImportAppliedObjectFromYAML<MetadataDocument>({
        rule: MetadataDocumentRules,
        yaml: {
          ВводитсяНаОсновании: ["Перечисление.Статусы"],
        },
        name: "ЗаказПокупателя",
      })
    ).toThrow('Вид цели "Enum" не разрешён')
  })
})
