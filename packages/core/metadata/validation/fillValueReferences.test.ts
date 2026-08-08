import { describe, expect, it } from "vitest"
import { mockContext } from "../../tests/mockContext"
import { parseMetadataYaml } from "../../yaml/parseMetadataYaml"
import { registerValidationMetadata } from "./registerValidationMetadata"
import { resolveValidationProjectFile } from "./projectFiles"
import { createValidationRulesSnapshot } from "./rulesSnapshot"
import { extractValidationYamlFacts } from "./yamlFactExtractor"
import { createValidationSchemaCache } from "./projectValidationPasses"
import { validateKnownProjectYaml } from "./knownYamlValidation"
import { toProjectStateFileUpdate } from "../projectState/fileUpdate"

registerValidationMetadata()

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

  it("stores only the reference in project state", () => {
    const text = `Реквизиты:
  Получатель:
    Тип: Справочник.Контрагенты
    ЗначениеЗаполнения: Справочник.Контрагенты.Поставщик
  Комментарий:
    Тип: Строка(20)
    ЗначениеЗаполнения: текст
`
    const file = catalogFile()
    const firstPass = validateKnownProjectYaml({
      projectDir: "/project",
      file,
      text,
      yaml: parseMetadataYaml(text).data,
      context: mockContext,
      schemaCache: createValidationSchemaCache(mockContext),
      rulesSnapshot: createValidationRulesSnapshot(mockContext),
    })
    const update = toProjectStateFileUpdate(firstPass, {
      projectPath: "Справочник/Товары/Свойства.yaml",
      componentPath: "",
      resourceKind: "yaml",
      yamlRole: "properties",
    })

    expect(update.pendingReferences).toEqual([
      expect.objectContaining({ canonical: "Catalog.Контрагенты.Поставщик" }),
    ])
    expect(update.pendingChecks).toEqual([])
    expect(update.dependencies).toEqual([])
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
