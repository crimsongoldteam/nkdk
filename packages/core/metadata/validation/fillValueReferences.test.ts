import { describe, expect, it } from "vitest"
import { mockContext } from "../../tests/mockContext"
import { parseMetadataYaml } from "../../yaml/parseMetadataYaml"
import { registerCoreMetadata } from "../register"
import { resolveValidationProjectFile } from "./projectFiles"
import { createValidationRulesSnapshot } from "./rulesSnapshot"
import { extractValidationYamlFacts } from "./yamlFactExtractor"

registerCoreMetadata()

describe("fill value references", () => {
  it("indexes an ordinary attribute reference but not a primitive fill value", () => {
    const facts = extract(`Реквизиты:
  Получатель:
    Тип: Справочник.Контрагенты
    ЗначениеЗаполнения: Справочник.Контрагенты.Поставщик
  Комментарий:
    Тип: Строка(20)
    ЗначениеЗаполнения: текст
`)

    expect(facts.pendingReferences).toEqual([
      expect.objectContaining({
        yamlPath: ["Реквизиты", "Получатель", "ЗначениеЗаполнения"],
        canonical: "Catalog.Контрагенты.Поставщик",
        target: expect.objectContaining({ kind: "value", root: "Catalog", objectName: "Контрагенты" }),
      }),
    ])
  })

  it("indexes an owner standard attribute reference", () => {
    const facts = extract(`Владельцы:
  - Справочник.Контрагенты
СтандартныеРеквизиты:
  Владелец:
    ЗначениеЗаполнения: Справочник.Контрагенты.Поставщик
`)

    expect(facts.pendingReferences).toEqual(expect.arrayContaining([
      expect.objectContaining({
        yamlPath: ["СтандартныеРеквизиты", "Владелец", "ЗначениеЗаполнения"],
        canonical: "Catalog.Контрагенты.Поставщик",
      }),
    ]))
    expect(facts.pendingReferences).toHaveLength(2)
  })

})

function extract(text: string) {
  return extractValidationYamlFacts({
    file: catalogFile(),
    parsed: parseMetadataYaml(text),
    rulesSnapshot: createValidationRulesSnapshot(mockContext),
  })
}

function catalogFile() {
  const file = resolveValidationProjectFile("/project", "/project/Справочник/Товары/Свойства.yaml")
  if (file === undefined) throw new Error("file not resolved")
  return file
}
