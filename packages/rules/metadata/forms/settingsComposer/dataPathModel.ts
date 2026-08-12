import type { DataPathTypeInfo, FormDataPathColumnSource } from "../../validation/dataPath/types"

export const SETTINGS_COMPOSER_TYPE = "DataCompositionSettingsComposer"

const settingsComposerNames = {
  AdditionType: "ТипДополнения", Appearance: "Оформление",
  AppearanceFieldsAvailableFields: "ДоступныеПоляОформляемыхПолей", Application: "Применение",
  BeginOfPeriod: "НачалоПериода", BeginOfPeriodPicture: "КартинкаНачалаПериода",
  ComparisonType: "ВидСравнения", ConditionalAppearance: "УсловноеОформление",
  CurrentData: "ТекущиеДанные", DataParameters: "ПараметрыДанных", Date: "Дата",
  EditInReportForm: "РедактированиеВФормеОтчета", EndDate: "ДатаОкончания",
  EndOfPeriod: "КонецПериода", EndOfPeriodPicture: "КартинкаКонцаПериода", Field: "Поле",
  FieldPicture: "КартинкаПоля", Fields: "Поля", Filter: "Отбор",
  FilterAvailableFields: "ДоступныеПоляОтбора", FixedSettings: "ФиксированныеНастройки",
  GroupFields: "ПоляГруппировки", GroupFieldsAvailableFields: "ДоступныеПоляПолейГруппировок",
  GroupType: "ТипГруппы", HasConditionalAppearance: "НаличиеУсловногоОформления",
  HasFilter: "НаличиеОтбора", HasOrder: "НаличиеПорядка", HasOutputParameters: "НаличиеПараметровВывода",
  HasSelection: "НаличиеВыбора", ItemConditionalAppearance: "ЭлементУсловноеОформление",
  ItemDataParameters: "ЭлементПараметрыДанных", ItemFilter: "ЭлементОтбор",
  ItemGroupFields: "ЭлементПоляГруппировки", ItemOrder: "ЭлементПорядок",
  ItemOutputParameters: "ЭлементПараметрыВывода", ItemSelection: "ЭлементВыбор",
  ItemUserFields: "ЭлементПользовательскиеПоля", Items: "Элементы", LeftValue: "ЛевоеЗначение",
  LeftValuePicture: "КартинкаЛевогоЗначения", Order: "Порядок",
  OrderAvailableFields: "ДоступныеПоляПорядка", OrderType: "ТипУпорядочивания",
  OutputParameters: "ПараметрыВывода", Parameter: "Параметр", Placement: "Расположение",
  Presentation: "Представление", ReportStructure: "СтруктураОтчета",
  ReportStructurePicture: "КартинкаСтруктурыОтчета", RightValue: "ПравоеЗначение",
  RightValuePicture: "КартинкаПравогоЗначения", Selection: "Выбор",
  SelectionAvailableFields: "ДоступныеПоляВыбора", Setting: "Настройка",
  SettingPicture: "КартинкаНастройки", Settings: "Настройки", SettingsComposer: "КомпоновщикНастроек",
  StartDate: "ДатаНачала", Structure: "Структура", Title: "Заголовок", TitlePicture: "КартинкаЗаголовка",
  Use: "Использование", UseArea: "ОбластьИспользования", UserFields: "ПользовательскиеПоля",
  UserSettings: "ПользовательскиеНастройки", Value: "Значение", ValuePicture: "КартинкаЗначения",
  ViewMode: "РежимОтображения",
} as const

export const settingsComposerNamePairs = Object.entries(settingsComposerNames) as readonly (
  readonly [internal: keyof typeof settingsComposerNames, yaml: (typeof settingsComposerNames)[keyof typeof settingsComposerNames]]
)[]

const internalByYaml = new Map(settingsComposerNamePairs.map(([internal, yaml]) => [yaml, internal]))

export interface SettingsComposerProperty {
  readonly internal: string
  readonly yaml: string
  readonly typeInfo: DataPathTypeInfo
}

export function settingsComposerInternalToYaml(internal: string): string | undefined {
  return settingsComposerNames[internal as keyof typeof settingsComposerNames]
}

export function settingsComposerYamlToInternal(yaml: string): string | undefined {
  return internalByYaml.get(yaml as (typeof settingsComposerNames)[keyof typeof settingsComposerNames])
}

export function settingsComposerTypeInfo(type: string): DataPathTypeInfo {
  return {
    kinds: ["tableSource"], nextTypes: [], terminalTypes: [type],
    table: { kind: "Registered", type }, sourceText: type,
  }
}

export function settingsComposerTableSource(type: string) {
  return { table: { kind: "Registered" as const, type }, columns: new Map(), hasColumns: true }
}

export function resolveSettingsComposerProperty(type: string, segment: string): FormDataPathColumnSource | undefined {
  const property = settingsComposerGraph.get(type)?.find(
    (candidate) => candidate.internal === segment || candidate.yaml === segment,
  )
  return property === undefined
    ? undefined
    : { name: property.yaml, targetName: property.internal, typeInfo: property.typeInfo }
}

const collectionTypes = {
  Settings: "DataCompositionSettings", FixedSettings: "DataCompositionSettings",
  UserSettings: "DataCompositionUserSettings", Structure: "DataCompositionStructure",
  DataParameters: "DataCompositionDataParameters", ItemDataParameters: "DataCompositionDataParameters",
  OutputParameters: "DataCompositionDataParameters", ItemOutputParameters: "DataCompositionDataParameters",
  Filter: "DataCompositionFilter", ItemFilter: "DataCompositionFilter",
  GroupFields: "DataCompositionGroupFields", ItemGroupFields: "DataCompositionGroupFields",
  Selection: "DataCompositionSelection", ItemSelection: "DataCompositionSelection",
  Order: "DataCompositionOrder", ItemOrder: "DataCompositionOrder",
  ConditionalAppearance: "DataCompositionConditionalAppearance",
  ItemConditionalAppearance: "DataCompositionConditionalAppearance",
  Appearance: "DataCompositionAppearance", Fields: "DataCompositionAppearanceFields",
  FilterAvailableFields: "DataCompositionAvailableFields",
  GroupFieldsAvailableFields: "DataCompositionAvailableFields",
  SelectionAvailableFields: "DataCompositionAvailableFields",
  OrderAvailableFields: "DataCompositionAvailableFields",
  AppearanceFieldsAvailableFields: "DataCompositionAvailableFields",
  UserFields: "DataCompositionUserFields", ItemUserFields: "DataCompositionUserFields",
} as const

export const settingsComposerTableKinds = [
  "DataCompositionSettings",
  "DataCompositionUserSettings",
  "DataCompositionStructure",
  "DataCompositionDataParameters",
  "DataCompositionFilter",
  "DataCompositionGroupFields",
  "DataCompositionSelection",
  "DataCompositionOrder",
  "DataCompositionConditionalAppearance",
  "DataCompositionAppearance",
  "DataCompositionAppearanceFields",
  "DataCompositionAvailableFields",
  "DataCompositionUserFields",
] as const

export const settingsComposerValueFieldKinds = [
  "DataCompositionStructure",
  "DataCompositionFilter",
  "DataCompositionGroupFields",
  "DataCompositionSelection",
  "DataCompositionOrder",
  "DataCompositionConditionalAppearance",
  "DataCompositionAppearance",
  "DataCompositionAppearanceFields",
] as const

export const settingsComposerRadioFieldKinds = [
  "DataCompositionComparisonType",
  "DataCompositionGroupType",
  "DataCompositionFilterApplicationType",
  "DataCompositionFieldPlacement",
  "DataCompositionPeriodAdditionType",
  "DataCompositionSortDirection",
] as const

const settingsComposerGraph = new Map<string, readonly SettingsComposerProperty[]>([
  [SETTINGS_COMPOSER_TYPE, collections("Settings", "UserSettings", "FixedSettings")],
  ["DataCompositionSettings", [
    ...collections(
      "Structure", "DataParameters", "Filter", "GroupFields", "Selection", "Order", "ConditionalAppearance",
      "OutputParameters", "UserFields", "ItemDataParameters", "ItemFilter", "ItemGroupFields", "ItemSelection",
      "ItemOrder", "ItemConditionalAppearance", "ItemOutputParameters", "ItemUserFields",
    ),
    ...terminals({
      Use: ["boolean"], ReportStructurePicture: ["Picture"], ReportStructure: ["DataCompositionStructure"],
      HasSelection: ["boolean"], HasFilter: ["boolean"], HasOrder: ["boolean"],
      HasConditionalAppearance: ["boolean"], HasOutputParameters: ["boolean"],
    }),
  ]],
  ["DataCompositionUserSettings", [
    ...collections("Filter", "Order", "Selection", "ConditionalAppearance", "Structure"),
    ...terminals({
      Use: ["boolean"], SettingPicture: ["Picture"], Setting: ["<any>"],
      ComparisonType: ["DataCompositionComparisonType"], ValuePicture: ["Picture"], Value: ["<any>"],
      EditInReportForm: ["boolean"],
    }),
  ]],
  ["DataCompositionStructure", [...collections("GroupFields"), ...terminals({ Use: ["boolean"] })]],
  ["DataCompositionDataParameters", terminals({
    Use: ["boolean"], Parameter: ["Field"], ValuePicture: ["Picture"], Value: ["<any>"],
    Date: ["dateTime"], StartDate: ["dateTime"], EndDate: ["dateTime"],
  })],
  ["DataCompositionFilter", [
    ...collections("FilterAvailableFields"),
    ...terminals({
      Use: ["boolean"], LeftValuePicture: ["Picture"], LeftValue: ["<any>"],
      ComparisonType: ["DataCompositionComparisonType"], RightValuePicture: ["Picture"], RightValue: ["<any>"],
      Date: ["dateTime"], GroupType: ["DataCompositionGroupType"],
      Application: ["DataCompositionFilterApplicationType"], ViewMode: ["DataCompositionSettingsItemViewMode"],
      Presentation: ["string"],
    }),
  ]],
  ["DataCompositionGroupFields", [
    ...collections("GroupFieldsAvailableFields"),
    ...terminals({
      Use: ["boolean"], FieldPicture: ["Picture"], Field: ["Field"], GroupType: ["DataCompositionGroupType"],
      AdditionType: ["DataCompositionPeriodAdditionType"], BeginOfPeriodPicture: ["Picture"],
      BeginOfPeriod: ["Field", "dateTime", "DataCompositionPeriodAdditionType"], EndOfPeriodPicture: ["Picture"],
      EndOfPeriod: ["Field", "dateTime", "DataCompositionPeriodAdditionType"],
    }),
  ]],
  ["DataCompositionSelection", [
    ...collections("SelectionAvailableFields"),
    ...terminals({ Use: ["boolean"], FieldPicture: ["Picture"], Field: ["Field"], TitlePicture: ["Picture"],
      Title: ["string"], Placement: ["DataCompositionFieldPlacement"] }),
  ]],
  ["DataCompositionOrder", [
    ...collections("OrderAvailableFields"),
    ...terminals({ Use: ["boolean"], FieldPicture: ["Picture"], Field: ["Field"],
      OrderType: ["DataCompositionSortDirection"] }),
  ]],
  ["DataCompositionConditionalAppearance", [
    ...collections("Appearance", "Filter", "Fields"),
    ...terminals({ Use: ["boolean"], Presentation: ["string"], UseArea: ["<any>"] }),
  ]],
  ["DataCompositionAppearance", terminals({
    Use: ["boolean"], Parameter: ["Field"], ValuePicture: ["Picture"], Value: ["<any>"],
    Date: ["dateTime"], StartDate: ["dateTime"], EndDate: ["dateTime"],
  })],
  ["DataCompositionAppearanceFields", [
    ...collections("AppearanceFieldsAvailableFields"),
    ...terminals({ Use: ["boolean"], FieldPicture: ["Picture"], Field: ["Field"] }),
  ]],
  ["DataCompositionAvailableFields", terminals({ FieldPicture: ["Picture"], Title: ["string"] })],
  ["DataCompositionUserFields", terminals({ Title: ["string"] })],
])

type CollectionName = keyof typeof collectionTypes
type TerminalName = keyof typeof settingsComposerNames

function collections(...names: readonly CollectionName[]): SettingsComposerProperty[] {
  return names.map((internal) => property(internal, settingsComposerTypeInfo(collectionTypes[internal])))
}

function terminals(values: Partial<Record<TerminalName, readonly string[]>>): SettingsComposerProperty[] {
  return Object.entries(values).map(([internal, terminalTypes]) => property(internal as TerminalName, {
    kinds: terminalKinds(terminalTypes), nextTypes: [], terminalTypes,
    ...(terminalTypes.length > 1 ? { isComposite: true } : {}), sourceText: terminalTypes.join(" | "),
  }))
}

function property(internal: TerminalName, typeInfo: DataPathTypeInfo): SettingsComposerProperty {
  return { internal, yaml: settingsComposerNames[internal], typeInfo }
}

function terminalKinds(types: readonly string[]): DataPathTypeInfo["kinds"] {
  if (types.includes("boolean")) return ["boolean"]
  if (types.includes("dateTime")) return ["dateTime"]
  if (types.includes("Picture")) return ["Picture"]
  if (types.includes("<any>")) return ["any"]
  return ["scalar"]
}
