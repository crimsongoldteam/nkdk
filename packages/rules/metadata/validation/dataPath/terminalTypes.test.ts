import { describe, expect, it } from "vitest"
import { createPropertyRuleRegistrySet, withPropertyRuleRegistrySet } from "@nkdk/runtime/rule-kit"
import { dataPathTerminalGroupsIntersect, normalizeDataPathTerminalType } from "./terminalTypes"
import { emptyMetadataRules } from "../../ruleRuntime/definition/testSupport"

describe("normalizeDataPathTerminalType", () => {
  it.each([
    ["string", "string"],
    ["decimal", "decimal"],
    ["boolean", "boolean"],
    ["dateTime", "dateTime"],
    ["CatalogRef.Номенклатура", "CatalogRef.*"],
    ["CatalogRef", "CatalogRef"],
    ["DocumentRef.Заказ", "DocumentRef.*"],
    ["EnumRef.Состояния", "EnumRef.*"],
    ["CatalogTabularSection.Номенклатура.Товары", "CatalogTabularSection.*"],
    ["ChartOfAccountsTabularSection.Хозрасчетный.ВидыСубконто", "ChartOfAccountsTabularSection.*"],
    ["InformationRegisterRecordSet.Цены", "InformationRegisterRecordSet.*"],
    ["AccumulationRegisterRecordSet.Продажи", "AccumulationRegisterRecordSet.*"],
    ["AccountingRegisterRecordSet.Хозрасчетный", "AccountingRegisterRecordSet.*"],
    ["CalculationRegisterRecordSet.Начисления", "CalculationRegisterRecordSet.*"],
    ["ValueTable", "ValueTable"],
    ["Order", "Order"],
  ] as const)("normalizes %s to %s", (source, expected) => {
    expect(
      normalizeDataPathTerminalType({
        kinds: ["object"],
        nextTypes: [],
        terminalTypes: [source],
        sourceText: source,
      })
    ).toMatchObject({ status: "resolved", groups: [expected], composite: false })
  })

  it("maps a registered platform enumeration to one matrix group", () => {
    const registry = createPropertyRuleRegistrySet({
      ...emptyMetadataRules,
      systemEnumerations: { __terminal_type_test_enum__: { fromYAML: {}, toYAML: {} } },
    })
    expect(withPropertyRuleRegistrySet(registry, () =>
      normalizeDataPathTerminalType({
        kinds: ["scalar"],
        nextTypes: [],
        terminalTypes: ["__terminal_type_test_enum__"],
      }))
    ).toMatchObject({ status: "resolved", groups: ["<standard-enum>"], composite: false })
  })

  it("keeps all effective branches of a composite type", () => {
    expect(
      normalizeDataPathTerminalType({
        kinds: ["scalar", "boolean"],
        nextTypes: [],
        terminalTypes: ["string", "boolean"],
        isComposite: true,
      })
    ).toEqual({
      status: "resolved",
      groups: ["string", "boolean"],
      composite: true,
      display: "string | boolean",
    })
  })

  it("keeps DefinedType as a declaration group without making one effective branch composite", () => {
    expect(
      normalizeDataPathTerminalType({
        kinds: ["object"],
        nextTypes: [{ kind: "Справочник", name: "Номенклатура" }],
        terminalTypes: ["CatalogRef.Номенклатура"],
        definedTypes: ["ОбъектУчета"],
      })
    ).toEqual({
      status: "resolved",
      groups: ["CatalogRef.*", "DefinedType.*"],
      composite: false,
      display: "CatalogRef.*",
    })
  })

  it("distinguishes known any from unavailable terminal details", () => {
    expect(
      normalizeDataPathTerminalType({ kinds: ["any"], nextTypes: [], terminalTypes: ["<any>"] })
    ).toMatchObject({ status: "resolved", groups: ["<any>"] })
    expect(normalizeDataPathTerminalType({ kinds: ["unknown"], nextTypes: [] })).toMatchObject({
      status: "notResolved",
    })
  })

  it("uses structural table metadata when exact branches are absent", () => {
    expect(
      normalizeDataPathTerminalType({
        kinds: ["tableSource"],
        nextTypes: [],
        table: { kind: "ValueTable" },
      })
    ).toMatchObject({ status: "resolved", groups: ["ValueTable"], composite: false })
  })
})

describe("dataPathTerminalGroupsIntersect", () => {
  const resolved = (...groups: string[]) => ({
    status: "resolved" as const,
    groups: groups as never,
    composite: groups.length > 1,
    display: groups.join(" | "),
  })

  it.each([
    [resolved("decimal"), resolved("decimal"), true],
    [resolved("decimal"), resolved("string"), false],
    [resolved("CatalogRef.*"), resolved("CatalogRef.*"), true],
    [resolved("AnyIBRef"), resolved("DocumentRef.*"), true],
    [resolved("string", "decimal"), resolved("decimal"), true],
    [resolved("<any>"), resolved("boolean"), undefined],
    [{ status: "notResolved" as const, display: "unknown" }, resolved("boolean"), undefined],
  ])("сравнивает нормализованные группы", (left, right, expected) => {
    expect(dataPathTerminalGroupsIntersect(left, right)).toBe(expected)
  })
})
