import type { OwnerMetadata } from "~/metadata/validation/dataPath/ownerCache"
import { resolveObjectFieldSegment, standardAttributeAliasToYAML } from "~/metadata/validation/dataPath/objectFields"
import type { DataPathTableInfo, DataPathTypeInfo, FormDataPathColumnSource, OwnerTypeRef } from "~/metadata/validation/dataPath/types"
import {
  getOwnerKindByMetadataLinkPrefix,
  registerDataPathOwnerKind,
  registerObjectFieldCollectionProvider,
  registerRegisterRecordsItemResolver,
  registerStandardAttributeTypeResolver,
  registerTableColumnResolver,
  registerTraversalTransitionResolver,
  registerVirtualOwnerFieldResolver,
} from "~/metadata/validation/dataPath/registry"
import { MetadataAccumulationRegisterRules } from "../metadataAccumulationRegister/rules"
import { MetadataAccountingRegisterRules } from "../metadataAccountingRegister/rules"
import { MetadataBusinessProcessRules } from "../metadataBusinessProcess/rules"
import { MetadataCatalogRules } from "../metadataCatalog/rules"
import { MetadataChartOfAccountsRules } from "../metadataChartOfAccounts/rules"
import { MetadataChartOfCalculationTypesRules } from "../metadataChartOfCalculationTypes/rules"
import { MetadataChartOfCharacteristicTypesRules } from "../metadataChartOfCharacteristicTypes/rules"
import { MetadataCommonAttributeRules } from "../metadataCommonAttribute/rules"
import { MetadataConstantRules } from "../metadataConstant/rules"
import { MetadataDataProcessorRules } from "../metadataDataProcessor/rules"
import { MetadataDefinedTypeRules } from "../metadataDefinedType/rules"
import { MetadataDocumentRules } from "../metadataDocument/rules"
import { MetadataDocumentJournalRules } from "../metadataDocumentJournal/rules"
import { MetadataDocumentNumeratorRules } from "../metadataDocumentNumerator/rules"
import { MetadataEnumerationRules } from "../metadataEnumeration/rules"
import { MetadataExchangePlanRules } from "../metadataExchangePlan/rules"
import { MetadataExternalDataSourceRules } from "../metadataExternalDataSource/rules"
import { MetadataFilterCriterionRules } from "../metadataFilterCriterion/rules"
import { MetadataInformationRegisterRules } from "../metadataInformationRegister/rules"
import { MetadataReportRules } from "../metadataReport/rules"
import { MetadataSettingsStorageRules } from "../metadataSettingsStorage/rules"
import { MetadataCalculationRegisterRules } from "../metadataCalculationRegister/rules"
import { MetadataTaskRules } from "../metadataTask/rules"

registerDataPathOwnerKind({
  kind: "Справочник",
  projectDir: "Справочник",
  rule: MetadataCatalogRules,
  typeDescriptionBases: ["CatalogRef"],
  metadataLinkPrefixes: ["Catalog"],
  aliases: ["СправочникОбъект"],
})
registerDataPathOwnerKind({
  kind: "СправочникОбъект",
  projectDir: "Справочник",
  rule: MetadataCatalogRules,
  typeDescriptionBases: ["CatalogObject"],
  metadataLinkPrefixes: ["Catalog"],
})
registerDataPathOwnerKind({
  kind: "Документ",
  projectDir: "Документ",
  rule: MetadataDocumentRules,
  typeDescriptionBases: ["DocumentRef"],
  metadataLinkPrefixes: ["Document"],
  aliases: ["ДокументОбъект"],
})
registerDataPathOwnerKind({
  kind: "ДокументОбъект",
  projectDir: "Документ",
  rule: MetadataDocumentRules,
  typeDescriptionBases: ["DocumentObject"],
  metadataLinkPrefixes: ["Document"],
})
registerDataPathOwnerKind({
  kind: "Перечисление",
  projectDir: "Перечисление",
  rule: MetadataEnumerationRules,
  typeDescriptionBases: ["EnumRef"],
  metadataLinkPrefixes: ["Enum"],
})
registerDataPathOwnerKind({
  kind: "РегистрСведений",
  projectDir: "РегистрСведений",
  rule: MetadataInformationRegisterRules,
  typeDescriptionBases: ["InformationRegisterRecordManager"],
  registerRecordSetBases: ["InformationRegisterRecordSet"],
  metadataLinkPrefixes: ["InformationRegister", "РегистрСведений"],
})
registerDataPathOwnerKind({
  kind: "РегистрНакопления",
  projectDir: "РегистрНакопления",
  rule: MetadataAccumulationRegisterRules,
  typeDescriptionBases: ["AccumulationRegisterRecordManager"],
  registerRecordSetBases: ["AccumulationRegisterRecordSet"],
  metadataLinkPrefixes: ["AccumulationRegister", "РегистрНакопления"],
})
registerDataPathOwnerKind({
  kind: "РегистрБухгалтерии",
  projectDir: "РегистрБухгалтерии",
  rule: MetadataAccountingRegisterRules,
  typeDescriptionBases: ["AccountingRegisterRecordManager"],
  registerRecordSetBases: ["AccountingRegisterRecordSet"],
  metadataLinkPrefixes: ["AccountingRegister", "РегистрБухгалтерии"],
})
registerDataPathOwnerKind({
  kind: "РегистрРасчета",
  projectDir: "РегистрРасчета",
  rule: MetadataCalculationRegisterRules,
  typeDescriptionBases: ["CalculationRegisterRecordManager"],
  registerRecordSetBases: ["CalculationRegisterRecordSet"],
  metadataLinkPrefixes: ["CalculationRegister", "РегистрРасчета"],
})
registerDataPathOwnerKind({
  kind: "ПланОбмена",
  projectDir: "ПланОбмена",
  rule: MetadataExchangePlanRules,
  typeDescriptionBases: ["ExchangePlanRef"],
  metadataLinkPrefixes: ["ExchangePlan"],
  aliases: ["ПланОбменаОбъект"],
})
registerDataPathOwnerKind({
  kind: "ПланОбменаОбъект",
  projectDir: "ПланОбмена",
  rule: MetadataExchangePlanRules,
  typeDescriptionBases: ["ExchangePlanObject"],
  metadataLinkPrefixes: ["ExchangePlan"],
})
registerDataPathOwnerKind({
  kind: "ПланВидовРасчета",
  projectDir: "ПланВидовРасчета",
  rule: MetadataChartOfCalculationTypesRules,
  typeDescriptionBases: ["ChartOfCalculationTypesRef"],
  metadataLinkPrefixes: ["ChartOfCalculationTypes"],
  aliases: ["ПланВидовРасчетаОбъект"],
})
registerDataPathOwnerKind({
  kind: "ПланВидовРасчетаОбъект",
  projectDir: "ПланВидовРасчета",
  rule: MetadataChartOfCalculationTypesRules,
  typeDescriptionBases: ["ChartOfCalculationTypesObject"],
  metadataLinkPrefixes: ["ChartOfCalculationTypes"],
})
registerDataPathOwnerKind({
  kind: "ПланВидовХарактеристик",
  projectDir: "ПланВидовХарактеристик",
  rule: MetadataChartOfCharacteristicTypesRules,
  typeDescriptionBases: ["ChartOfCharacteristicTypesRef"],
  metadataLinkPrefixes: ["ChartOfCharacteristicTypes"],
  aliases: ["ПланВидовХарактеристикОбъект"],
})
registerDataPathOwnerKind({
  kind: "ПланВидовХарактеристикОбъект",
  projectDir: "ПланВидовХарактеристик",
  rule: MetadataChartOfCharacteristicTypesRules,
  typeDescriptionBases: ["ChartOfCharacteristicTypesObject"],
  metadataLinkPrefixes: ["ChartOfCharacteristicTypes"],
})
registerDataPathOwnerKind({
  kind: "ПланСчетов",
  projectDir: "ПланСчетов",
  rule: MetadataChartOfAccountsRules,
  typeDescriptionBases: ["ChartOfAccountsRef"],
  metadataLinkPrefixes: ["ChartOfAccounts"],
  aliases: ["ПланСчетовОбъект"],
})
registerDataPathOwnerKind({
  kind: "ПланСчетовОбъект",
  projectDir: "ПланСчетов",
  rule: MetadataChartOfAccountsRules,
  typeDescriptionBases: ["ChartOfAccountObject", "ChartOfAccountsObject"],
  metadataLinkPrefixes: ["ChartOfAccounts"],
})
registerDataPathOwnerKind({
  kind: "Обработка",
  projectDir: "Обработка",
  rule: MetadataDataProcessorRules,
  metadataLinkPrefixes: ["DataProcessor"],
  aliases: ["ОбработкаОбъект"],
})
registerDataPathOwnerKind({
  kind: "ОбработкаОбъект",
  projectDir: "Обработка",
  rule: MetadataDataProcessorRules,
  typeDescriptionBases: ["DataProcessorObject"],
  metadataLinkPrefixes: ["DataProcessor"],
})
registerDataPathOwnerKind({
  kind: "Отчет",
  projectDir: "Отчет",
  rule: MetadataReportRules,
  metadataLinkPrefixes: ["Report"],
  aliases: ["ОтчетОбъект"],
})
registerDataPathOwnerKind({
  kind: "ОтчетОбъект",
  projectDir: "Отчет",
  rule: MetadataReportRules,
  typeDescriptionBases: ["ReportObject"],
  metadataLinkPrefixes: ["Report"],
})
registerDataPathOwnerKind({
  kind: "БизнесПроцесс",
  projectDir: "БизнесПроцесс",
  rule: MetadataBusinessProcessRules,
  typeDescriptionBases: ["BusinessProcessRef"],
  metadataLinkPrefixes: ["BusinessProcess"],
  aliases: ["БизнесПроцессОбъект"],
})
registerDataPathOwnerKind({
  kind: "БизнесПроцессОбъект",
  projectDir: "БизнесПроцесс",
  rule: MetadataBusinessProcessRules,
  typeDescriptionBases: ["BusinessProcessObject"],
  metadataLinkPrefixes: ["BusinessProcess"],
})
registerDataPathOwnerKind({
  kind: "Задача",
  projectDir: "Задача",
  rule: MetadataTaskRules,
  typeDescriptionBases: ["TaskRef"],
  metadataLinkPrefixes: ["Task"],
  aliases: ["ЗадачаОбъект"],
})
registerDataPathOwnerKind({
  kind: "ЗадачаОбъект",
  projectDir: "Задача",
  rule: MetadataTaskRules,
  typeDescriptionBases: ["TaskObject"],
  metadataLinkPrefixes: ["Task"],
})
registerDataPathOwnerKind({
  kind: "ВнешнийИсточникДанных",
  projectDir: "ВнешнийИсточникДанных",
  rule: MetadataExternalDataSourceRules,
})
registerDataPathOwnerKind({
  kind: "ЖурналДокументов",
  projectDir: "ЖурналДокументов",
  rule: MetadataDocumentJournalRules,
})
registerDataPathOwnerKind({ kind: "ОбщийРеквизит", projectDir: "ОбщийРеквизит", rule: MetadataCommonAttributeRules })
registerDataPathOwnerKind({ kind: "КритерийОтбора", projectDir: "КритерийОтбора", rule: MetadataFilterCriterionRules })
registerDataPathOwnerKind({ kind: "ХранилищеНастроек", projectDir: "ХранилищеНастроек", rule: MetadataSettingsStorageRules })
registerDataPathOwnerKind({ kind: "НумераторДокументов", projectDir: "Нумератор", rule: MetadataDocumentNumeratorRules })
registerDataPathOwnerKind({ kind: "Константа", projectDir: "Константа", rule: MetadataConstantRules })
registerDataPathOwnerKind({ kind: "ОпределяемыйТип", projectDir: "ОпределяемыйТип", rule: MetadataDefinedTypeRules })

registerObjectFieldCollectionProvider(({ owner }) => {
  const descriptors = []
  for (const collection of ["attributes", "tabularSections", "dimensions", "resources", "addressingAttributes"] as const) {
    if (owner.rule.properties[collection] === undefined) continue
    descriptors.push({
      collection,
      kind:
        collection === "tabularSections"
          ? "tabularSection"
          : collection === "dimensions"
            ? "dimension"
            : collection === "resources"
              ? "resource"
              : collection === "addressingAttributes"
                ? "addressingAttribute"
                : "attribute",
    } as const)
  }
  return descriptors
})

registerStandardAttributeTypeResolver(({ owner, internalName, yamlName, explicitTypeInfo }) => {
  if (explicitTypeInfo !== undefined) return explicitTypeInfo
  if (internalName === "Ref" || yamlName === "Ссылка") return { kinds: ["object"], nextTypes: [sameOwnerRef(owner.ref)] }
  if (internalName === "Parent" || yamlName === "Родитель") {
    return {
      kinds: ["object"],
      nextTypes: [sameOwnerRef(owner.ref)],
      sourceText: `${owner.ref.kind}.Parent`,
    }
  }
  if (internalName === "ValueType" || yamlName === "ТипЗначения") {
    return { kinds: ["typeDescription"], nextTypes: [], sourceText: `${owner.ref.kind}.ValueType` }
  }
  if (internalName === "SentNo" || internalName === "ReceivedNo") {
    return { kinds: ["scalar"], nextTypes: [], sourceText: `${owner.ref.kind}.SentReceivedNo` }
  }
  if (["DeletionMark", "Posted", "Executed", "Completed", "Started"].includes(internalName)) {
    return { kinds: ["boolean"], nextTypes: [], sourceText: `${owner.ref.kind}.${internalName}` }
  }
  if (internalName === "BusinessProcess") {
    return { kinds: ["object"], nextTypes: [{ kind: "БизнесПроцесс" }], sourceText: `${owner.ref.kind}.BusinessProcess` }
  }
  if (internalName === "RoutePoint") {
    return { kinds: ["object"], nextTypes: [{ kind: "БизнесПроцесс" }], sourceText: `${owner.ref.kind}.RoutePoint` }
  }
  if (internalName === "Predefined" || yamlName === "Предопределенный") {
    return { kinds: ["boolean"], nextTypes: [], sourceText: `${owner.ref.kind}.Predefined` }
  }
  return undefined
})

registerStandardAttributeTypeResolver(({ owner, internalName, yamlName }) => {
  if (internalName !== "Owner" && yamlName !== "Владелец") return undefined
  const ownerLinks = metadataRecord(owner.model).owners
  if (!Array.isArray(ownerLinks)) return undefined

  const nextTypes: OwnerTypeRef[] = []
  const sourceTypes: string[] = []
  for (const link of ownerLinks) {
    if (typeof link !== "string") continue

    const nextType = ownerTypeRefFromMetadataLink(link)
    if (nextType === undefined) continue

    addUniqueOwnerRef(nextTypes, nextType)
    sourceTypes.push(link)
  }

  if (nextTypes.length === 0) return undefined

  return {
    kinds: ["object"],
    nextTypes,
    ...(nextTypes.length > 1 ? { isComposite: true } : {}),
    sourceText: sourceTypes.join(" | "),
  } satisfies DataPathTypeInfo
})

registerVirtualOwnerFieldResolver(({ owner, segment }) => {
  if (owner.ref.kind !== "ПланОбмена" && owner.ref.kind !== "ПланОбменаОбъект") return undefined
  if (segment === "ThisNode") {
    return {
      name: segment,
      typeInfo: { kinds: ["boolean"], nextTypes: [], sourceText: "ExchangePlan.ThisNode" },
    }
  }
  if (segment === "ОбластьДанныхОсновныеДанные") {
    return {
      name: segment,
      typeInfo: { kinds: ["scalar"], nextTypes: [], sourceText: "ExchangePlan.DataArea" },
    }
  }
  return undefined
})

registerVirtualOwnerFieldResolver(({ owner, segment }) => {
  if (owner.ref.kind !== "РегистрСведений") return undefined
  if (segment !== "ОбластьДанныхВспомогательныеДанные") return undefined
  return {
    name: segment,
    typeInfo: { kinds: ["scalar"], nextTypes: [], sourceText: "InformationRegister.DataArea" },
  }
})

registerVirtualOwnerFieldResolver(({ owner, segment }) => {
  if (owner.ref.kind !== "ПланСчетов" && owner.ref.kind !== "ПланСчетовОбъект") return undefined
  if (segment === "ExtDimensionTypes") return chartOfAccountsExtDimensionTypesField(owner, segment)

  const field = chartOfAccountsTerminalVirtualField(owner, segment)
  return field === undefined ? undefined : { name: segment, typeInfo: field.typeInfo }
})

registerVirtualOwnerFieldResolver(({ owner, segment }) => {
  if (owner.ref.kind !== "ПланВидовРасчета" && owner.ref.kind !== "ПланВидовРасчетаОбъект") return undefined
  if (segment === "ActionPeriodIsBasic") {
    return {
      name: segment,
      typeInfo: { kinds: ["boolean"], nextTypes: [], sourceText: "ChartOfCalculationTypes.ActionPeriodIsBasic" },
    }
  }
  if (!isCalculationTypesVirtualTableName(segment)) return undefined

  const table = { kind: "ValueTable" as const }
  return {
    name: segment,
    typeInfo: {
      kinds: ["tableSource"],
      nextTypes: [],
      table,
      sourceText: `ChartOfCalculationTypes.${segment}`,
    },
    tableSource: {
      table,
      columns: chartOfCalculationTypesVirtualTableColumns(owner),
      hasColumns: true,
    },
  }
})

registerTableColumnResolver(({ table, segment }) => {
  if (segment === "RowsCount") return scalarColumn(segment, "RowsCount")
  if (segment.startsWith("Total")) return scalarColumn(segment, "Total")
  if (table.kind === "ValueList") return valueListColumn(segment)
  if (table.kind === "GanttChart") return ganttChartColumn(segment)
  return undefined
})

registerTableColumnResolver(({ table, segment, owner, field }) => {
  if (table.kind !== "RegisterRecordSet") return undefined

  const virtualStandardColumn = registerRecordSetStandardColumn(segment, field?.name)
  const accountingVirtualColumn = owner === undefined
    ? undefined
    : accountingRegisterRecordSetColumn({
        owner,
        segment,
      })

  if (field === undefined) return virtualStandardColumn ?? accountingVirtualColumn

  if (isUnknownTypeInfo(field.typeInfo) && accountingVirtualColumn !== undefined) return accountingVirtualColumn
  if (isUnknownTypeInfo(field.typeInfo) && virtualStandardColumn !== undefined) return virtualStandardColumn

  return {
    name: field.name,
    typeInfo: field.typeInfo,
  }
})

registerTraversalTransitionResolver(({ owner, segment }) => {
  if (owner.ref.kind !== "Документ" && owner.ref.kind !== "ДокументОбъект") return undefined
  if (segment !== "RegisterRecords" && segment !== "НаборЗаписей") return undefined

  return {
    typeInfo: { kinds: ["registerRecords"], nextTypes: [], sourceText: segment },
    sourceName: segment,
    sourceKind: "registerRecords",
    registerRecordsOwner: owner,
  }
})

registerRegisterRecordsItemResolver(({ owner, segment }) => {
  const registerRef = documentRegisterRecordRefs(owner).find((ref) => ref.name === segment)
  if (registerRef === undefined) return undefined

  const table = { kind: "RegisterRecordSet" as const, owner: registerRef }
  return {
    owner: registerRef,
    typeInfo: {
      kinds: ["tableSource"],
      nextTypes: [],
      table,
      sourceText: `RegisterRecords.${segment}`,
    },
    tableSource: {
      table,
      columns: new Map(),
      hasColumns: true,
    },
  }
})

registerTraversalTransitionResolver(({ owner, segment }) => {
  if (owner.ref.kind !== "ОтчетОбъект") return undefined
  if (segment !== "SettingsComposer" && segment !== "КомпоновщикНастроек") return undefined
  return { kind: "warning" }
})

function ownerTypeRefFromMetadataLink(link: string): OwnerTypeRef | undefined {
  const [prefix, name] = splitMetadataLink(link)
  const kind = getOwnerKindByMetadataLinkPrefix(prefix)
  if (kind === undefined) return undefined

  return {
    kind,
    ...(name !== undefined && name !== "" ? { name } : {}),
  }
}

function splitMetadataLink(link: string): [prefix: string, name?: string] {
  const dotIndex = link.indexOf(".")
  if (dotIndex === -1) return [link]
  return [link.substring(0, dotIndex), link.substring(dotIndex + 1)]
}

function addUniqueOwnerRef(items: OwnerTypeRef[], item: OwnerTypeRef): void {
  if (items.some((existing) => existing.kind === item.kind && existing.name === item.name)) return
  items.push(item)
}

function sameOwnerRef(ref: OwnerTypeRef): OwnerTypeRef {
  return {
    kind: ref.kind,
    ...(ref.name !== undefined ? { name: ref.name } : {}),
  }
}

function metadataRecord(model: unknown): Record<string, unknown> {
  return typeof model === "object" && model !== null ? (model as Record<string, unknown>) : {}
}

function documentRegisterRecordRefs(owner: OwnerMetadata): OwnerTypeRef[] {
  const value = metadataRecord(owner.model).registerRecords
  if (!Array.isArray(value)) return []

  return value
    .map(registerRecordRefFromLink)
    .filter((ref): ref is OwnerTypeRef => ref !== undefined)
}

function registerRecordRefFromLink(value: unknown): OwnerTypeRef | undefined {
  if (typeof value !== "string") return undefined

  const dotIndex = value.indexOf(".")
  if (dotIndex === -1) return undefined

  const kind = getOwnerKindByMetadataLinkPrefix(value.substring(0, dotIndex))
  if (kind === undefined) return undefined

  const name = value.substring(dotIndex + 1)
  if (name.length === 0) return undefined

  return { kind, name }
}

function chartOfAccountsExtDimensionTypesField(owner: OwnerMetadata, segment: string): {
  name: string
  typeInfo: DataPathTypeInfo
  tableSource: { table: DataPathTableInfo; columns: Map<string, FormDataPathColumnSource>; hasColumns: boolean }
} {
  const table = { kind: "ValueTable" as const }
  return {
    name: segment,
    typeInfo: {
      kinds: ["tableSource"],
      nextTypes: [],
      table,
      sourceText: "ChartOfAccounts.ExtDimensionTypes",
    },
    tableSource: {
      table,
      columns: chartOfAccountsExtDimensionTypesColumns(owner),
      hasColumns: true,
    },
  }
}

function chartOfAccountsTerminalVirtualField(owner: OwnerMetadata, segment: string): FormDataPathColumnSource | undefined {
  if (segment === "Order" || segment === "Type") {
    return scalarColumn(segment, `ChartOfAccounts.${segment}`)
  }

  if (segment === "OffBalance") return booleanColumn(segment, "ChartOfAccounts.OffBalance")
  if (chartOfAccountsAccountingFlagNames(owner.model).includes(segment)) {
    return booleanColumn(segment, "ChartOfAccounts.AccountingFlag")
  }

  return undefined
}

function chartOfAccountsExtDimensionTypesColumns(owner: OwnerMetadata): Map<string, FormDataPathColumnSource> {
  const columns = new Map<string, FormDataPathColumnSource>()
  columns.set("ExtDimensionType", {
    name: "ExtDimensionType",
    typeInfo: chartOfAccountsExtDimensionTypeInfo(owner.model),
  })

  for (const name of ["TurnoversOnly", "ТолькоСальдо"]) {
    columns.set(name, booleanColumn(name, `ChartOfAccounts.ExtDimensionTypes.${name}`))
  }

  for (const name of chartOfAccountsExtDimensionAccountingFlagNames(owner.model)) {
    columns.set(name, booleanColumn(name, "ChartOfAccounts.ExtDimensionAccountingFlag"))
  }

  return columns
}

function chartOfAccountsExtDimensionTypeInfo(model: unknown): DataPathTypeInfo {
  const value = metadataRecord(model).extDimensionTypes
  if (typeof value !== "string") return { kinds: ["unknown"], nextTypes: [], sourceText: "ChartOfAccounts.ExtDimensionTypes.ExtDimensionType" }

  const prefix = "ChartOfCharacteristicTypes."
  if (!value.startsWith(prefix)) return { kinds: ["unknown"], nextTypes: [], sourceText: value }

  const name = value.substring(prefix.length)
  if (name.length === 0) return { kinds: ["unknown"], nextTypes: [], sourceText: value }

  return {
    kinds: ["object"],
    nextTypes: [{ kind: "ПланВидовХарактеристик", name }],
    sourceText: value,
  }
}

function chartOfAccountsExtDimensionAccountingFlagNames(model: unknown): string[] {
  const flags = metadataRecord(model).extDimensionAccountingFlags
  if (!Array.isArray(flags)) return []

  return flags
    .map((flag) => metadataRecord(flag).name)
    .filter((name): name is string => typeof name === "string" && name.length > 0)
}

function chartOfAccountsAccountingFlagNames(model: unknown): string[] {
  const flags = metadataRecord(model).accountingFlags
  if (!Array.isArray(flags)) return []

  return flags
    .map((flag) => metadataRecord(flag).name)
    .filter((name): name is string => typeof name === "string" && name.length > 0)
}

function chartOfCalculationTypesVirtualTableColumns(owner: OwnerMetadata): Map<string, FormDataPathColumnSource> {
  const columns = new Map<string, FormDataPathColumnSource>()
  columns.set("CalculationType", {
    name: "CalculationType",
    typeInfo: {
      kinds: ["object"],
      nextTypes: [owner.ref],
      sourceText: `ChartOfCalculationTypes.${owner.ref.name}`,
    },
  })
  return columns
}

function isCalculationTypesVirtualTableName(segment: string): boolean {
  return segment === "BaseCalculationTypes" ||
    segment === "LeadingCalculationTypes" ||
    segment === "DisplacingCalculationTypes"
}

function valueListColumn(segment: string): FormDataPathColumnSource | undefined {
  switch (segment) {
    case "Value":
      return scalarColumn(segment, "ValueList.Value")
    case "Presentation":
      return scalarColumn(segment, "ValueList.Presentation")
    case "Check":
      return booleanColumn(segment, "ValueList.Check")
    case "Picture":
      return { name: segment, typeInfo: { kinds: ["Picture"], nextTypes: [], sourceText: "ValueList.Picture" } }
  }

  return undefined
}

function ganttChartColumn(segment: string): FormDataPathColumnSource | undefined {
  switch (segment) {
    case "Point":
    case "Text":
      return scalarColumn(segment, `GanttChart.${segment}`)
  }

  return undefined
}

function registerRecordSetStandardColumn(segment: string, fieldName: string | undefined): FormDataPathColumnSource | undefined {
  const yamlName = segment === "PeriodAdjustment" ? segment : fieldName ?? standardAttributeAliasToYAML(segment) ?? segment
  switch (segment) {
    case "Active":
    case "Активность":
      return booleanColumn(yamlName, "RegisterRecordSet.Active")
    case "Period":
    case "Период":
      return dateTimeColumn(yamlName, "RegisterRecordSet.Period")
    case "LineNumber":
    case "НомерСтроки":
      return scalarColumn(yamlName, "RegisterRecordSet.LineNumber")
    case "PeriodAdjustment":
      return scalarColumn(yamlName, "RegisterRecordSet.PeriodAdjustment")
    case "RecordType":
    case "ВидДвижения":
      return scalarColumn(yamlName, "RegisterRecordSet.RecordType")
  }

  return undefined
}

function accountingRegisterRecordSetColumn(params: {
  owner: OwnerMetadata
  segment: string
}): FormDataPathColumnSource | undefined {
  if (params.owner.ref.kind !== "РегистрБухгалтерии") return undefined

  const accountColumn = accountingRegisterAccountColumn(params.owner, params.segment)
  if (accountColumn !== undefined) return accountColumn

  const extDimensionColumn = accountingRegisterExtDimensionColumn(params.segment)
  if (extDimensionColumn !== undefined) return extDimensionColumn

  return accountingRegisterDebitCreditFieldColumn(params.owner, params.segment)
}

function accountingRegisterAccountColumn(owner: OwnerMetadata, segment: string): FormDataPathColumnSource | undefined {
  if (segment !== "Account" && segment !== "AccountDr" && segment !== "AccountCr") return undefined

  const chartOfAccounts = accountingRegisterChartOfAccounts(owner.model)
  if (chartOfAccounts === undefined) return undefined

  return {
    name: segment,
    typeInfo: {
      kinds: ["object"],
      nextTypes: [chartOfAccounts],
      sourceText: `ChartOfAccounts.${chartOfAccounts.name ?? ""}`,
    },
  }
}

function accountingRegisterChartOfAccounts(model: unknown): OwnerTypeRef | undefined {
  const value = metadataRecord(model).chartOfAccounts
  if (typeof value !== "string") return undefined

  const prefix = "ChartOfAccounts."
  if (!value.startsWith(prefix)) return undefined

  const name = value.substring(prefix.length)
  if (name.length === 0) return undefined

  return { kind: "ПланСчетов", name }
}

function accountingRegisterExtDimensionColumn(segment: string): FormDataPathColumnSource | undefined {
  const match = /^ExtDimension(?:Dr|Cr)?(?<number>[1-9]\d?)$/.exec(segment)
  const number = match?.groups?.number
  if (number === undefined || Number(number) > 50) return undefined

  return {
    name: segment,
    typeInfo: {
      kinds: ["any"],
      nextTypes: [],
      sourceText: "AccountingRegisterRecordSet.ExtDimension",
    },
  }
}

function accountingRegisterDebitCreditFieldColumn(owner: OwnerMetadata, segment: string): FormDataPathColumnSource | undefined {
  const match = /^(?<name>.+)(?:Dr|Cr)$/.exec(segment)
  const name = match?.groups?.name
  if (name === undefined) return undefined

  const field = resolveObjectFieldSegment({ index: owner.fieldIndex, segment: name })
  if (field === undefined) return undefined

  return {
    name: segment,
    typeInfo: field.typeInfo,
  }
}

function scalarColumn(name: string, sourceText: string): FormDataPathColumnSource {
  return { name, typeInfo: { kinds: ["scalar"], nextTypes: [], sourceText } }
}

function booleanColumn(name: string, sourceText: string): FormDataPathColumnSource {
  return { name, typeInfo: { kinds: ["boolean"], nextTypes: [], sourceText } }
}

function dateTimeColumn(name: string, sourceText: string): FormDataPathColumnSource {
  return { name, typeInfo: { kinds: ["dateTime"], nextTypes: [], sourceText } }
}

function isUnknownTypeInfo(typeInfo: DataPathTypeInfo): boolean {
  return typeInfo.kinds.length === 1 && typeInfo.kinds[0] === "unknown"
}
