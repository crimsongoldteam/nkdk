import { parseMetadataYaml } from "@nkdk/runtime"
import { describe,expect,it } from "vitest"
import { mockContext } from "../../tests/mockContext"
import { MetadataCatalogRules } from "../appliedObjects/metadataCatalog/rules"
import { createPropertyStructuralReferenceRuntime } from "../operations/references"
import { collectStructuralYamlReferences } from "./structuralReferences"


describe("fill value structural references", () => {
  it("uses the indexed canonical and rewrites only the fill value", () => {
    const parsed = parseMetadataYaml(`Реквизиты:
  Получатель:
    Тип: Справочник.Контрагенты
    ЗначениеЗаполнения: Справочник.Контрагенты.Поставщик
`)
    const result = collect(parsed)

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

  it("не проверяет очищенную ссылку, отмеченную режимом PropertyState", () => {
    const parsed = parseMetadataYaml("ОсновнаяФормаСписка: !изменять\n")

    expect(collect(parsed)).toMatchObject({ ok: true, references: [] })
  })

  it("не проверяет естественное пустое значение plain-ссылки", () => {
    const parsed = parseMetadataYaml('ОсновнаяФормаСписка: ""\n')

    expect(collect(parsed)).toMatchObject({ ok: true, references: [] })
  })
})

function collect(parsed: ReturnType<typeof parseMetadataYaml>) {
  return collectStructuralYamlReferences({
    filePath: "/project/Справочник/Товары/Свойства.yaml",
    parsed,
    rule: MetadataCatalogRules,
    yaml: parsed.data,
    owner: { root: "Catalog", objectName: "Товары" },
    context: mockContext,
    runtime: createPropertyStructuralReferenceRuntime(),
  })
}
