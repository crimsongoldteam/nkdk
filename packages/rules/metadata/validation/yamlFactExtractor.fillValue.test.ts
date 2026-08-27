import { parseMetadataYaml } from "@nkdk/runtime"
import { beforeAll,describe,expect,it,vi } from "vitest"
import { mockContext } from "../../tests/mockContext"
import { metadataRules } from "../composition/metadataRules"
import { composeMetadataRules,defineMetadataRules } from "../ruleRuntime/definition"
import { emptyMetadataRules } from "../ruleRuntime/definition/testSupport"
import type { DependentYamlItemParams } from "../ruleRuntime/property/dependentItemRegistry"
import { createRuleRegistrySet } from "../ruleRuntime/ruleRegistrySet"
import { resolveValidationProjectFile } from "./projectFiles"
import { createValidationRulesSnapshot } from "./rulesSnapshot"
import { createValidationRegistrySet } from "./validationRegistrySet"
import { extractValidationYamlFacts } from "./yamlFactExtractor"

let rulesSnapshot: ReturnType<typeof createValidationRulesSnapshot>

beforeAll(() => {
  rulesSnapshot = createValidationRulesSnapshot(mockContext)
})

describe("dependent fill value validation", () => {
  it("visits each nested item with its name, paths and root values", () => {
    const analyze = vi.fn((_params: DependentYamlItemParams) => ({ diagnostics: [], references: [], projectChecks: [] }))
    const definition = composeMetadataRules(metadataRules, defineMetadataRules({
      ...emptyMetadataRules,
      dependentItems: { MetadataAttribute: { yaml: analyze } },
    }))
    const rules = createRuleRegistrySet(definition)
    const runtime = createValidationRegistrySet(definition, rules)
    const parsed = parseMetadataYaml("Реквизиты:\n  Артикул:\n    Тип: Строка\n")

    extractValidationYamlFacts({
      file: catalogFile(),
      parsed,
      rulesSnapshot,
      runtime,
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
      rulesSnapshot,
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
      rulesSnapshot,
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
      rulesSnapshot,
    })

    expect(facts.diagnostics.filter(({ path }) => path === "/Реквизиты/Момент/ЗначениеЗаполнения")).toEqual([])
  })

  it("отклоняет запрещённое значение без !xml", () => {
    const diagnostics = extractDiagnostics(
      "СтандартныеРеквизиты:\n  Предопределенный:\n    ЗначениеЗаполнения: Ложь\n"
    )
    expect(diagnostics.filter(({ path }) => path === "/СтандартныеРеквизиты/Предопределенный/ЗначениеЗаполнения")).toHaveLength(1)
  })

  it.each([
    ["", "."],
    ["", "Справочник.ПапкиФайлов.ПустаяСсылка"],
    ["Владельцы: []\n", "."],
    ["Владельцы: []\n", "Справочник.ПапкиФайлов.ПустаяСсылка"],
  ])(
    "отклоняет обычное значение владельца при пустом списке владельцев",
    (ownersYaml, fillValue) => {
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
      rulesSnapshot,
    })

    expect(facts.diagnostics.filter(({ path }) => path === "/Реквизиты/Автор/ЗначениеЗаполнения")).toEqual([])
    expect(facts.pendingChecks).toEqual([
      expect.objectContaining({
        kind: "fillValue",
        yamlPath: ["Реквизиты", "Автор", "ЗначениеЗаполнения"],
        itemType: "MetadataAttribute",
        type: { type: ["DefinedType.АвторДействия"] },
        value: { type: "ref", value: "Catalog.Пользователи.EmptyRef" },
      }),
    ])
    expect(facts.pendingChecks[0]).not.toHaveProperty("xmlAnomaly")
    expect(facts.pendingChecks[0]).not.toHaveProperty("parsed")
  })

  it("сохраняет помеченное FillValue как ожидающую XML-границу", () => {
    const facts = extractValidationYamlFacts({
      file: catalogFile(),
      parsed: parseMetadataYaml(`Реквизиты:
  Автор:
    Тип: ОпределяемыйТип.АвторДействия
    ЗначениеЗаполнения: !xml/invalid Справочник.Пользователи.ПустаяСсылка
`),
      rulesSnapshot,
    })

    expect(facts.pendingChecks).toContainEqual(expect.objectContaining({
      kind: "fillValue",
      yamlPath: ["Реквизиты", "Автор", "ЗначениеЗаполнения"],
      xmlAnomaly: "pending",
    }))
  })
})

function extractDiagnostics(yaml: string) {
  return extractFacts(yaml).diagnostics
}

function extractFacts(yaml: string) {
  return extractValidationYamlFacts({
    file: catalogFile(),
    parsed: parseMetadataYaml(yaml),
    rulesSnapshot,
  })
}

function catalogFile() {
  const file = resolveValidationProjectFile("/project", "/project/Справочник/Товары/Свойства.yaml")
  if (file === undefined) throw new Error("file not resolved")
  return file
}
