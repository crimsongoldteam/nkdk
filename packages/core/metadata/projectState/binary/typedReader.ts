import { isMetadataRootName } from "../../commonObjects/metadataTargets/roots"
import type {
  MetadataMemberKind,
  MetadataObjectPathKind,
  MetadataRootName,
  ParsedMetadataTarget,
} from "../../commonObjects/metadataTargets/types"
import type { TypeDescription } from "../../commonObjects/typeDescription/types"
import type { DataPathTableInfo, DataPathTypeInfo, OwnerTypeRef } from "../../validation/dataPath/types"
import type {
  ProjectStateFileIdentity,
  ProjectStateFileUpdate,
  ProjectStateLocalValidationResult,
  ProjectStateOwnerFacts,
  ProjectStatePendingReference,
  ProjectStateYamlFileUpdate,
} from "../fileUpdate"
import { decodeMetadataTargetConstraint } from "./constraintCodec"
import type { DiagnosticSource, DiagnosticSeverity } from "../../validation/types"
import { PROJECT_STATE_FACT_RECORD_VIEWS, PROJECT_STATE_FACT_TABLE_ORDER, type ProjectStateFactTableKind } from "./factTables"
import {
  ProjectStateDiagnosticRecordView,
  ProjectStateDiagnosticSectionHeaderView,
} from "./layouts"
import type { ProjectStateSnapshotView } from "./snapshot"

const NONE = 0xffff_ffff
const YAML_ROLES = [undefined, "configuration", "properties", "form"] as const
const REFERENCE_KINDS = [undefined, "object", "member", "value"] as const
const FIELD_KINDS = [undefined, "attribute", "standardAttribute", "tabularSection", "dimension", "resource", "addressingAttribute"] as const
const TABLE_KINDS = [undefined, "ValueTable", "ValueTree", "ValueList", "GanttChart", "DynamicList", "RegisterRecordSet", "TabularSection"] as const
const SEVERITIES = [undefined, "error", "warning"] as const
const SOURCES = [undefined, "syntax", "structure", "external-file", "cross-file", "reference"] as const
const MEMBER_KINDS = new Set<MetadataMemberKind>([
  "Attribute", "StandardAttribute", "TabularSection", "Dimension", "Resource", "Form", "Template",
  "Command", "AccountingFlag", "ExtDimensionAccountingFlag", "AddressingAttribute", "Field",
])

function targetPairs(parts: readonly string[]): readonly (readonly [string, string])[] {
  if (parts.length % 2 !== 0) throw new Error("Повреждён канонический адрес metadata target")
  return Array.from({ length: parts.length / 2 }, (_, index) => [parts[index * 2]!, parts[index * 2 + 1]!] as const)
}

const RECORDS = PROJECT_STATE_FACT_RECORD_VIEWS

export interface TypedProjectStateReader {
  yamlFacts(fileId: number): Pick<ProjectStateYamlFileUpdate, "references" | "pendingReferences" | "owners" | "fields" | "forms" | "pendingChecks" | "dependencies"> | undefined
  referenceDetails(
    fileId: number,
    kind: ProjectStateYamlFileUpdate["references"][number]["kind"],
    canonical: string,
  ): ProjectStateYamlFileUpdate["references"][number]["details"]
  owners(fileId: number): ProjectStateYamlFileUpdate["owners"]
  fields(fileId: number): ProjectStateYamlFileUpdate["fields"]
  forms(fileId: number): ProjectStateYamlFileUpdate["forms"]
  localValidation(fileId: number): ProjectStateLocalValidationResult | undefined
  pendingReferences(fileId: number): ProjectStateYamlFileUpdate["pendingReferences"]
  pendingChecks(fileId: number): ProjectStateYamlFileUpdate["pendingChecks"]
  fileUpdate(fileId: number): ProjectStateFileUpdate
}

interface FileRowIndex {
  readonly offsets: Uint32Array
  readonly rowIds: Uint32Array
}

export interface TypedProjectStateReadIndex {
  readonly facts: ArrayBufferLike
  readonly fileCount: number
  readonly rowsByFile: Map<ProjectStateFactTableKind, FileRowIndex>
}

export function createTypedProjectStateReadIndex(
  snapshot: ProjectStateSnapshotView,
): TypedProjectStateReadIndex {
  return {
    facts: snapshot.buffers.facts,
    fileCount: snapshot.fileCount,
    rowsByFile: new Map(),
  }
}

export function createTypedProjectStateReader(
  snapshot: ProjectStateSnapshotView,
  readIndex: TypedProjectStateReadIndex = createTypedProjectStateReadIndex(snapshot),
): TypedProjectStateReader {
  if (readIndex.facts !== snapshot.buffers.facts || readIndex.fileCount !== snapshot.fileCount) {
    throw new Error("Индекс чтения не соответствует снимку состояния проекта")
  }
  const catalog = snapshot.factTableCatalog()
  const factsView = new DataView(snapshot.buffers.facts)
  const strings: (string | undefined)[] = new Array(snapshot.stringPool().count)
  const yamlCache = new Map<number, ReturnType<TypedProjectStateReader["yamlFacts"]>>()
  const ownersCache = new Map<number, ProjectStateYamlFileUpdate["owners"]>()
  const fieldsCache = new Map<number, ProjectStateYamlFileUpdate["fields"]>()
  const formsCache = new Map<number, ProjectStateYamlFileUpdate["forms"]>()
  const validationCache = new Map<number, ProjectStateLocalValidationResult | undefined>()

  return {
    yamlFacts,
    referenceDetails,
    owners,
    fields,
    forms,
    localValidation,
    pendingReferences,
    pendingChecks,
    fileUpdate,
  }

  function string(id: number): string {
    if (id === NONE) throw new Error("Обязательная строка отсутствует")
    return strings[id] ??= snapshot.stringValue(id)
  }

  function optionalString(id: number): string | undefined {
    return id === NONE ? undefined : string(id)
  }

  function row(kind: ProjectStateFactTableKind, id: number): Record<string, number> {
    const range = catalog.get(kind)
    if (range === undefined || id < 0 || id >= range.records) throw new Error(`Неизвестная запись ${kind}: ${id}`)
    const codec = RECORDS[kind]
    return codec.decode(factsView, range.byteOffset + id * codec.viewLength)
  }

  function range(kind: ProjectStateFactTableKind, start: number, count: number): Record<string, number>[] {
    return Array.from({ length: count }, (_, index) => row(kind, start + index))
  }

  function fileRows(kind: ProjectStateFactTableKind, fileId: number): Record<string, number>[] {
    let index = readIndex.rowsByFile.get(kind)
    if (index === undefined) {
      const count = catalog.get(kind)?.records ?? 0
      const sourceFileIds = new Uint32Array(count)
      const offsets = new Uint32Array(snapshot.fileCount + 1)
      for (let id = 0; id < count; id += 1) {
        const sourceFileId = row(kind, id).sourceFileId
        sourceFileIds[id] = sourceFileId
        offsets[sourceFileId + 1] += 1
      }
      for (let id = 0; id < snapshot.fileCount; id += 1) offsets[id + 1] += offsets[id]
      const cursors = offsets.slice(0, snapshot.fileCount)
      const rowIds = new Uint32Array(count)
      for (let id = 0; id < count; id += 1) {
        const sourceFileId = sourceFileIds[id]
        rowIds[cursors[sourceFileId]++] = id
      }
      index = { offsets, rowIds }
      readIndex.rowsByFile.set(kind, index)
    }
    const start = index.offsets[fileId] ?? 0
    const end = index.offsets[fileId + 1] ?? start
    return Array.from({ length: end - start }, (_, offset) => row(kind, index.rowIds[start + offset]))
  }

  function ownerType(id: number): OwnerTypeRef {
    const value = row("ownerTypes", id)
    const name = optionalString(value.nameId)
    return { kind: string(value.kindId), ...(name === undefined ? {} : { name }) }
  }

  function tableInfo(id: number): DataPathTableInfo | undefined {
    if (id === NONE) return undefined
    const value = row("tableInfo", id)
    const kind = TABLE_KINDS[value.kind]
    if (kind === undefined) throw new Error(`Неизвестный вид таблицы: ${value.kind}`)
    if (kind === "RegisterRecordSet") return { kind, owner: ownerType(value.ownerTypeId) }
    if (kind === "TabularSection") return { kind, owner: ownerType(value.ownerTypeId), name: string(value.nameId) }
    return { kind }
  }

  function stringValues(kind: "typeKinds" | "definedTypes" | "allowedKinds" | "typeDescriptionValues", start: number, count: number): string[] {
    return range(kind, start, count).map((value) => string(value.valueId))
  }

  function typeInfo(id: number): DataPathTypeInfo {
    const value = row("typeInfo", id)
    const table = tableInfo(value.tableInfoId)
    const definedTypes = stringValues("definedTypes", value.definedTypesStart, value.definedTypesCount)
    const sourceText = optionalString(value.sourceTextId)
    return {
      kinds: stringValues("typeKinds", value.kindsStart, value.kindsCount) as DataPathTypeInfo["kinds"],
      nextTypes: range("ownerTypes", value.nextTypesStart, value.nextTypesCount).map((_entry, index) => ownerType(value.nextTypesStart + index)),
      ...(definedTypes.length === 0 ? {} : { definedTypes }),
      ...(table === undefined ? {} : { table }),
      ...(value.isComposite === 0 ? {} : { isComposite: value.isComposite === 1 }),
      ...(sourceText === undefined ? {} : { sourceText }),
    }
  }

  function yamlPath(id: number): (string | number)[] {
    const value = row("yamlPaths", id)
    return range("yamlPathSegments", value.segmentsStart, value.segmentsCount)
      .map((segment) => segment.kind === 1 ? string(segment.stringId) : segment.numericValue)
  }

  function typeDescription(id: number): TypeDescription {
    const value = row("typeDescriptions", id)
    const typeId = stringValues("typeDescriptionValues", value.typeIdsStart, value.typeIdsCount)
    return {
      type: stringValues("typeDescriptionValues", value.typesStart, value.typesCount) as TypeDescription["type"],
      ...(typeId.length === 0 ? {} : { typeId }),
      ...(value.stringLength === NONE ? {} : { stringQualifiers: {
        length: value.stringLength,
        allowedLength: value.allowedLength === 1 ? "Variable" as const : "Fixed" as const,
      } }),
      ...(value.digits === NONE ? {} : { numberQualifiers: {
        digits: value.digits, fractionDigits: value.fractionDigits,
        allowedSign: value.allowedSign === 1 ? "Any" as const : "Nonnegative" as const,
      } }),
      ...(value.dateFractions === 0 ? {} : { dateQualifiers: {
        dateFractions: ([undefined, "Date", "Time", "DateTime"] as const)[value.dateFractions]!,
      } }),
    }
  }

  function ownerFacts(ownerRow: Record<string, number>): ProjectStateOwnerFacts {
    const result: Record<string, unknown> = {}
    for (const value of range("ownerFacts", ownerRow.factsStart, ownerRow.factsCount)) {
      const role = string(value.roleId)
      if (value.valueKind === 1) result[role] = string(value.valueId)
      else if (value.valueKind === 2) result[role] = stringValues("definedTypes", value.itemsStart, value.itemsCount)
      else if (value.valueKind === 3) result[role] = typeDescription(value.valueId)
      else if (value.valueKind === 4) result[role] = namedItems(value.itemsStart, value.itemsCount)
      else if (value.valueKind === 5) result[role] = tabularSections(value.itemsStart, value.itemsCount)
    }
    return result as ProjectStateOwnerFacts
  }

  function namedItems(start: number, count: number) {
    return range("ownerFactItems", start, count).map((item) => ({
      name: string(item.nameId),
      ...(item.typeDescriptionId === NONE ? {} : { type: typeDescription(item.typeDescriptionId) }),
    }))
  }

  function tabularSections(start: number, count: number) {
    const items: (Record<string, number> & { readonly id: number })[] =
      range("ownerFactItems", start, count).map((item, index) => ({ ...item, id: start + index }))
    return items.filter(({ kind }) => kind === 2).map((section) => ({
      name: string(section.nameId),
      attributes: items.filter(({ kind, parentItemId }) => kind === 3 && parentItemId === section.id).map(decodeNamedItem),
      ...(() => {
        const values = items.filter(({ kind, parentItemId }) => kind === 4 && parentItemId === section.id).map(decodeNamedItem)
        return values.length === 0 ? {} : { standardAttributes: values }
      })(),
    }))
  }

  function decodeNamedItem(item: Record<string, number>) {
    return { name: string(item.nameId), ...(item.typeDescriptionId === NONE ? {} : { type: typeDescription(item.typeDescriptionId) }) }
  }

  function pendingReference(value: Record<string, number>): ProjectStatePendingReference {
    const constraint = decodeMetadataTargetConstraint(string(value.constraintKindId))
    const canonical = string(value.canonicalId)
    return {
      yamlPath: yamlPath(value.yamlPathId),
      canonical,
      target: storedTarget(value, canonical),
      constraint,
    }
  }

  function storedTarget(value: Record<string, number>, canonical: string): ParsedMetadataTarget {
    const kind = string(value.targetKindId)
    const root = string(value.targetRootId)
    if (!isMetadataRootName(root)) throw new Error(`Неизвестный корень metadata target: ${root}`)
    const objectName = string(value.targetNameId)
    const tail = canonical.split(".").slice(2)
    if (kind === "object") {
      const segments = targetPairs(tail).map(([segmentKind, name]) => ({
        kind: segmentKind as MetadataObjectPathKind | MetadataRootName,
        objectName: name,
      }))
      return { kind, root, objectName, ...(segments.length === 0 ? {} : { segments }) }
    }
    if (kind === "member") {
      const pairs = targetPairs(tail)
      const firstMember = pairs.findIndex(([segmentKind]) => MEMBER_KINDS.has(segmentKind as MetadataMemberKind))
      if (firstMember < 0) throw new Error(`Metadata target не содержит члена: ${canonical}`)
      return {
        kind,
        root,
        objectName,
        ...(firstMember === 0 ? {} : {
          objectSegments: pairs.slice(0, firstMember).map(([segmentKind, name]) => ({
            kind: segmentKind as MetadataObjectPathKind | MetadataRootName,
            objectName: name,
          })),
        }),
        segments: pairs.slice(firstMember).map(([segmentKind, name]) => ({
          kind: segmentKind as MetadataMemberKind,
          name,
        })),
      }
    }
    if (kind === "value") {
      if (tail[0] === "EmptyRef") return { kind, root, objectName, valueKind: "emptyRef" }
      if (tail[0] === "EnumValue") {
        return { kind, root, objectName, valueKind: "enumValue", valueName: string(value.targetMemberId) }
      }
      return { kind, root, objectName, valueKind: "predefinedValue", valueName: string(value.targetMemberId) }
    }
    throw new Error(`Неизвестный вид metadata target: ${kind}`)
  }

  function yamlFacts(fileId: number) {
    if (yamlCache.has(fileId)) return yamlCache.get(fileId)
    if (snapshot.fileRecord(fileId).updateKind !== 1) return undefined
    const result: NonNullable<ReturnType<TypedProjectStateReader["yamlFacts"]>> = {
      references: fileRows("references", fileId).map(reference),
      pendingReferences: pendingReferences(fileId),
      owners: owners(fileId),
      fields: fields(fileId),
      forms: forms(fileId),
      pendingChecks: pendingChecks(fileId),
      dependencies: fileRows("dependencies", fileId).map((value) => string(value.projectPathId)),
    }
    yamlCache.set(fileId, result)
    return result
  }

  function reference(value: Record<string, number>): ProjectStateYamlFileUpdate["references"][number] {
    const kind = REFERENCE_KINDS[value.kind]
    if (kind === undefined) throw new Error(`Неизвестный вид ссылки: ${value.kind}`)
    if (value.detailsId === NONE) return { kind, canonical: string(value.canonicalId) }
    const details = row("referenceDetails", value.detailsId)
    const decodedType = details.typeInfoId === NONE ? undefined : typeInfo(details.typeInfoId)
    const detailsKind = ([undefined, "attribute", "standardAttribute"] as const)[details.kind]
    const styleItemType = ([undefined, "Color", "Font", "Border"] as const)[details.styleItemType]
    return { kind, canonical: string(value.canonicalId), details: {
      ...(detailsKind === undefined ? {} : { kind: detailsKind }),
      ...(decodedType === undefined ? {} : { typeInfo: {
        kinds: decodedType.kinds, ...(decodedType.sourceText === undefined ? {} : { sourceText: decodedType.sourceText }),
        ...(decodedType.definedTypes === undefined ? {} : { definedTypes: decodedType.definedTypes }),
      } }),
      ...(styleItemType === undefined ? {} : { styleItemType }),
    } }
  }

  function referenceDetails(
    fileId: number,
    kind: ProjectStateYamlFileUpdate["references"][number]["kind"],
    canonical: string,
  ): ProjectStateYamlFileUpdate["references"][number]["details"] {
    const value = fileRows("references", fileId).find((candidate) =>
      REFERENCE_KINDS[candidate.kind] === kind && string(candidate.canonicalId) === canonical)
    return value === undefined ? undefined : reference(value).details
  }

  function owners(fileId: number): ProjectStateYamlFileUpdate["owners"] {
    const cached = ownersCache.get(fileId)
    if (cached !== undefined) return cached
    const result = fileRows("owners", fileId).map((value) => ({
      owner: { kind: string(value.kindId), ...optionalName(value.nameId) }, facts: ownerFacts(value),
    }))
    ownersCache.set(fileId, result)
    return result
  }

  function fields(fileId: number): ProjectStateYamlFileUpdate["fields"] {
    const cached = fieldsCache.get(fileId)
    if (cached !== undefined) return cached
    const result = fileRows("fields", fileId).map((value) => {
      const kind = FIELD_KINDS[value.kind]
      if (kind === undefined) throw new Error(`Неизвестный вид поля: ${value.kind}`)
      const table = tableInfo(value.tableInfoId)
      return { owner: ownerType(value.ownerId), name: string(value.nameId), kind, typeInfo: typeInfo(value.typeInfoId),
        ...optionalField("targetName", value.targetNameId), ...optionalField("sourceCollection", value.sourceCollectionId),
        ...optionalField("parentName", value.parentNameId), ...(table === undefined ? {} : { table }),
        ...(value.tableHasColumns === 0 ? {} : { tableHasColumns: value.tableHasColumns === 1 }) }
    })
    fieldsCache.set(fileId, result)
    return result
  }

  function forms(fileId: number): ProjectStateYamlFileUpdate["forms"] {
    const cached = formsCache.get(fileId)
    if (cached !== undefined) return cached
    const result = ([...fileRows("forms", fileId), ...fileRows("formColumns", fileId)]).map((value) => {
      if (value.kind === 3) return { kind: "tableDataPath" as const, owner: ownerType(value.ownerTypeId),
        name: string(value.nameId), dataPath: string(value.tablePathId) }
      const decodedType = typeInfo(value.typeInfoId)
      if (value.kind === 2) return { kind: "additionalColumn" as const, owner: ownerType(value.ownerTypeId),
        tablePath: string(value.tablePathId), name: string(value.nameId),
        source: { name: string(value.nameId), typeInfo: decodedType } }
      const table = tableInfo(value.tableInfoId)
      return { kind: "root" as const, owner: ownerType(value.ownerTypeId), name: string(value.nameId), source: {
        kind: "formAttribute" as const, name: string(value.nameId), typeInfo: decodedType,
        ...(table === undefined ? {} : { table }),
        ...(value.tableHasColumns === 0 ? {} : { tableHasColumns: value.tableHasColumns === 1 }),
      } }
    })
    formsCache.set(fileId, result)
    return result
  }

  function pendingReferences(fileId: number): ProjectStateYamlFileUpdate["pendingReferences"] {
    return fileRows("pendingReferences", fileId).map(pendingReference)
  }

  function pendingChecks(fileId: number): ProjectStateYamlFileUpdate["pendingChecks"] {
    return fileRows("pendingChecks", fileId).map((value) => ({
        kind: "dataPath" as const, yamlPath: yamlPath(value.yamlPathId),
        location: { line: value.line, col: value.col, ...optionalField("path", value.pathId) },
        owner: ownerType(value.ownerTypeId), value: string(value.valueId),
        policyInput: { yaml: string(value.policyYamlId),
          ...(value.allowedKindsCount === 0 ? {} : { allowedKinds: stringValues("allowedKinds", value.allowedKindsStart, value.allowedKindsCount) }),
          ...(value.allowComposite === 0 ? {} : { allowComposite: value.allowComposite === 1 }) },
        ...optionalField("elementType", value.elementTypeId),
        ...(value.hasValuesPicture === 0 ? {} : { hasValuesPicture: value.hasValuesPicture === 1 }),
        ...(value.tableContextId === NONE ? {} : { tableContext: { dataPath: string(value.tableContextId) } }),
        policy: "formDataPath" as const,
      })) as ProjectStateYamlFileUpdate["pendingChecks"]
  }

  function optionalName(id: number): { readonly name?: string } {
    const name = optionalString(id)
    return name === undefined ? {} : { name }
  }

  function optionalField<Key extends string>(key: Key, id: number): { readonly [K in Key]?: string } {
    const value = optionalString(id)
    return value === undefined ? {} : { [key]: value } as { readonly [K in Key]: string }
  }

  function localValidation(fileId: number): ProjectStateLocalValidationResult | undefined {
    if (validationCache.has(fileId)) return validationCache.get(fileId)
    const status = fileRows("validationStatus", fileId)[0]
    if (status === undefined) return undefined
    const result = {
      contributedFacts: status.contributedFacts === 1,
      diagnostics: diagnostics(status.diagnosticsStart, status.diagnosticsCount),
      schemaDiagnostics: diagnostics(status.schemaDiagnosticsStart, status.schemaDiagnosticsCount),
    }
    validationCache.set(fileId, result)
    return result
  }

  function diagnostics(start: number, count: number) {
    const header = ProjectStateDiagnosticSectionHeaderView.decode(new DataView(snapshot.buffers.diagnostics))
    const view = new DataView(snapshot.buffers.diagnostics)
    return Array.from({ length: count }, (_, index) => {
      const value = ProjectStateDiagnosticRecordView.decode(view, header.recordsOffset + (start + index) * ProjectStateDiagnosticRecordView.viewLength)
      return { line: value.line, col: value.col, message: string(value.messageId),
        severity: SEVERITIES[value.severity] as DiagnosticSeverity, source: SOURCES[value.source] as DiagnosticSource,
        ...optionalField("path", value.pathId) }
    })
  }

  function fileUpdate(fileId: number): ProjectStateFileUpdate {
    const record = snapshot.fileRecord(fileId)
    const yamlRole = YAML_ROLES[record.yamlRole]
    const identity: ProjectStateFileIdentity = {
      projectPath: snapshot.filePath(fileId), componentPath: snapshot.componentPath(fileId),
      resourceKind: record.resourceKind === 1 ? "yaml" : "resource",
      ...(yamlRole === undefined ? {} : { yamlRole }),
    }
    if (record.updateKind === 2) return { ...identity, kind: "resource" }
    const facts = yamlFacts(fileId)
    const validation = localValidation(fileId)
    if (facts === undefined || validation === undefined || yamlRole === undefined) throw new Error("Неполное состояние YAML-файла")
    return { ...identity, kind: "yaml", yamlRole, localValidation: validation, ...facts }
  }
}

export function hasTypedProjectStateFacts(snapshot: ProjectStateSnapshotView): boolean {
  try {
    const catalog = snapshot.factTableCatalog()
    return PROJECT_STATE_FACT_TABLE_ORDER.some((kind) => catalog.has(kind)) || snapshot.buffers.facts.byteLength >= 8
  } catch {
    return false
  }
}
