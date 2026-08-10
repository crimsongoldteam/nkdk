import { beforeAll, describe, expect, it } from "vitest"
import { mockContext } from "../../tests/mockContext"
import { parseMetadataYaml } from "@nkdk/runtime"
import { serializeYAMLDocument } from "@nkdk/runtime"
import { registerCoreMetadata } from "../composition/coreMetadata"
import { resolveValidationProjectFile } from "./projectFiles"
import { createValidationRulesSnapshot } from "./rulesSnapshot"
import { extractValidationYamlFacts } from "./yamlFactExtractor"
import { createValidationSchemaCache } from "./projectValidationPasses"
import { validateSerializedProjectYaml } from "../importFromXml/serializedYamlValidation"
import { toProjectStateFileUpdate } from "../projectState/fileUpdate"
import {
  createProjectReferenceIndex,
  createProjectReferenceSnapshot,
  validatePendingReferencesWithIndex,
} from "./projectReferenceIndex"

registerCoreMetadata()

const schemaCache = createValidationSchemaCache(mockContext)
const rulesSnapshot = createValidationRulesSnapshot(mockContext)

beforeAll(() => {
  const file = catalogFile()
  if (file.kind !== "properties") throw new Error("properties file expected")
  schemaCache.properties(file.owner.spec.rule)
})

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

  it("indexes a tagged incompatible reference without a local type error", () => {
    const facts = extract(`Реквизиты:
  Исполнитель:
    Тип: Справочник.ПолныеРоли
    ЗначениеЗаполнения: !xml Справочник.РолиИсполнителей.ПустаяСсылка
`)

    expect(facts.pendingReferences).toEqual([
      expect.objectContaining({
        yamlPath: ["Реквизиты", "Исполнитель", "ЗначениеЗаполнения"],
        canonical: "Catalog.РолиИсполнителей.EmptyRef",
        target: expect.objectContaining({
          kind: "value",
          root: "Catalog",
          objectName: "РолиИсполнителей",
        }),
      }),
    ])
    expect(facts.diagnostics.filter(({ path }) => path === "/Реквизиты/Исполнитель/ЗначениеЗаполнения")).toEqual([])
  })

  it("reports a missing catalog referenced by a tagged empty owner value", () => {
    const facts = extract(`Владельцы: []
СтандартныеРеквизиты:
  Владелец:
    ЗначениеЗаполнения: !xml Справочник.ПапкиФайлов.ПустаяСсылка
`)
    const fillValueReferences = facts.pendingReferences.filter(
      ({ yamlPath }) => yamlPath.at(-1) === "ЗначениеЗаполнения"
    )
    const snapshot = createProjectReferenceSnapshot({
      objectIndexEntries: [],
      memberIndexEntries: [],
      valueIndexEntries: [],
      pendingReferences: fillValueReferences,
    })
    const result = validatePendingReferencesWithIndex({
      index: createProjectReferenceIndex({ projectDir: "/project", snapshot }),
      references: fillValueReferences,
    })

    expect(fillValueReferences).toEqual([
      expect.objectContaining({
        canonical: "Catalog.ПапкиФайлов.EmptyRef",
        yamlPath: ["СтандартныеРеквизиты", "Владелец", "ЗначениеЗаполнения"],
      }),
    ])
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        filePath: "/project/Справочник/Товары/Свойства.yaml",
        message: 'Не найдена ссылка "Catalog.ПапкиФайлов.EmptyRef"',
        severity: "error",
      }),
    ])
  })

  it("stores only the reference in project state", () => {
    const document = serializeYAMLDocument({
      Реквизиты: {
        Получатель: {
          Тип: "Справочник.Контрагенты",
          ЗначениеЗаполнения: "Справочник.Контрагенты.Поставщик",
        },
        Комментарий: {
          Тип: "Строка(20)",
          ЗначениеЗаполнения: "текст",
        },
      },
    })
    const file = catalogFile()
    const firstPass = validateSerializedProjectYaml({
      projectDir: "/project",
      file,
      document,
      context: mockContext,
      schemaCache,
      rulesSnapshot,
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
    rulesSnapshot,
  })
}

function catalogFile() {
  const file = resolveValidationProjectFile("/project", "/project/Справочник/Товары/Свойства.yaml")
  if (file === undefined) throw new Error("file not resolved")
  return file
}
