import { readFileSync } from "fs"
import { join } from "path"
import { describe, expect, it } from "vitest"
import type { TypeDescription } from "../../commonObjects/typeDescription/types"
import { typeDescriptionToDataPathTypeInfo } from "./typeDescription"

describe("typeDescriptionToDataPathTypeInfo", () => {
  it("preserves exact effective terminal branches", () => {
    expect(
      typeDescriptionToDataPathTypeInfo({
        type: ["CatalogRef.Номенклатура", "DefinedType.ОбъектУчета", "boolean"],
      })
    ).toMatchObject({
      terminalTypes: ["CatalogRef.Номенклатура", "boolean"],
      definedTypes: ["ОбъектУчета"],
      isComposite: true,
    })
  })

  it("maps primitive DataPath terminal types", () => {
    expect(typeDescriptionToDataPathTypeInfo({ type: ["boolean"] })).toMatchObject({
      kinds: ["boolean"],
      nextTypes: [],
      sourceText: "boolean",
    })
    expect(typeDescriptionToDataPathTypeInfo({ type: ["dateTime"] })).toMatchObject({
      kinds: ["dateTime"],
      nextTypes: [],
      sourceText: "dateTime",
    })
    expect(typeDescriptionToDataPathTypeInfo({ type: ["Picture"] })).toMatchObject({
      kinds: ["Picture"],
      nextTypes: [],
      sourceText: "Picture",
    })
  })

  it("keeps all value kinds for composite type descriptions", () => {
    expect(typeDescriptionToDataPathTypeInfo({ type: ["boolean", "dateTime", "string"] })).toMatchObject({
      kinds: ["boolean", "dateTime", "scalar"],
      nextTypes: [],
      isComposite: true,
      sourceText: "boolean | dateTime | string",
    })
  })

  it("maps metadata references and objects to owner type refs", () => {
    expect(
      typeDescriptionToDataPathTypeInfo({
        type: ["CatalogRef.Контрагенты", "DocumentObject.ЗаказПокупателя"],
      })
    ).toMatchObject({
      kinds: ["object"],
      nextTypes: [
        { kind: "Справочник", name: "Контрагенты" },
        { kind: "ДокументОбъект", name: "ЗаказПокупателя" },
      ],
      isComposite: true,
      sourceText: "CatalogRef.Контрагенты | DocumentObject.ЗаказПокупателя",
    })
  })

  it("maps enumeration and defined type references as object terminals", () => {
    expect(
      typeDescriptionToDataPathTypeInfo({
        type: ["EnumRef.Состояния", "DefinedType.Организация"],
      })
    ).toMatchObject({
      kinds: ["object"],
      nextTypes: [{ kind: "Перечисление", name: "Состояния" }],
      definedTypes: ["Организация"],
      isComposite: true,
      sourceText: "EnumRef.Состояния | DefinedType.Организация",
    })
  })

  it("keeps DefinedType references for lazy project resolution", () => {
    expect(typeDescriptionToDataPathTypeInfo({ type: ["DefinedType.ДоговорКонтрагента"] })).toMatchObject({
      kinds: ["object"],
      nextTypes: [],
      definedTypes: ["ДоговорКонтрагента"],
      sourceText: "DefinedType.ДоговорКонтрагента",
    })
  })

  it("maps ValueTable to a table source", () => {
    expect(typeDescriptionToDataPathTypeInfo({ type: ["ValueTable"] })).toMatchObject({
      kinds: ["tableSource"],
      nextTypes: [],
      table: { kind: "ValueTable" },
      sourceText: "ValueTable",
    })
  })

  it("maps ValueTree to a table source", () => {
    expect(typeDescriptionToDataPathTypeInfo({ type: ["ValueTree"] })).toMatchObject({
      kinds: ["tableSource"],
      nextTypes: [],
      table: { kind: "ValueTree" },
      sourceText: "ValueTree",
    })
  })

  it("maps ValueList as a table source", () => {
    expect(typeDescriptionToDataPathTypeInfo({ type: ["ValueListType"] })).toMatchObject({
      kinds: ["tableSource"],
      nextTypes: [],
      table: { kind: "ValueList" },
      sourceText: "ValueListType",
    })
    expect(typeDescriptionToDataPathTypeInfo({ type: ["СписокЗначений"] })).toMatchObject({
      kinds: ["tableSource"],
      nextTypes: [],
      table: { kind: "ValueList" },
      sourceText: "СписокЗначений",
    })
  })

  it("maps GanttChart as a table source", () => {
    expect(typeDescriptionToDataPathTypeInfo({ type: ["GanttChart"] })).toMatchObject({
      kinds: ["tableSource"],
      nextTypes: [],
      table: { kind: "GanttChart" },
      sourceText: "GanttChart",
    })
    expect(typeDescriptionToDataPathTypeInfo({ type: ["ДиаграммаГанта"] })).toMatchObject({
      kinds: ["tableSource"],
      nextTypes: [],
      table: { kind: "GanttChart" },
      sourceText: "ДиаграммаГанта",
    })
  })

  it("maps register record set types as table sources", () => {
    expect(typeDescriptionToDataPathTypeInfo({ type: ["InformationRegisterRecordSet.Остатки"] })).toMatchObject({
      kinds: ["tableSource"],
      nextTypes: [],
      table: { kind: "RegisterRecordSet", owner: { kind: "РегистрСведений", name: "Остатки" } },
      sourceText: "InformationRegisterRecordSet.Остатки",
    })
    expect(typeDescriptionToDataPathTypeInfo({ type: ["AccumulationRegisterRecordSet.Продажи"] })).toMatchObject({
      kinds: ["tableSource"],
      table: { kind: "RegisterRecordSet", owner: { kind: "РегистрНакопления", name: "Продажи" } },
    })
    expect(typeDescriptionToDataPathTypeInfo({ type: ["AccountingRegisterRecordSet.Хозрасчетный"] })).toMatchObject({
      kinds: ["tableSource"],
      table: { kind: "RegisterRecordSet", owner: { kind: "РегистрБухгалтерии", name: "Хозрасчетный" } },
    })
    expect(typeDescriptionToDataPathTypeInfo({ type: ["CalculationRegisterRecordSet.Начисления"] })).toMatchObject({
      kinds: ["tableSource"],
      table: { kind: "RegisterRecordSet", owner: { kind: "РегистрРасчета", name: "Начисления" } },
    })
  })

  it("maps DynamicList as both dynamic list and table source", () => {
    expect(typeDescriptionToDataPathTypeInfo({ type: ["DynamicList"] })).toMatchObject({
      kinds: ["dynamicList", "tableSource"],
      nextTypes: [],
      table: { kind: "DynamicList" },
      sourceText: "DynamicList",
    })
  })

  it("maps ConstantsSet as a constant set source", () => {
    expect(typeDescriptionToDataPathTypeInfo({ type: ["ConstantsSet"] })).toMatchObject({
      kinds: ["constantSet"],
      nextTypes: [],
      sourceText: "ConstantsSet",
    })
    expect(typeDescriptionToDataPathTypeInfo({ type: ["КонстантыНабор"] })).toMatchObject({
      kinds: ["constantSet"],
      nextTypes: [],
      sourceText: "КонстантыНабор",
    })
  })

  it("maps SettingsComposer through the registered typed graph", () => {
    expect(typeDescriptionToDataPathTypeInfo({ type: ["SettingsComposer"] })).toMatchObject({
      kinds: ["tableSource"],
      nextTypes: [],
      terminalTypes: ["DataCompositionSettingsComposer"],
      table: { kind: "Registered", type: "DataCompositionSettingsComposer" },
    })
    expect(typeDescriptionToDataPathTypeInfo({ type: ["КомпоновщикНастроекКомпоновкиДанных"] })).toMatchObject({
      kinds: ["tableSource"],
      nextTypes: [],
      terminalTypes: ["DataCompositionSettingsComposer"],
      table: { kind: "Registered", type: "DataCompositionSettingsComposer" },
    })
  })

  it("maps StandardPeriod as a standard period source", () => {
    expect(typeDescriptionToDataPathTypeInfo({ type: ["StandardPeriod"] })).toMatchObject({
      kinds: ["standardPeriod"],
      nextTypes: [],
      sourceText: "StandardPeriod",
    })
    expect(typeDescriptionToDataPathTypeInfo({ type: ["СтандартныйПериод"] })).toMatchObject({
      kinds: ["standardPeriod"],
      nextTypes: [],
      sourceText: "СтандартныйПериод",
    })
  })

  it("maps missing type descriptions to unknown without using defaultType", () => {
    expect(typeDescriptionToDataPathTypeInfo(undefined, { defaultType: "boolean" })).toMatchObject({
      kinds: ["unknown"],
      nextTypes: [],
    })
    expect(typeDescriptionToDataPathTypeInfo({} as TypeDescription, { defaultType: "boolean" })).toMatchObject({
      kinds: ["unknown"],
      nextTypes: [],
    })
  })

  it("keeps unsupported special types as continuable intermediates", () => {
    expect(typeDescriptionToDataPathTypeInfo({ type: ["ValueStorage"] })).toMatchObject({
      kinds: ["unsupportedIntermediate"],
      nextTypes: [],
      sourceText: "ValueStorage",
    })
  })

  it("does not hard-code owner base type maps", () => {
    const source = readFileSync(join(process.cwd(), "../runtime/metadata/validation/dataPath/typeDescription.ts"), "utf-8")

    expect(source).not.toContain("ownerKindsByBaseType")
    expect(source).not.toContain("registerRecordSetOwnerKindsByBaseType")
    expect(source).toContain("getOwnerKindByTypeDescriptionBase")
    expect(source).toContain("getOwnerKindByRegisterRecordSetBase")
  })
})
