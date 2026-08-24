import { parseMetadataYaml } from "@nkdk/runtime"
import type { DataPathPropertyRule } from "@nkdk/runtime/rule-kit"
import { beforeAll,describe,expect,it } from "vitest"
import type { TypeDescriptionView } from "../ruleRuntime/property/typeDescriptionView"
import type { OwnerMetadataCache } from "./dataPath/ownerCache"
import { ownerMetadataFromFacts } from "./dataPath/ownerCache"
import { toDataPathPolicyInput } from "./dataPath/policies"
import { resolveValidationProjectFile } from "./projectFiles"
import type { ValidationPendingCheck } from "./projectValidationPendingChecks"
import { validatePendingChecks } from "./projectValidationPendingChecks"
import {
createTestValidationRulesSnapshot,
missingOwnerMetadataCache,
} from "./tests/validationTestSupport"
import { extractValidationYamlFacts } from "./yamlFactExtractor"


const ownerCache = missingOwnerMetadataCache
let rulesSnapshot: ReturnType<typeof createTestValidationRulesSnapshot>

beforeAll(() => {
  rulesSnapshot = createTestValidationRulesSnapshot()
})

describe("validatePendingChecks", () => {

  it.each([
    ["Значение", []],
    [
      "Неизвестное",
      [
        expect.objectContaining({
          source: "structure",
          path: "/Элементы/Поле/КонтекстноеМеню/Элементы/Открыть/Данные",
          message: 'ПутьКДанным "Неизвестное": неизвестный корень "Неизвестное"',
        }),
      ],
    ],
  ])("проверяет DataPath %s внутри single-элемента", (dataPath, expectedDiagnostics) => {
    const projectDir = "/project"
    const filePath = "/project/Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml"
    const file = resolveValidationProjectFile(projectDir, filePath)
    if (file === undefined) throw new Error("file not resolved")
    const parsed = parseMetadataYaml(
      [
        "Реквизиты:",
        "  Значение:",
        "    Тип: Строка",
        "Элементы:",
        "  Поле:",
        "    Вид: ПолеВвода",
        "    КонтекстноеМеню:",
        "      Элементы:",
        "        Открыть:",
        "          Вид: КнопкаКоманднойПанели",
        `          Данные: ${dataPath}`,
      ].join("\n")
    )
    const facts = extractValidationYamlFacts({
      file,
      parsed,
      rulesSnapshot,
    })

    expect(JSON.stringify(facts.pendingChecks)).not.toContain("syntaxErrors")
    expect(facts.pendingChecks[0]).not.toHaveProperty("parsed")
    expect(facts.pendingChecks[0]).toHaveProperty(
      "location.path",
      "/Элементы/Поле/КонтекстноеМеню/Элементы/Открыть/Данные"
    )

    const dataPathChecks = facts.pendingChecks.filter((check) => check.kind === "dataPath")
    const fullRule = {
      ...dataPathChecks[0]!.policyInput,
      type: "DataPath",
      defaultType: "string",
    } satisfies DataPathPropertyRule
    const checksWithCurrentRule = dataPathChecks.map((check) => ({ ...check, policyInput: fullRule }))
    const checksWithRestoredPolicy = dataPathChecks.map((check) => ({
      ...check,
      policyInput: toDataPathPolicyInput(fullRule),
    }))
    expect(validatePendingChecks({ ownerCache, checks: checksWithRestoredPolicy })).toEqual(
      validatePendingChecks({ ownerCache, checks: checksWithCurrentRule })
    )

    expect(validatePendingChecks({ ownerCache, checks: dataPathChecks }).diagnostics).toEqual(
      expectedDiagnostics
    )
  })

  it.each([
    ["допустимая ссылка", "CatalogRef.Пользователи", false, 0],
    ["несовместимая ссылка", "CatalogRef.Сотрудники", false, 1],
    ["несовместимое значение с invalid", "CatalogRef.Сотрудники", true, 0],
  ] as const)("проверяет DefinedType: %s", (_name, sourceType, withXmlAnomaly, diagnosticCount) => {
    const cache = definedTypeCache({ АвторДействия: { type: [sourceType] } })
    const check = fillValueCheck(withXmlAnomaly)
    expect(validatePendingChecks({ ownerCache: cache, checks: [check] }).diagnostics).toHaveLength(diagnosticCount)
  })

  it.each([
    ["отсутствующий", definedTypeCache({}), "не найден"],
    ["пустой", definedTypeCache({ АвторДействия: undefined }), "не задан Тип"],
    ["цикл", definedTypeCache({
      АвторДействия: { type: ["DefinedType.Другой"] },
      Другой: { type: ["DefinedType.АвторДействия"] },
    }), "цикл определяемых типов"],
  ] as const)("не считает предупреждение о %s DefinedType подтверждением invalid", (_name, cache, _message) => {
    const diagnostics = validatePendingChecks({ ownerCache: cache, checks: [fillValueCheck(true)] }).diagnostics
    expect(diagnostics).toEqual([expect.objectContaining({
      source: "structure",
      message: expect.stringContaining("Тег XML-аномалии лишний"),
    })])
  })

  it("разрешает DesignTimeRef для ссылочного DefinedType и отклоняет для строкового", () => {
    const check = { ...fillValueCheck(false), value: { type: "ref", value: "" }, transport: "DesignTimeRef" as const }
    expect(validatePendingChecks({
      ownerCache: definedTypeCache({ АвторДействия: { type: ["CatalogRef.Пользователи"] } }),
      checks: [check],
    }).diagnostics).toEqual([])
    expect(validatePendingChecks({
      ownerCache: definedTypeCache({ АвторДействия: { type: ["string"] } }),
      checks: [check],
    }).diagnostics).toEqual([
      expect.objectContaining({ message: expect.stringContaining("только для ссылочного типа") }),
    ])
  })
})

function fillValueCheck(withXmlAnomaly: boolean): Extract<ValidationPendingCheck, { kind: "fillValue" }> {
  return {
    kind: "fillValue",
    yamlPath: ["Реквизиты", "Автор", "ЗначениеЗаполнения"],
    location: { filePath: "/project/Справочник/Товары/Свойства.yaml", line: 4, col: 5 },
    itemType: "MetadataAttribute",
    type: { type: ["DefinedType.АвторДействия"] },
    value: { type: "ref", value: "Catalog.Пользователи.Администратор" },
    ...(withXmlAnomaly ? { xmlAnomaly: "pending" as const } : {}),
  }
}

function definedTypeCache(types: Readonly<Record<string, TypeDescriptionView | undefined>>): OwnerMetadataCache {
  return {
    get(ref) {
      if (ref.name === undefined || !Object.prototype.hasOwnProperty.call(types, ref.name)) {
        return { status: "not-found", diagnostics: [{
          filePath: `/project/ОпределяемыйТип/${ref.name ?? ""}.yaml`,
          line: 1,
          col: 1,
          severity: "error",
          source: "cross-file",
          message: `не найден определяемый тип ${ref.name ?? ""}`,
        }] }
      }
      return ownerMetadataFromFacts({
        projectDir: "/project",
        ref,
        facts: types[ref.name] === undefined ? {} : { type: types[ref.name] },
        fieldIndex: { fields: new Map(), standardAttributeAliases: new Map(), diagnostics: [] },
      })
    },
    listRefs: () => [],
  }
}
