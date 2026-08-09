import { describe, expect, it } from "vitest"
import { mockContext } from "../../tests/mockContext"
import { parseMetadataYaml } from "../../yaml/parseMetadataYaml"
import { MetadataCatalogRules } from "../appliedObjects/metadataCatalog/rules"
import { createPropertyStructuralReferenceRuntime } from "../operations/references"
import { registerValidationMetadata } from "./registerValidationMetadata"
import { collectStructuralYamlReferences } from "./structuralReferences"

registerValidationMetadata()

describe("fill value structural references", () => {
  it("uses the indexed canonical and rewrites only the fill value", () => {
    const parsed = parseMetadataYaml(`Реквизиты:
  Получатель:
    Тип: Справочник.Контрагенты
    ЗначениеЗаполнения: Справочник.Контрагенты.Поставщик
`)
    const result = collectStructuralYamlReferences({
      filePath: "/project/Справочник/Товары/Свойства.yaml",
      parsed,
      rule: MetadataCatalogRules,
      yaml: parsed.data,
      owner: { root: "Catalog", objectName: "Товары" },
      context: mockContext,
      runtime: createPropertyStructuralReferenceRuntime(),
    })

    expect(result).toMatchObject({
      ok: true,
      references: [
        {
          yamlPath: ["Реквизиты", "Получатель", "ЗначениеЗаполнения"],
          canonical: "Catalog.Контрагенты.Поставщик",
        },
      ],
    })
    if (!result.ok) throw new Error(result.message)
    result.references[0]?.stageCanonical("Catalog.Контрагенты.Покупатель")
    expect(parsed.data).toMatchObject({
      Реквизиты: { Получатель: { ЗначениеЗаполнения: "Справочник.Контрагенты.Поставщик" } },
    })
    result.references[0]?.commitStaged()
    expect(parsed.data).toMatchObject({
      Реквизиты: {
        Получатель: {
          Тип: "Справочник.Контрагенты",
          ЗначениеЗаполнения: "Справочник.Контрагенты.Покупатель",
        },
      },
    })
  })
})
