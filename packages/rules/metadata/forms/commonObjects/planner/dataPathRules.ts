import type { DataPathContribution, TypedDataPathMemberDeclaration } from "@nkdk/runtime/rule-kit"

const plannerFields = [
  ["BeginOfRepresentationPeriod", "НачалоПериодаОтображения", "dateTime"],
  ["EndOfRepresentationPeriod", "КонецПериодаОтображения", "dateTime"],
  ["AlignItemBoundariesByTimeScale", "ВыравниватьГраницыЭлементовПоШкалеВремени", "boolean"],
  ["ShowWrappedTimeScaleHeaders", "ОтображатьПеренесенныеЗаголовкиШкалыВремени", "boolean"],
  ["ShowWrappedHeaders", "ОтображатьПеренесенныеЗаголовки", "boolean"],
  ["PeriodicVariantRepetition", "КратностьПериодическогоВарианта", "decimal"],
  ["TimeScaleWrapBeginIndent", "ОтступСНачалаПереносаШкалыВремени", "decimal"],
  ["TimeScaleWrapEndIndent", "ОтступСКонцаПереносаШкалыВремени", "decimal"],
  ["ShowCurrentDate", "ОтображатьТекущуюДату", "boolean"],
  ["AutoMinColumnWidth", "АвтоМинимальнаяШиринаКолонки", "boolean"],
  ["MinColumnWidth", "МинимальнаяШиринаКолонки", "decimal"],
  ["AutoMinRowHeight", "АвтоМинимальнаяВысотаСтроки", "boolean"],
  ["MinRowHeight", "МинимальнаяВысотаСтроки", "decimal"],
  ["FixDimensionsHeader", "ФиксироватьЗаголовокИзмерений", "boolean"],
  ["FixTimeScaleHeader", "ФиксироватьЗаголовокШкалыВремени", "boolean"],
] as const

const members: readonly TypedDataPathMemberDeclaration[] = plannerFields.map(([internal, yaml, terminalType]) => ({
  internal,
  yaml,
  target: { kind: "terminal", terminalTypes: [terminalType] },
}))

export const plannerDataPathRules: readonly DataPathContribution[] = [
  { kind: "typedGraph", types: [{ type: "Planner", aliases: ["Планировщик"], members }] },
  {
    kind: "dataPathView",
    view: { purpose: "formConditionalFilter", types: { Planner: plannerFields.map(([internal]) => internal) } },
  },
  {
    kind: "formattingNamePairs",
    pairs: plannerFields.map(([internal, yaml]) => ({ internal, yaml })),
  },
  {
    kind: "typeResolver",
    resolver: ({ baseType }) => baseType === "Planner" || baseType === "Планировщик"
      ? { kinds: ["structured"], nextTypes: [], terminalTypes: ["Planner"], structuredType: "Planner", sourceText: "Planner" }
      : undefined,
  },
]
