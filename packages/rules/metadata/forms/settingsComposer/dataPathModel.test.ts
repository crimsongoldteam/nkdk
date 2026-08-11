import { describe, expect, it } from "vitest"
import {
  resolveSettingsComposerProperty,
  settingsComposerInternalToYaml,
  settingsComposerNamePairs,
  settingsComposerTypeInfo,
  settingsComposerYamlToInternal,
} from "./dataPathModel"

const expectedNamePairs = [
  ["AdditionType", "ТипДополнения"], ["Appearance", "Оформление"],
  ["AppearanceFieldsAvailableFields", "ДоступныеПоляОформляемыхПолей"], ["Application", "Применение"],
  ["BeginOfPeriod", "НачалоПериода"], ["BeginOfPeriodPicture", "КартинкаНачалаПериода"],
  ["ComparisonType", "ВидСравнения"], ["ConditionalAppearance", "УсловноеОформление"],
  ["CurrentData", "ТекущиеДанные"], ["DataParameters", "ПараметрыДанных"], ["Date", "Дата"],
  ["EditInReportForm", "РедактированиеВФормеОтчета"], ["EndDate", "ДатаОкончания"],
  ["EndOfPeriod", "КонецПериода"], ["EndOfPeriodPicture", "КартинкаКонцаПериода"],
  ["Field", "Поле"], ["FieldPicture", "КартинкаПоля"], ["Fields", "Поля"], ["Filter", "Отбор"],
  ["FilterAvailableFields", "ДоступныеПоляОтбора"], ["FixedSettings", "ФиксированныеНастройки"],
  ["GroupFields", "ПоляГруппировки"], ["GroupFieldsAvailableFields", "ДоступныеПоляПолейГруппировок"],
  ["GroupType", "ТипГруппы"], ["HasConditionalAppearance", "НаличиеУсловногоОформления"],
  ["HasFilter", "НаличиеОтбора"], ["HasOrder", "НаличиеПорядка"],
  ["HasOutputParameters", "НаличиеПараметровВывода"], ["HasSelection", "НаличиеВыбора"],
  ["ItemConditionalAppearance", "ЭлементУсловноеОформление"], ["ItemDataParameters", "ЭлементПараметрыДанных"],
  ["ItemFilter", "ЭлементОтбор"], ["ItemGroupFields", "ЭлементПоляГруппировки"],
  ["ItemOrder", "ЭлементПорядок"], ["ItemOutputParameters", "ЭлементПараметрыВывода"],
  ["ItemSelection", "ЭлементВыбор"], ["ItemUserFields", "ЭлементПользовательскиеПоля"],
  ["Items", "Элементы"], ["LeftValue", "ЛевоеЗначение"], ["LeftValuePicture", "КартинкаЛевогоЗначения"],
  ["Order", "Порядок"], ["OrderAvailableFields", "ДоступныеПоляПорядка"],
  ["OrderType", "ТипУпорядочивания"], ["OutputParameters", "ПараметрыВывода"], ["Parameter", "Параметр"],
  ["Placement", "Расположение"], ["Presentation", "Представление"],
  ["ReportStructure", "СтруктураОтчета"], ["ReportStructurePicture", "КартинкаСтруктурыОтчета"],
  ["RightValue", "ПравоеЗначение"], ["RightValuePicture", "КартинкаПравогоЗначения"],
  ["Selection", "Выбор"], ["SelectionAvailableFields", "ДоступныеПоляВыбора"],
  ["Setting", "Настройка"], ["SettingPicture", "КартинкаНастройки"], ["Settings", "Настройки"],
  ["SettingsComposer", "КомпоновщикНастроек"], ["StartDate", "ДатаНачала"], ["Structure", "Структура"],
  ["Title", "Заголовок"], ["TitlePicture", "КартинкаЗаголовка"], ["Use", "Использование"],
  ["UseArea", "ОбластьИспользования"], ["UserFields", "ПользовательскиеПоля"],
  ["UserSettings", "ПользовательскиеНастройки"], ["Value", "Значение"],
  ["ValuePicture", "КартинкаЗначения"], ["ViewMode", "РежимОтображения"],
] as const

describe("SettingsComposer DataPath model", () => {
  it("contains the complete catalog of 68 standard segment names", () => {
    expect(settingsComposerNamePairs).toEqual(expectedNamePairs)
  })

  it.each(expectedNamePairs)("translates %s ↔ %s only as a registered property", (internal, yaml) => {
    expect(settingsComposerInternalToYaml(internal)).toBe(yaml)
    expect(settingsComposerYamlToInternal(yaml)).toBe(internal)
  })

  it.each(["ИмяМоегоЭлемента", "МойРеквизит"])("does not translate user name %s", (name) => {
    expect(settingsComposerInternalToYaml(name)).toBeUndefined()
    expect(settingsComposerYamlToInternal(name)).toBeUndefined()
  })

  it.each([
    ["DataCompositionSettingsComposer", "Settings", "Настройки", ["DataCompositionSettings"]],
    ["DataCompositionSettings", "ItemFilter", "ЭлементОтбор", ["DataCompositionFilter"]],
    ["DataCompositionSettings", "ItemDataParameters", "ЭлементПараметрыДанных", ["DataCompositionDataParameters"]],
    ["DataCompositionUserSettings", "Structure", "Структура", ["DataCompositionStructure"]],
    ["DataCompositionStructure", "GroupFields", "ПоляГруппировки", ["DataCompositionGroupFields"]],
    ["DataCompositionFilter", "ComparisonType", "ВидСравнения", ["DataCompositionComparisonType"]],
    ["DataCompositionFilter", "FilterAvailableFields", "ДоступныеПоляОтбора", ["DataCompositionAvailableFields"]],
    ["DataCompositionGroupFields", "BeginOfPeriod", "НачалоПериода", ["Field", "dateTime", "DataCompositionPeriodAdditionType"]],
    ["DataCompositionGroupFields", "EndOfPeriod", "КонецПериода", ["Field", "dateTime", "DataCompositionPeriodAdditionType"]],
    ["DataCompositionGroupFields", "GroupFieldsAvailableFields", "ДоступныеПоляПолейГруппировок", ["DataCompositionAvailableFields"]],
    ["DataCompositionSelection", "Placement", "Расположение", ["DataCompositionFieldPlacement"]],
    ["DataCompositionSelection", "SelectionAvailableFields", "ДоступныеПоляВыбора", ["DataCompositionAvailableFields"]],
    ["DataCompositionOrder", "OrderAvailableFields", "ДоступныеПоляПорядка", ["DataCompositionAvailableFields"]],
    ["DataCompositionConditionalAppearance", "Appearance", "Оформление", ["DataCompositionAppearance"]],
    ["DataCompositionConditionalAppearance", "Fields", "Поля", ["DataCompositionAppearanceFields"]],
    ["DataCompositionAppearance", "Parameter", "Параметр", ["Field"]],
    ["DataCompositionAppearanceFields", "AppearanceFieldsAvailableFields", "ДоступныеПоляОформляемыхПолей", ["DataCompositionAvailableFields"]],
    ["DataCompositionAvailableFields", "Title", "Заголовок", ["string"]],
    ["DataCompositionUserFields", "Title", "Заголовок", ["string"]],
    ["DataCompositionDataParameters", "Parameter", "Параметр", ["Field"]],
  ] as const)("projects %s.%s to %s", (type, internal, yaml, terminalTypes) => {
    expect(resolveSettingsComposerProperty(type, internal)).toMatchObject({
      name: yaml,
      targetName: internal,
      typeInfo: { terminalTypes },
    })
    expect(resolveSettingsComposerProperty(type, yaml)).toMatchObject({
      name: yaml,
      targetName: internal,
      typeInfo: { terminalTypes },
    })
  })

  it("represents every graph node as a registered table source", () => {
    expect(settingsComposerTypeInfo("DataCompositionFilter")).toEqual({
      kinds: ["tableSource"],
      nextTypes: [],
      terminalTypes: ["DataCompositionFilter"],
      table: { kind: "Registered", type: "DataCompositionFilter" },
      sourceText: "DataCompositionFilter",
    })
  })

  it("rejects unknown properties of a registered type", () => {
    expect(resolveSettingsComposerProperty("DataCompositionFilter", "Неизвестно")).toBeUndefined()
  })
})
