import { describe, expect, it } from "vitest"
import type { TypeDescription } from "~/metadata/commonObjects/typeDescription/types"
import { typeDescriptionToDataPathTypeInfo } from "./typeDescription"

describe("typeDescriptionToDataPathTypeInfo", () => {
  it("maps primitive DataPath terminal types", () => {
    expect(typeDescriptionToDataPathTypeInfo({ type: ["boolean"] })).toEqual({
      kinds: ["boolean"],
      nextTypes: [],
      sourceText: "boolean",
    })
    expect(typeDescriptionToDataPathTypeInfo({ type: ["dateTime"] })).toEqual({
      kinds: ["dateTime"],
      nextTypes: [],
      sourceText: "dateTime",
    })
    expect(typeDescriptionToDataPathTypeInfo({ type: ["Picture"] })).toEqual({
      kinds: ["Picture"],
      nextTypes: [],
      sourceText: "Picture",
    })
  })

  it("keeps all value kinds for composite type descriptions", () => {
    expect(typeDescriptionToDataPathTypeInfo({ type: ["boolean", "dateTime", "string"] })).toEqual({
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
      }),
    ).toEqual({
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
      }),
    ).toEqual({
      kinds: ["object"],
      nextTypes: [{ kind: "Перечисление", name: "Состояния" }],
      isComposite: true,
      sourceText: "EnumRef.Состояния | DefinedType.Организация",
    })
  })

  it("maps ValueTable to a table source", () => {
    expect(typeDescriptionToDataPathTypeInfo({ type: ["ValueTable"] })).toEqual({
      kinds: ["tableSource"],
      nextTypes: [],
      table: { kind: "ValueTable" },
      sourceText: "ValueTable",
    })
  })

  it("maps ValueTree to a table source", () => {
    expect(typeDescriptionToDataPathTypeInfo({ type: ["ValueTree"] })).toEqual({
      kinds: ["tableSource"],
      nextTypes: [],
      table: { kind: "ValueTree" },
      sourceText: "ValueTree",
    })
  })

  it("maps ValueList as a table source", () => {
    expect(typeDescriptionToDataPathTypeInfo({ type: ["ValueListType"] })).toEqual({
      kinds: ["tableSource"],
      nextTypes: [],
      table: { kind: "ValueList" },
      sourceText: "ValueListType",
    })
    expect(typeDescriptionToDataPathTypeInfo({ type: ["СписокЗначений"] })).toEqual({
      kinds: ["tableSource"],
      nextTypes: [],
      table: { kind: "ValueList" },
      sourceText: "СписокЗначений",
    })
  })

  it("maps GanttChart as a table source", () => {
    expect(typeDescriptionToDataPathTypeInfo({ type: ["GanttChart"] })).toEqual({
      kinds: ["tableSource"],
      nextTypes: [],
      table: { kind: "GanttChart" },
      sourceText: "GanttChart",
    })
    expect(typeDescriptionToDataPathTypeInfo({ type: ["ДиаграммаГанта"] })).toEqual({
      kinds: ["tableSource"],
      nextTypes: [],
      table: { kind: "GanttChart" },
      sourceText: "ДиаграммаГанта",
    })
  })

  it("maps register record set types as table sources", () => {
    expect(typeDescriptionToDataPathTypeInfo({ type: ["InformationRegisterRecordSet.Остатки"] })).toEqual({
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
    expect(typeDescriptionToDataPathTypeInfo({ type: ["DynamicList"] })).toEqual({
      kinds: ["dynamicList", "tableSource"],
      nextTypes: [],
      table: { kind: "DynamicList" },
      sourceText: "DynamicList",
    })
  })

  it("maps ConstantsSet as a constant set source", () => {
    expect(typeDescriptionToDataPathTypeInfo({ type: ["ConstantsSet"] })).toEqual({
      kinds: ["constantSet"],
      nextTypes: [],
      sourceText: "ConstantsSet",
    })
    expect(typeDescriptionToDataPathTypeInfo({ type: ["КонстантыНабор"] })).toEqual({
      kinds: ["constantSet"],
      nextTypes: [],
      sourceText: "КонстантыНабор",
    })
  })

  it("maps SettingsComposer as an opaque platform source", () => {
    expect(typeDescriptionToDataPathTypeInfo({ type: ["SettingsComposer"] })).toEqual({
      kinds: ["platformSource"],
      nextTypes: [],
      sourceText: "SettingsComposer",
    })
    expect(typeDescriptionToDataPathTypeInfo({ type: ["КомпоновщикНастроекКомпоновкиДанных"] })).toEqual({
      kinds: ["platformSource"],
      nextTypes: [],
      sourceText: "КомпоновщикНастроекКомпоновкиДанных",
    })
  })

  it("maps StandardPeriod as a standard period source", () => {
    expect(typeDescriptionToDataPathTypeInfo({ type: ["StandardPeriod"] })).toEqual({
      kinds: ["standardPeriod"],
      nextTypes: [],
      sourceText: "StandardPeriod",
    })
    expect(typeDescriptionToDataPathTypeInfo({ type: ["СтандартныйПериод"] })).toEqual({
      kinds: ["standardPeriod"],
      nextTypes: [],
      sourceText: "СтандартныйПериод",
    })
  })

  it("maps missing type descriptions to unknown without using defaultType", () => {
    expect(typeDescriptionToDataPathTypeInfo(undefined, { defaultType: "boolean" })).toEqual({
      kinds: ["unknown"],
      nextTypes: [],
    })
    expect(typeDescriptionToDataPathTypeInfo({} as TypeDescription, { defaultType: "boolean" })).toEqual({
      kinds: ["unknown"],
      nextTypes: [],
    })
  })

  it("keeps unsupported special types as continuable intermediates", () => {
    expect(typeDescriptionToDataPathTypeInfo({ type: ["ValueStorage"] })).toEqual({
      kinds: ["unsupportedIntermediate"],
      nextTypes: [],
      sourceText: "ValueStorage",
    })
  })
})
