import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { mockContext } from "../../tests/mockContext"
import { parseMetadataYaml } from "../../yaml/parseMetadataYaml"
import {
  registerDependentYamlItemHandler,
  restoreDependentItemRegistryForTests,
  snapshotDependentItemRegistryForTests,
  type DependentItemRegistrySnapshot,
  type DependentYamlItemParams,
} from "../ruleRuntime/property/dependentItemRegistry"
import { registerCoreMetadata } from "../composition/coreMetadata"
import { resolveValidationProjectFile } from "./projectFiles"
import { createValidationRulesSnapshot } from "./rulesSnapshot"
import { extractValidationYamlFacts } from "./yamlFactExtractor"

registerCoreMetadata()

describe("dependent fill value validation", () => {
  let registry: DependentItemRegistrySnapshot

  beforeEach(() => {
    registry = snapshotDependentItemRegistryForTests()
  })

  afterEach(() => restoreDependentItemRegistryForTests(registry))

  it("visits each nested item with its name, paths and root values", () => {
    const analyze = vi.fn((_params: DependentYamlItemParams) => ({ diagnostics: [], references: [], projectChecks: [] }))
    registerDependentYamlItemHandler("MetadataAttribute", analyze)
    const parsed = parseMetadataYaml("Реквизиты:\n  Артикул:\n    Тип: Строка\n")

    extractValidationYamlFacts({
      file: catalogFile(),
      parsed,
      rulesSnapshot: createValidationRulesSnapshot(mockContext),
    })

    expect(analyze).toHaveBeenCalledOnce()
    expect(analyze.mock.calls[0]?.[0]).toMatchObject({
      itemType: "MetadataAttribute",
      itemName: "Артикул",
      item: { Тип: "Строка" },
      itemYamlPath: ["Реквизиты", "Артикул"],
      rootYaml: parsed.data,
      rootRule: expect.objectContaining({ itemType: "MetadataCatalog" }),
    })
  })

  it("reports one semantic error for an explicitly stored implicit value", () => {
    const facts = extractValidationYamlFacts({
      file: catalogFile(),
      parsed: parseMetadataYaml('Реквизиты:\n  Артикул:\n    Тип: Строка(250)\n    ЗначениеЗаполнения: ""\n'),
      rulesSnapshot: createValidationRulesSnapshot(mockContext),
    })

    expect(facts.diagnostics.filter(({ path }) => path === "/Реквизиты/Артикул/ЗначениеЗаполнения")).toEqual([
      expect.objectContaining({
        severity: "error",
        message: expect.stringContaining("неявное значение"),
      }),
    ])
  })

  it("rejects an explicitly stored beginning date", () => {
    const facts = extractValidationYamlFacts({
      file: catalogFile(),
      parsed: parseMetadataYaml(
        "Реквизиты:\n  Момент:\n    Тип: ДатаВремя\n    ЗначениеЗаполнения: 01.01.0001 00:00:00\n"
      ),
      rulesSnapshot: createValidationRulesSnapshot(mockContext),
    })

    expect(facts.diagnostics.filter(({ path }) => path === "/Реквизиты/Момент/ЗначениеЗаполнения")).toEqual([
      expect.objectContaining({
        severity: "error",
        message: expect.stringContaining("неявное значение"),
      }),
    ])
  })

  it("accepts an explicitly stored meaningful date", () => {
    const facts = extractValidationYamlFacts({
      file: catalogFile(),
      parsed: parseMetadataYaml(
        "Реквизиты:\n  Момент:\n    Тип: ДатаВремя\n    ЗначениеЗаполнения: 09.08.2026 12:30:00\n"
      ),
      rulesSnapshot: createValidationRulesSnapshot(mockContext),
    })

    expect(facts.diagnostics.filter(({ path }) => path === "/Реквизиты/Момент/ЗначениеЗаполнения")).toEqual([])
  })

  it.each([
    ["invalid ordinary", "Тип: Строка(10)\n    ЗначениеЗаполнения: !xml 1", false],
    ["valid ordinary", "Тип: Строка(10)\n    ЗначениеЗаполнения: !xml текст", true],
    ["implicit ordinary", "Тип: Строка(10)\n    ЗначениеЗаполнения: !xml", true],
    ["unresolved ordinary", "Тип: НеизвестныйТип\n    ЗначениеЗаполнения: !xml текст", true],
  ] as const)("checks %s XML exception", (_name, body, expectsTagError) => {
    const diagnostics = extractAttributeDiagnostics(body)
    expect(diagnostics.some(({ message }) => message.includes("!xml"))).toBe(expectsTagError)
  })

  it.each(["!xml", "!xml Ложь", "!xml произвольный-текст"])(
    "разрешает %s для запрещённого стандартного реквизита",
    (fillValue) => {
      const diagnostics = extractDiagnostics(
        `СтандартныеРеквизиты:\n  Предопределенный:\n    ЗначениеЗаполнения: ${fillValue}\n`
      )
      expect(diagnostics.filter(({ path }) => path === "/СтандартныеРеквизиты/Предопределенный/ЗначениеЗаполнения")).toEqual([])
    }
  )

  it("отклоняет запрещённое значение без !xml", () => {
    const diagnostics = extractDiagnostics(
      "СтандартныеРеквизиты:\n  Предопределенный:\n    ЗначениеЗаполнения: Ложь\n"
    )
    expect(diagnostics.filter(({ path }) => path === "/СтандартныеРеквизиты/Предопределенный/ЗначениеЗаполнения")).toHaveLength(1)
  })

  it("отклоняет !xml у стандартного реквизита без политики", () => {
    const diagnostics = extractDiagnostics(
      "СтандартныеРеквизиты:\n  Наименование:\n    ЗначениеЗаполнения: !xml текст\n"
    )
    expect(diagnostics.filter(({ path }) => path === "/СтандартныеРеквизиты/Наименование/ЗначениеЗаполнения")).toEqual([
      expect.objectContaining({ message: expect.stringContaining("!xml") }),
    ])
  })

  it.each(["", "Владельцы: []\n"])(
    "отклоняет обычное значение владельца при пустом списке владельцев",
    (ownersYaml) => {
      for (const fillValue of [".", "Справочник.ПапкиФайлов.ПустаяСсылка"]) {
        const diagnostics = extractDiagnostics(`${ownersYaml}СтандартныеРеквизиты:
  Владелец:
    ЗначениеЗаполнения: ${fillValue}
`)
        expect(diagnostics.filter(({ path }) => path === "/СтандартныеРеквизиты/Владелец/ЗначениеЗаполнения")).toEqual([
          expect.objectContaining({
            severity: "error",
            message: "у справочника отсутствуют владельцы; значение заполнения реквизита Владелец допускается только с !xml",
          }),
        ])
      }
    }
  )

  it.each(["", "Владельцы: []\n"])(
    "разрешает XML-исключения и отсутствие значения владельца при пустом списке",
    (ownersYaml) => {
      for (const fillValue of ["!xml DesignTimeRef", "!xml Справочник.ПапкиФайлов.ПустаяСсылка"]) {
        const facts = extractFacts(`${ownersYaml}СтандартныеРеквизиты:
  Владелец:
    ЗначениеЗаполнения: ${fillValue}
`)
        expect(facts.diagnostics.filter(({ path }) => path === "/СтандартныеРеквизиты/Владелец/ЗначениеЗаполнения")).toEqual([])
        expect(facts.pendingReferences.some(({ yamlPath }) => yamlPath.at(-1) === "ЗначениеЗаполнения")).toBe(
          fillValue.includes("ПустаяСсылка")
        )
      }

      const diagnostics = extractDiagnostics(`${ownersYaml}СтандартныеРеквизиты:
  Владелец: {}
`)
      expect(diagnostics.filter(({ path }) => path === "/СтандартныеРеквизиты/Владелец/ЗначениеЗаполнения")).toEqual([])
    }
  )

  it.each([
    ["неявные свойства справочника", `СтандартныеРеквизиты:
  Код:
    ЗначениеЗаполнения: "123"
`],
    ["явная длина и неявный тип", `ДлинаКода: 3
СтандартныеРеквизиты:
  Код:
    ЗначениеЗаполнения: "--"
`],
  ])("проверяет код через %s", (_name, yaml) => {
    const diagnostics = extractDiagnostics(yaml)
      .filter(({ path }) => path === "/СтандартныеРеквизиты/Код/ЗначениеЗаполнения")
    expect(diagnostics).toEqual([])
  })

  it("отклоняет код длиннее неявной длины", () => {
    const diagnostics = extractDiagnostics(`СтандартныеРеквизиты:
  Код:
    ЗначениеЗаполнения: "1234567890"
`)
    expect(diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({
        path: "/СтандартныеРеквизиты/Код/ЗначениеЗаполнения",
        severity: "error",
      }),
    ]))
  })

  it("откладывает проверку DefinedType без локального предупреждения", () => {
    const facts = extractValidationYamlFacts({
      file: catalogFile(),
      parsed: parseMetadataYaml(`Реквизиты:
  Автор:
    Тип: ОпределяемыйТип.АвторДействия
    ЗначениеЗаполнения: Справочник.Пользователи.ПустаяСсылка
`),
      rulesSnapshot: createValidationRulesSnapshot(mockContext),
    })

    expect(facts.diagnostics.filter(({ path }) => path === "/Реквизиты/Автор/ЗначениеЗаполнения")).toEqual([])
    expect(facts.pendingChecks).toEqual([
      expect.objectContaining({
        kind: "fillValue",
        yamlPath: ["Реквизиты", "Автор", "ЗначениеЗаполнения"],
        itemType: "MetadataAttribute",
        type: { type: ["DefinedType.АвторДействия"] },
        value: { type: "ref", value: "Catalog.Пользователи.EmptyRef" },
        tagged: false,
      }),
    ])
    expect(facts.pendingChecks[0]).not.toHaveProperty("parsed")
  })

  it("разрешает точный DesignTimeRef только для ссылочного типа и не индексирует его", () => {
    const referenceFacts = extractValidationYamlFacts({
      file: catalogFile(),
      parsed: parseMetadataYaml(`Реквизиты:
  Получатель:
    Тип: Справочник.Контрагенты
    ЗначениеЗаполнения: !xml DesignTimeRef
`),
      rulesSnapshot: createValidationRulesSnapshot(mockContext),
    })
    expect(referenceFacts.diagnostics.filter(({ path }) => path === "/Реквизиты/Получатель/ЗначениеЗаполнения")).toEqual([])
    expect(referenceFacts.pendingReferences.filter(({ yamlPath }) => yamlPath.at(-1) === "ЗначениеЗаполнения")).toEqual([])

    const stringDiagnostics = extractAttributeDiagnostics("Тип: Строка\n    ЗначениеЗаполнения: !xml DesignTimeRef")
    expect(stringDiagnostics).toEqual([
      expect.objectContaining({ message: expect.stringContaining("только для ссылочного типа") }),
    ])
  })

  it.each([
    ["Родитель справочника", catalogFile(), "Родитель"],
    ["БизнесПроцесс задачи", taskFile(), "БизнесПроцесс"],
  ])("разрешает DesignTimeRef для ссылочного стандартного реквизита %s", (_name, file, member) => {
    const facts = extractValidationYamlFacts({
      file,
      parsed: parseMetadataYaml(`СтандартныеРеквизиты:
  ${member}:
    ЗначениеЗаполнения: !xml DesignTimeRef
`),
      rulesSnapshot: createValidationRulesSnapshot(mockContext),
    })

    expect(facts.diagnostics.filter(({ path }) => path?.endsWith("/ЗначениеЗаполнения"))).toEqual([])
    expect(facts.pendingReferences.filter(({ yamlPath }) => yamlPath.at(-1) === "ЗначениеЗаполнения")).toEqual([])
  })
})

function extractAttributeDiagnostics(body: string) {
  return extractDiagnostics(`Реквизиты:\n  Артикул:\n    ${body}\n`)
    .filter(({ path }) => path === "/Реквизиты/Артикул/ЗначениеЗаполнения")
}

function extractDiagnostics(yaml: string) {
  return extractFacts(yaml).diagnostics
}

function extractFacts(yaml: string) {
  return extractValidationYamlFacts({
    file: catalogFile(),
    parsed: parseMetadataYaml(yaml),
    rulesSnapshot: createValidationRulesSnapshot(mockContext),
  })
}

function catalogFile() {
  const file = resolveValidationProjectFile("/project", "/project/Справочник/Товары/Свойства.yaml")
  if (file === undefined) throw new Error("file not resolved")
  return file
}

function taskFile() {
  const file = resolveValidationProjectFile("/project", "/project/Задача/ЗадачаИсполнителя/Свойства.yaml")
  if (file === undefined) throw new Error("file not resolved")
  return file
}
