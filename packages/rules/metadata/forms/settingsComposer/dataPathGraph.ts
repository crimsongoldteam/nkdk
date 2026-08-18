import type { TypedDataPathMemberDeclaration, TypedDataPathTypeDeclaration } from "@nkdk/runtime/rule-kit"

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

export const settingsComposerTableKinds = [
  "DataCompositionSettings", "DataCompositionUserSettings", "DataCompositionStructure",
  "DataCompositionDataParameters", "DataCompositionFilter", "DataCompositionGroupFields",
  "DataCompositionSelection", "DataCompositionOrder", "DataCompositionConditionalAppearance",
  "DataCompositionAppearance", "DataCompositionAppearanceFields", "DataCompositionAvailableFields",
  "DataCompositionUserFields",
] as const

export const settingsComposerValueFieldKinds = [
  "DataCompositionStructure", "DataCompositionFilter", "DataCompositionGroupFields",
  "DataCompositionSelection", "DataCompositionOrder", "DataCompositionConditionalAppearance",
  "DataCompositionAppearance", "DataCompositionAppearanceFields",
] as const

export const settingsComposerRadioFieldKinds = [
  "DataCompositionComparisonType", "DataCompositionGroupType", "DataCompositionFilterApplicationType",
  "DataCompositionFieldPlacement", "DataCompositionPeriodAdditionType", "DataCompositionSortDirection",
] as const

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

type Name = keyof typeof settingsComposerNames
type CollectionName = keyof typeof collectionTypes

const member = (internal: Name, target: TypedDataPathMemberDeclaration["target"]): TypedDataPathMemberDeclaration => ({
  internal,
  yaml: settingsComposerNames[internal],
  target,
})

const collections = (...names: readonly CollectionName[]): TypedDataPathMemberDeclaration[] =>
  names.map((name) => member(name, { kind: "collection", itemType: collectionTypes[name] }))

const terminals = (values: Partial<Record<Name, readonly string[]>>): TypedDataPathMemberDeclaration[] =>
  Object.entries(values).map(([name, terminalTypes]) =>
    member(name as Name, { kind: "terminal", terminalTypes }))

export const settingsComposerGraph: readonly TypedDataPathTypeDeclaration[] = [
  { type: SETTINGS_COMPOSER_TYPE, aliases: ["SettingsComposer", "КомпоновщикНастроекКомпоновкиДанных"], members: collections("Settings", "UserSettings", "FixedSettings") },
  { type: "DataCompositionSettings", members: [
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
  ] },
  { type: "DataCompositionUserSettings", members: [
    ...collections("Filter", "Order", "Selection", "ConditionalAppearance", "Structure"),
    ...terminals({
      Use: ["boolean"], SettingPicture: ["Picture"], Setting: ["<any>"],
      ComparisonType: ["DataCompositionComparisonType"], ValuePicture: ["Picture"], Value: ["<any>"],
      EditInReportForm: ["boolean"],
    }),
  ] },
  { type: "DataCompositionStructure", members: [...collections("GroupFields"), ...terminals({ Use: ["boolean"] })] },
  { type: "DataCompositionDataParameters", members: terminals({
    Use: ["boolean"], Parameter: ["Field"], ValuePicture: ["Picture"], Value: ["<any>"],
    Date: ["dateTime"], StartDate: ["dateTime"], EndDate: ["dateTime"],
  }) },
  { type: "DataCompositionFilter", members: [
    ...collections("FilterAvailableFields"),
    ...terminals({
      Use: ["boolean"], LeftValuePicture: ["Picture"], LeftValue: ["<any>"],
      ComparisonType: ["DataCompositionComparisonType"], RightValuePicture: ["Picture"], RightValue: ["<any>"],
      Date: ["dateTime"], GroupType: ["DataCompositionGroupType"],
      Application: ["DataCompositionFilterApplicationType"], ViewMode: ["DataCompositionSettingsItemViewMode"],
      Presentation: ["string"],
    }),
  ] },
  { type: "DataCompositionGroupFields", members: [
    ...collections("GroupFieldsAvailableFields"),
    ...terminals({
      Use: ["boolean"], FieldPicture: ["Picture"], Field: ["Field"], GroupType: ["DataCompositionGroupType"],
      AdditionType: ["DataCompositionPeriodAdditionType"], BeginOfPeriodPicture: ["Picture"],
      BeginOfPeriod: ["Field", "dateTime", "DataCompositionPeriodAdditionType"], EndOfPeriodPicture: ["Picture"],
      EndOfPeriod: ["Field", "dateTime", "DataCompositionPeriodAdditionType"],
    }),
  ] },
  { type: "DataCompositionSelection", members: [
    ...collections("SelectionAvailableFields"),
    ...terminals({ Use: ["boolean"], FieldPicture: ["Picture"], Field: ["Field"], TitlePicture: ["Picture"], Title: ["string"], Placement: ["DataCompositionFieldPlacement"] }),
  ] },
  { type: "DataCompositionOrder", members: [
    ...collections("OrderAvailableFields"),
    ...terminals({ Use: ["boolean"], FieldPicture: ["Picture"], Field: ["Field"], OrderType: ["DataCompositionSortDirection"] }),
  ] },
  { type: "DataCompositionConditionalAppearance", members: [
    ...collections("Appearance", "Filter", "Fields"),
    ...terminals({ Use: ["boolean"], Presentation: ["string"], UseArea: ["<any>"] }),
  ] },
  { type: "DataCompositionAppearance", members: terminals({
    Use: ["boolean"], Parameter: ["Field"], ValuePicture: ["Picture"], Value: ["<any>"],
    Date: ["dateTime"], StartDate: ["dateTime"], EndDate: ["dateTime"],
  }) },
  { type: "DataCompositionAppearanceFields", members: [
    ...collections("AppearanceFieldsAvailableFields"),
    ...terminals({ Use: ["boolean"], FieldPicture: ["Picture"], Field: ["Field"] }),
  ] },
  { type: "DataCompositionAvailableFields", members: terminals({ FieldPicture: ["Picture"], Title: ["string"] }) },
  { type: "DataCompositionUserFields", members: terminals({ Title: ["string"] }) },
]

export function settingsComposerTypeInfo(type: string) {
  return { kinds: ["structured"] as const, nextTypes: [], terminalTypes: [type], structuredType: type, sourceText: type }
}

export function settingsComposerInternalToYaml(internal: string): string | undefined {
  return settingsComposerNames[internal as Name]
}

const internalByYaml = new Map(settingsComposerNamePairs.map(([internal, yaml]) => [yaml, internal]))

export function settingsComposerYamlToInternal(yaml: string): string | undefined {
  return internalByYaml.get(yaml as (typeof settingsComposerNames)[Name])
}
