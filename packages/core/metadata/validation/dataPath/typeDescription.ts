import type { TypeDescription } from "~/metadata/commonObjects/typeDescription/types"
import {
  getOwnerKindByRegisterRecordSetBase,
  getOwnerKindByTypeDescriptionBase,
  resolveRegisteredDataPathType,
} from "./registry"
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
  const definedTypes: string[] = []
  let table: DataPathTableInfo | undefined

  for (const type of types) {
    const mapped = mapType(type)
    addUnique(kinds, mapped.kind)
    if (mapped.nextType !== undefined) nextTypes.push(mapped.nextType)
    if (mapped.definedType !== undefined) definedTypes.push(mapped.definedType)
    if (table === undefined && mapped.table !== undefined) table = mapped.table
  }

  return {
    kinds,
    nextTypes,
    ...(definedTypes.length > 0 ? { definedTypes } : {}),
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

function mapType(type: string): {
  kind: DataPathValueKind
  nextType?: OwnerTypeRef
  definedType?: string
  table?: DataPathTableInfo
} {
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

  const definedTypeName = definedTypeNameFromType(type)
  if (definedTypeName !== undefined) return { kind: "object", definedType: definedTypeName }

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

  const [baseType, name] = splitType(type)
  const registered = resolveRegisteredDataPathType({ baseType, ...(name !== undefined ? { name } : {}) })
  if (registered !== undefined) {
    return {
      kind: registered.kinds[0] ?? "unknown",
      ...(registered.nextTypes[0] !== undefined ? { nextType: registered.nextTypes[0] } : {}),
      ...(registered.definedTypes?.[0] !== undefined ? { definedType: registered.definedTypes[0] } : {}),
      ...(registered.table !== undefined ? { table: registered.table } : {}),
    }
  }

  return { kind: "unsupportedIntermediate" }
}

function registerRecordSetOwnerTypeRefFromType(type: string): OwnerTypeRef | undefined {
  const [baseType, name] = splitType(type)
  const kind = getOwnerKindByRegisterRecordSetBase(baseType)
  if (kind === undefined) return undefined
  return {
    kind,
    ...(name !== undefined && name !== "" ? { name } : {}),
  }
}

function ownerTypeRefFromType(type: string): OwnerTypeRef | undefined {
  const [baseType, name] = splitType(type)
  const kind = getOwnerKindByTypeDescriptionBase(baseType)
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

function definedTypeNameFromType(type: string): string | undefined {
  const [baseType, name] = splitType(type)
  if (baseType !== "DefinedType") return undefined
  return name && name.length > 0 ? name : undefined
}

function addUnique(items: DataPathValueKind[], item: DataPathValueKind): void {
  if (!items.includes(item)) items.push(item)
  if (item === "dynamicList") addUnique(items, "tableSource")
}
