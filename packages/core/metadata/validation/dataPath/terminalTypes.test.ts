import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { registerSystemEnumeration } from "../../ruleRuntime/property/systemEnumerationRegistry"
import {
  registerDataPathOwnerKind,
  restoreOwnerKindRegistryForTests,
  snapshotOwnerKindRegistryForTests,
  type OwnerKindRegistrySnapshot,
} from "./ownerKindRegistry"
import { normalizeDataPathTerminalType } from "./terminalTypes"

let ownerKindsBeforeTest: OwnerKindRegistrySnapshot

beforeAll(() => {
  ownerKindsBeforeTest = snapshotOwnerKindRegistryForTests()
  registerDataPathOwnerKind({
    kind: "Справочник",
    projectDir: "Справочник",
    rule: {} as never,
    typeDescriptionBases: ["CatalogRef"],
  })
  registerDataPathOwnerKind({
    kind: "РегистрРасчета",
    projectDir: "РегистрРасчета",
    rule: {} as never,
    registerRecordSetBases: ["CalculationRegisterRecordSet"],
  })
  registerSystemEnumeration("__terminal_type_test_enum__", { fromYAML: {}, toYAML: {} })
})

afterAll(() => restoreOwnerKindRegistryForTests(ownerKindsBeforeTest))

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
    expect(
      normalizeDataPathTerminalType({
        kinds: ["scalar"],
        nextTypes: [],
        terminalTypes: ["__terminal_type_test_enum__"],
      })
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

  it("uses an unambiguous owner reference when exact branches are absent", () => {
    expect(
      normalizeDataPathTerminalType({
        kinds: ["object"],
        nextTypes: [{ kind: "Справочник", name: "Номенклатура" }],
      })
    ).toMatchObject({ status: "resolved", groups: ["CatalogRef.*"], composite: false })
  })

  it("uses structural table metadata when exact branches are absent", () => {
    expect(
      normalizeDataPathTerminalType({
        kinds: ["tableSource"],
        nextTypes: [],
        table: { kind: "RegisterRecordSet", owner: { kind: "РегистрРасчета", name: "Начисления" } },
      })
    ).toMatchObject({ status: "resolved", groups: ["CalculationRegisterRecordSet.*"], composite: false })
  })
})
