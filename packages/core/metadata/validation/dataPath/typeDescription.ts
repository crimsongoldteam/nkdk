import type { TypeDescription } from "~/metadata/commonObjects/typeDescription/types"
import type { DataPathTableInfo, DataPathTypeInfo, DataPathValueKind, OwnerTypeRef } from "./types"

export interface TypeDescriptionToDataPathTypeInfoOptions {
  defaultType?: string
}

const scalarTypes = new Set([
  "string",
  "decimal",
  "base64Binary",
  "date",
  "Null",
  "UUID",
])

const ownerKindsByBaseType: Readonly<Record<string, OwnerTypeRef["kind"] | undefined>> = {
  CatalogRef: "Справочник",
  CatalogObject: "СправочникОбъект",
  DocumentRef: "Документ",
  DocumentObject: "ДокументОбъект",
  EnumRef: "Перечисление",
  InformationRegisterRecordManager: "РегистрСведений",
  AccumulationRegisterRecordManager: "РегистрНакопления",
  AccountingRegisterRecordManager: "РегистрБухгалтерии",
  CalculationRegisterRecordManager: "РегистрРасчета",
  ExchangePlanRef: "ПланОбмена",
  ExchangePlanObject: "ПланОбменаОбъект",
  ChartOfCalculationTypesRef: "ПланВидовРасчета",
  ChartOfCalculationTypesObject: "ПланВидовРасчетаОбъект",
  ChartOfCharacteristicTypesRef: "ПланВидовХарактеристик",
  ChartOfCharacteristicTypesObject: "ПланВидовХарактеристикОбъект",
  ChartOfAccountsRef: "ПланСчетов",
  ChartOfAccountObject: "ПланСчетовОбъект",
  ChartOfAccountsObject: "ПланСчетовОбъект",
  DataProcessorObject: "ОбработкаОбъект",
  ReportObject: "ОтчетОбъект",
  BusinessProcessRef: "БизнесПроцесс",
  BusinessProcessObject: "БизнесПроцессОбъект",
  TaskRef: "Задача",
  TaskObject: "ЗадачаОбъект",
}

const registerRecordSetOwnerKindsByBaseType: Readonly<Record<string, OwnerTypeRef["kind"] | undefined>> = {
  InformationRegisterRecordSet: "РегистрСведений",
  AccumulationRegisterRecordSet: "РегистрНакопления",
  AccountingRegisterRecordSet: "РегистрБухгалтерии",
  CalculationRegisterRecordSet: "РегистрРасчета",
}

export function typeDescriptionToDataPathTypeInfo(
  typeDescription: TypeDescription | undefined,
  _options: TypeDescriptionToDataPathTypeInfoOptions = {},
): DataPathTypeInfo {
  const types = typeDescription?.type
  if (!Array.isArray(types) || types.length === 0 || hasOnlyTypeId(typeDescription)) {
    return { kinds: ["unknown"], nextTypes: [] }
  }

  const kinds: DataPathValueKind[] = []
  const nextTypes: OwnerTypeRef[] = []
  let table: DataPathTableInfo | undefined

  for (const type of types) {
    const mapped = mapType(type)
    addUnique(kinds, mapped.kind)
    if (mapped.nextType !== undefined) nextTypes.push(mapped.nextType)
    if (table === undefined && mapped.table !== undefined) table = mapped.table
  }

  return {
    kinds,
    nextTypes,
    ...(table !== undefined ? { table } : {}),
    ...(types.length > 1 ? { isComposite: true } : {}),
    sourceText: types.join(" | "),
  }
}

function hasOnlyTypeId(typeDescription: TypeDescription | undefined): boolean {
  return (
    typeDescription !== undefined &&
    (!Array.isArray(typeDescription.type) || typeDescription.type.length === 0) &&
    Array.isArray(typeDescription.typeId) &&
    typeDescription.typeId.length > 0
  )
}

function mapType(type: string): { kind: DataPathValueKind; nextType?: OwnerTypeRef; table?: DataPathTableInfo } {
  switch (type) {
    case "boolean":
      return { kind: "boolean" }
    case "dateTime":
      return { kind: "dateTime" }
    case "Picture":
      return { kind: "Picture" }
    case "ValueTable":
      return { kind: "tableSource", table: { kind: "ValueTable" } }
    case "ValueTree":
      return { kind: "tableSource", table: { kind: "ValueTree" } }
    case "ValueListType":
    case "СписокЗначений":
      return { kind: "tableSource", table: { kind: "ValueList" } }
    case "GanttChart":
    case "ДиаграммаГанта":
      return { kind: "tableSource", table: { kind: "GanttChart" } }
    case "DynamicList":
      return { kind: "dynamicList", table: { kind: "DynamicList" } }
    case "ConstantsSet":
    case "КонстантыНабор":
      return { kind: "constantSet" }
    case "SettingsComposer":
    case "КомпоновщикНастроекКомпоновкиДанных":
      return { kind: "platformSource" }
    case "StandardPeriod":
    case "СтандартныйПериод":
      return { kind: "standardPeriod" }
  }

  if (baseTypeOf(type) === "DefinedType") return { kind: "object" }

  const registerRecordSetOwnerRef = registerRecordSetOwnerTypeRefFromType(type)
  if (registerRecordSetOwnerRef !== undefined) {
    return {
      kind: "tableSource",
      table: { kind: "RegisterRecordSet", owner: registerRecordSetOwnerRef },
    }
  }

  const ownerRef = ownerTypeRefFromType(type)
  if (ownerRef !== undefined) return { kind: "object", nextType: ownerRef }
  if (scalarTypes.has(type)) return { kind: "scalar" }

  return { kind: "unsupportedIntermediate" }
}

function registerRecordSetOwnerTypeRefFromType(type: string): OwnerTypeRef | undefined {
  const [baseType, name] = splitType(type)
  const kind = registerRecordSetOwnerKindsByBaseType[baseType]
  if (kind === undefined) return undefined
  return {
    kind,
    ...(name !== undefined && name !== "" ? { name } : {}),
  }
}

function ownerTypeRefFromType(type: string): OwnerTypeRef | undefined {
  const [baseType, name] = splitType(type)
  const kind = ownerKindsByBaseType[baseType]
  if (kind === undefined) return undefined
  return {
    kind,
    ...(name !== undefined && name !== "" ? { name } : {}),
  }
}

function splitType(type: string): [baseType: string, name?: string] {
  const dotIndex = type.indexOf(".")
  if (dotIndex === -1) return [type]
  return [type.substring(0, dotIndex), type.substring(dotIndex + 1)]
}

function baseTypeOf(type: string): string {
  return splitType(type)[0]
}

function addUnique(items: DataPathValueKind[], item: DataPathValueKind): void {
  if (!items.includes(item)) items.push(item)
  if (item === "dynamicList") addUnique(items, "tableSource")
}
