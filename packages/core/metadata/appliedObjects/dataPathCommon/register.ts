import type { DataPathTypeInfo, FormDataPathColumnSource, OwnerTypeRef } from "../../validation/dataPath/types"
import {
  getOwnerKindByMetadataLinkPrefix,
  registerObjectFieldCollectionProvider,
  registerStandardAttributeTypeResolver,
  registerTableColumnResolver,
} from "../../validation/dataPath/registry"
import { standardAttributeAliasToYAML } from "../../validation/dataPath/objectFields"

registerObjectFieldCollectionProvider(({ owner }) => {
  const descriptors = []
  for (const collection of [
    "attributes",
    "tabularSections",
    "dimensions",
    "resources",
    "addressingAttributes",
  ] as const) {
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
  if (internalName === "Ref" || yamlName === "Ссылка")
    return { kinds: ["object"], nextTypes: [sameOwnerRef(owner.ref)] }
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

registerTableColumnResolver(({ table, segment }) => {
  if (segment === "RowsCount") return scalarColumn(segment, "RowsCount")
  if (segment.startsWith("Total")) return scalarColumn(segment, "Total")
  if (table.kind === "ValueList") return valueListColumn(segment)
  if (table.kind === "GanttChart") return ganttChartColumn(segment)
  return undefined
})

registerTableColumnResolver(({ table, segment, field }) => {
  if (table.kind !== "RegisterRecordSet") return undefined

  const virtualStandardColumn = registerRecordSetStandardColumn(segment, field?.name)
  if (field === undefined) return virtualStandardColumn
  if (virtualStandardColumn !== undefined) return virtualStandardColumn

  return {
    name: field.name,
    typeInfo: field.typeInfo,
  }
})

export function scalarColumn(name: string, sourceText: string): FormDataPathColumnSource {
  return { name, typeInfo: { kinds: ["scalar"], nextTypes: [], sourceText } }
}

export function booleanColumn(name: string, sourceText: string): FormDataPathColumnSource {
  return { name, typeInfo: { kinds: ["boolean"], nextTypes: [], sourceText } }
}

export function dateTimeColumn(name: string, sourceText: string): FormDataPathColumnSource {
  return { name, typeInfo: { kinds: ["dateTime"], nextTypes: [], sourceText } }
}

export function metadataRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {}
}

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

function registerRecordSetStandardColumn(
  segment: string,
  fieldName: string | undefined
): FormDataPathColumnSource | undefined {
  const yamlName =
    segment === "PeriodAdjustment" ? segment : (fieldName ?? standardAttributeAliasToYAML(segment) ?? segment)
  switch (segment) {
    case "Active":
    case "Активность":
      return { ...booleanColumn(yamlName, "RegisterRecordSet.Active"), targetName: "Active" }
    case "Period":
    case "Период":
      return { ...dateTimeColumn(yamlName, "RegisterRecordSet.Period"), targetName: "Period" }
    case "LineNumber":
    case "НомерСтроки":
      return { ...scalarColumn(yamlName, "RegisterRecordSet.LineNumber"), targetName: "LineNumber" }
    case "Recorder":
    case "Регистратор":
      return { ...scalarColumn(yamlName, "RegisterRecordSet.Recorder"), targetName: "Recorder" }
    case "PeriodAdjustment":
      return scalarColumn(yamlName, "RegisterRecordSet.PeriodAdjustment")
    case "RecordType":
    case "ВидДвижения":
      return { ...scalarColumn(yamlName, "RegisterRecordSet.RecordType"), targetName: "RecordType" }
  }

  return undefined
}
