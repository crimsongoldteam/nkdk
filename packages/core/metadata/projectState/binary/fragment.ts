import { xxh3 } from "@node-rs/xxhash"
import type {
  MetadataTargetConstraint,
  ParsedMetadataTarget,
} from "../../ruleRuntime/metadataTarget/types"
import { PROJECT_STATE_FORMAT_VERSION } from "./format"
import { encodeMetadataTargetConstraint } from "./constraintCodec"
import {
  assertProjectStateFactSection,
  openProjectStateFactCatalog,
  PROJECT_STATE_FACT_RECORD_VIEWS,
  PROJECT_STATE_FACT_TABLE_IDS,
  PROJECT_STATE_FACT_TABLE_ORDER,
  type ProjectStateFactTableKind,
  type ProjectStateFactTableRange,
} from "./factTables"
import {
  ProjectStateDiagnosticRecordView,
  ProjectStateDiagnosticSectionHeaderView,
  ProjectStateFactSectionHeaderView,
  ProjectStateFactTableRecordView,
  ProjectStateFragmentFileRecordView,
  ProjectStateFragmentHeaderRecordView,
  ProjectStateFragmentStringRecordView,
  ProjectStateFragmentStringSectionHeaderView,
  type ProjectStateFragmentFileRecord,
} from "./layouts"

export interface ProjectStateFragmentBuffers {
  readonly header: ArrayBuffer
  readonly strings: ArrayBuffer
  readonly files: ArrayBuffer
  readonly facts: ArrayBuffer
  readonly diagnostics: ArrayBuffer
}

export type ProjectStateFragment = Readonly<{ readonly buffers: ProjectStateFragmentBuffers }>

export interface ProjectStateFragmentWriter {
  appendFile(update: ProjectStateFileUpdate, hash: bigint): void
  appendImportIndex(update: ProjectStateImportIndexContribution): void
  appendImportFinal(batch: ProjectStateImportFinalFileStateBatch): void
  finish(): ProjectStateFragment
  discard(): void
}

export interface ProjectStateFragmentView {
  readonly buffers: ProjectStateFragmentBuffers
  readonly fileCount: number
  readonly stringCount: number
  readonly diagnosticCount: number
  fileRecord(fileId: number): ProjectStateFragmentFileRecord
  stringValue(stringId: number): string
  stringHash(stringId: number): bigint
  stringBytes(stringId: number): Uint8Array<ArrayBuffer>
  tableRange(kind: ProjectStateFactTableKind): ProjectStateFactTableRange | undefined
}

const MAGIC_FIRST = 0x4b444b4e
const MAGIC_SECOND = 0x47415246
const NONE = 0xffff_ffff
const MAX_HASH = 0xffff_ffff_ffff_ffffn
const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()
const YAML_ROLE_IDS = { configuration: 1, properties: 2, form: 3 } as const
const REFERENCE_KIND_IDS = { object: 1, member: 2, value: 3 } as const
const FIELD_KIND_IDS = {
  attribute: 1,
  standardAttribute: 2,
  tabularSection: 3,
  dimension: 4,
  resource: 5,
  addressingAttribute: 6,
} as const
const DIAGNOSTIC_SEVERITY_IDS = { error: 1, warning: 2 } as const
const DIAGNOSTIC_SOURCE_IDS = {
  syntax: 1,
  structure: 2,
  "external-file": 3,
  "cross-file": 4,
  reference: 5,
} as const
const STRING_OWNER_FACT_ROLES = new Set([
  "task", "chartOfAccounts", "extDimensionTypes", "registerType",
])
const STRING_LIST_OWNER_FACT_ROLES = new Set([
  "commonAttributeOwnerLinks", "owners", "registerRecords",
])
const NAMED_ITEMS_OWNER_FACT_ROLES = new Set([
  "accountingFlags", "extDimensionAccountingFlags", "attributes", "dimensions", "resources",
  "addressingAttributes", "standardAttributes", "commands",
  "predefined", "enumValues",
])

interface ProjectStateTypeDescription {
  readonly type: readonly string[]
  readonly typeId?: readonly string[]
  readonly stringQualifiers?: {
    readonly length: number
    readonly allowedLength: "Variable" | "Fixed"
  }
  readonly numberQualifiers?: {
    readonly digits: number
    readonly fractionDigits: number
    readonly allowedSign: "Any" | "Nonnegative"
  }
  readonly dateQualifiers?: {
    readonly dateFractions?: "Date" | "Time" | "DateTime"
  }
}

interface OwnerTypeRef {
  readonly kind: string
  readonly name?: string
}

type DataPathTableInfo =
  | { readonly kind: "ValueTable" | "ValueTree" | "ValueList" | "GanttChart" | "DynamicList" }
  | { readonly kind: "RegisterRecordSet"; readonly owner: OwnerTypeRef }
  | { readonly kind: "TabularSection"; readonly owner: OwnerTypeRef; readonly name: string }

interface DataPathTypeInfo {
  readonly kinds: readonly string[]
  readonly nextTypes: readonly OwnerTypeRef[]
  readonly definedTypes?: readonly string[]
  readonly table?: DataPathTableInfo
  readonly isComposite?: boolean
  readonly sourceText?: string
}

interface ProjectStateFileIdentity {
  readonly projectPath: string
  readonly componentPath: string
  readonly resourceKind: "yaml" | "resource"
  readonly yamlRole?: "configuration" | "properties" | "form"
}

interface ProjectStateDiagnostic {
  readonly line: number
  readonly col: number
  readonly message: string
  readonly path?: string
  readonly severity: "error" | "warning"
  readonly source: "syntax" | "structure" | "external-file" | "cross-file" | "reference"
}

interface ProjectStateLocalValidation {
  readonly contributedFacts: boolean
  readonly diagnostics: readonly ProjectStateDiagnostic[]
  readonly schemaDiagnostics: readonly ProjectStateDiagnostic[]
}

interface ProjectStateReferenceEntry {
  readonly kind: "object" | "member" | "value"
  readonly canonical: string
  readonly details?: {
    readonly typeInfo?: Pick<DataPathTypeInfo, "kinds" | "definedTypes" | "sourceText">
    readonly kind?: "attribute" | "standardAttribute"
    readonly styleItemType?: "Color" | "Font" | "Border"
  }
  readonly fileBacked?: {
    readonly itemProjectPath: string
    readonly ownerProjectPath: string
  }
}

interface ProjectStateOwnerFact {
  readonly owner: OwnerTypeRef
  readonly facts: Readonly<Record<string, unknown>>
}

interface ProjectStateFieldEntry {
  readonly owner: OwnerTypeRef
  readonly name: string
  readonly kind: "attribute" | "standardAttribute" | "tabularSection" | "dimension" | "resource" | "addressingAttribute"
  readonly typeInfo: DataPathTypeInfo
  readonly targetName?: string
  readonly sourceCollection?: string
  readonly parentName?: string
  readonly table?: DataPathTableInfo
  readonly tableHasColumns?: boolean
}

type ProjectStateFormEntry =
  | {
      readonly kind: "root"
      readonly owner: OwnerTypeRef
      readonly name: string
      readonly source: {
        readonly typeInfo: DataPathTypeInfo
        readonly table?: DataPathTableInfo
        readonly tableHasColumns?: boolean
      }
    }
  | {
      readonly kind: "additionalColumn"
      readonly owner: OwnerTypeRef
      readonly tablePath: string
      readonly name: string
      readonly source: {
        readonly typeInfo: DataPathTypeInfo
        readonly table?: DataPathTableInfo
        readonly tableHasColumns?: boolean
      }
    }
  | {
      readonly kind: "tabularElement"
      readonly owner: OwnerTypeRef
      readonly name: string
      readonly dataPath?: string
    }

interface ProjectStatePendingReference {
  readonly yamlPath: readonly (string | number)[]
  readonly canonical: string
  readonly target: ParsedMetadataTarget
  readonly constraint: MetadataTargetConstraint
}

type ProjectStatePendingCheck =
  | {
      readonly kind: "dataPath"
      readonly yamlPath: readonly (string | number)[]
      readonly location: { readonly line: number; readonly col: number; readonly path?: string }
      readonly owner: OwnerTypeRef
      readonly value: string
      readonly policyInput: {
        readonly yaml: string
        readonly allowedKinds?: readonly string[]
        readonly allowComposite?: boolean
      }
      readonly elementType?: string
      readonly hasValuesPicture?: boolean
      readonly tableContext?: { readonly dataPath: string }
    }
  | {
      readonly kind: "fillValue"
      readonly yamlPath: readonly (string | number)[]
      readonly location: { readonly line: number; readonly col: number; readonly path?: string }
      readonly itemType: string
      readonly type: unknown
      readonly value: unknown
      readonly tagged: boolean
    }

interface ProjectStateYamlFileUpdate extends ProjectStateFileIdentity {
  readonly kind: "yaml"
  readonly localValidation: ProjectStateLocalValidation
  readonly targets: readonly ProjectStateReferenceEntry[]
  readonly owners: readonly ProjectStateOwnerFact[]
  readonly fields: readonly ProjectStateFieldEntry[]
  readonly forms: readonly ProjectStateFormEntry[]
  readonly pendingReferences: readonly ProjectStatePendingReference[]
  readonly pendingChecks: readonly ProjectStatePendingCheck[]
  readonly dependencies: readonly string[]
}

type ProjectStateFileUpdate =
  | (ProjectStateFileIdentity & { readonly kind: "resource"; readonly targets: readonly ProjectStateReferenceEntry[] })
  | ProjectStateYamlFileUpdate

interface ProjectStateImportIndexContribution extends ProjectStateFileIdentity {
  readonly resourceKind: "yaml"
  readonly yamlRole: "configuration" | "properties" | "form"
  readonly targets: readonly ProjectStateReferenceEntry[]
  readonly owners: readonly ProjectStateOwnerFact[]
  readonly fields: readonly ProjectStateFieldEntry[]
  readonly forms: readonly ProjectStateFormEntry[]
}

type ProjectStateImportFinalFileState =
  | (ProjectStateFileIdentity & {
      readonly kind: "resource"
      readonly resourceKind: "resource"
      readonly targets: readonly ProjectStateReferenceEntry[]
    })
  | (ProjectStateFileIdentity & {
      readonly kind: "yaml"
      readonly resourceKind: "yaml"
      readonly yamlRole: "configuration" | "properties" | "form"
      readonly localValidation: ProjectStateLocalValidation
      readonly pendingReferences: readonly ProjectStatePendingReference[]
      readonly pendingChecks: readonly ProjectStatePendingCheck[]
      readonly dependencies: readonly string[]
    })

interface ProjectStateImportFinalFileStateBatch {
  readonly updates: readonly ProjectStateImportFinalFileState[]
  readonly hashBytes: Uint8Array
}

export function createProjectStateFragmentWriter(options: {
  readonly hashString?: (bytes: Uint8Array) => bigint
} = {}): ProjectStateFragmentWriter {
  const strings = new LocalStringTable(options.hashString ?? xxh3.xxh64)
  let rows = emptyRows()
  let files: ProjectStateFragmentFileRecord[] = []
  let fileIds = new Map<string, number>()
  let diagnostics: Record<string, number>[] = []
  let ownerTypeIds = new Map<string, number>()
  let closed = false

  return {
    appendFile(update, hash) {
      assertOpen()
      appendCompleteFile(update, hash)
    },
    appendImportIndex(update) {
      assertOpen()
      const fileId = appendYamlIdentity(update, 0n)
      appendTargetFacts(update.targets, fileId)
      appendIndexFacts(update, fileId)
    },
    appendImportFinal(batch) {
      assertOpen()
      if (batch.hashBytes.byteLength !== batch.updates.length * 8) {
        throw new Error("Хэши окончательного import не соответствуют файлам")
      }
      const hashes = new DataView(batch.hashBytes.buffer, batch.hashBytes.byteOffset, batch.hashBytes.byteLength)
      batch.updates.forEach((update, index) => {
        const hash = hashes.getBigUint64(index * 8, false)
        if (update.kind === "yaml") {
          const fileId = appendYamlIdentity(update, hash)
          appendValidation(update, fileId)
          appendFinalFacts(update, fileId)
        } else {
          const fileId = appendFileIdentity(update, hash)
          appendTargetFacts(update.targets, fileId)
        }
      })
    },
    finish() {
      assertOpen()
      closed = true
      const packedStrings = strings.finish()
      const stringBuffer = packedStrings.buffer
      const fileBuffer = packFiles(files)
      const factsBuffer = packFacts(rows)
      const diagnosticsBuffer = packDiagnostics(diagnostics)
      const header = new ArrayBuffer(ProjectStateFragmentHeaderRecordView.viewLength)
      ProjectStateFragmentHeaderRecordView.encode({
        magicFirst: MAGIC_FIRST,
        magicSecond: MAGIC_SECOND,
        ...PROJECT_STATE_FORMAT_VERSION,
        reserved16: 0,
        fileCount: files.length,
        stringCount: packedStrings.count,
        stringsByteLength: stringBuffer.byteLength,
        filesByteLength: fileBuffer.byteLength,
        factsByteLength: factsBuffer.byteLength,
        diagnosticsByteLength: diagnosticsBuffer.byteLength,
      }, new DataView(header))
      release()
      return { buffers: { header, strings: stringBuffer, files: fileBuffer, facts: factsBuffer, diagnostics: diagnosticsBuffer } }
    },
    discard() {
      if (closed) return
      closed = true
      release()
    },
  }

  function appendCompleteFile(update: ProjectStateFileUpdate, hash: bigint): void {
    const fileId = appendFileIdentity(update, hash)
    appendTargetFacts(update.targets, fileId)
    if (update.kind !== "yaml") return
    appendValidation(update, fileId)
    appendIndexFacts(update, fileId)
    appendFinalFacts(update, fileId)
  }

  function appendYamlIdentity(
    update: Pick<ProjectStateImportIndexContribution, "projectPath" | "componentPath" | "resourceKind" | "yamlRole">,
    hash: bigint,
  ): number {
    return appendFileIdentity({ ...update, kind: "yaml" }, hash)
  }

  function appendFileIdentity(
    update: Pick<ProjectStateFileUpdate, "projectPath" | "componentPath" | "resourceKind" | "yamlRole" | "kind">,
    hash: bigint,
  ): number {
    if (hash < 0n || hash > MAX_HASH) throw new Error("Хэш файла вне диапазона uint64")
    const record = {
      projectPathId: strings.intern(update.projectPath),
      componentPathId: strings.intern(update.componentPath),
      hash,
      resourceKind: update.resourceKind === "yaml" ? 1 : 2,
      yamlRole: update.yamlRole === undefined ? 0 : YAML_ROLE_IDS[update.yamlRole],
      updateKind: update.kind === "yaml" ? 1 : 2,
      reserved: 0,
    }
    const existing = fileIds.get(update.projectPath)
    if (existing !== undefined) {
      const previous = files[existing]!
      if (previous.componentPathId !== record.componentPathId || previous.resourceKind !== record.resourceKind
        || previous.yamlRole !== record.yamlRole || previous.updateKind !== record.updateKind) {
        throw new Error(`Нельзя менять identity файла ${update.projectPath}`)
      }
      files[existing] = record
      return existing
    }
    const fileId = files.length
    files.push(record)
    fileIds.set(update.projectPath, fileId)
    return fileId
  }

  function appendValidation(
    update: Pick<ProjectStateYamlFileUpdate, "localValidation">,
    fileId: number,
  ): void {
    const diagnosticsStart = diagnostics.length
    update.localValidation.diagnostics.forEach((diagnostic) => appendDiagnostic(fileId, diagnostic))
    const schemaDiagnosticsStart = diagnostics.length
    update.localValidation.schemaDiagnostics.forEach((diagnostic) => appendDiagnostic(fileId, diagnostic))
    rows.validationStatus.push({
      sourceFileId: fileId,
      contributedFacts: update.localValidation.contributedFacts ? 1 : 0,
      reserved8: 0,
      reserved16: 0,
      diagnosticsStart,
      diagnosticsCount: schemaDiagnosticsStart - diagnosticsStart,
      schemaDiagnosticsStart,
      schemaDiagnosticsCount: diagnostics.length - schemaDiagnosticsStart,
    })
  }

  function appendDiagnostic(fileId: number, diagnostic: ProjectStateYamlFileUpdate["localValidation"]["diagnostics"][number]): void {
    diagnostics.push({
      sourceFileId: fileId,
      line: diagnostic.line,
      col: diagnostic.col,
      messageId: strings.intern(diagnostic.message),
      pathId: optionalString(diagnostic.path),
      severity: DIAGNOSTIC_SEVERITY_IDS[diagnostic.severity],
      source: DIAGNOSTIC_SOURCE_IDS[diagnostic.source],
      reserved: 0,
    })
  }

  function appendIndexFacts(
    update: Pick<ProjectStateImportIndexContribution, "owners" | "fields" | "forms">,
    fileId: number,
  ): void {
    for (const entry of update.owners) {
      const ownerId = appendOwnerType(entry.owner)
      const factsStart = rows.ownerFacts.length
      for (const [role, value] of Object.entries(entry.facts)) appendOwnerFact(ownerId, role, value)
      rows.owners.push({
        sourceFileId: fileId,
        kindId: strings.intern(entry.owner.kind),
        nameId: optionalString(entry.owner.name),
        factsStart,
        factsCount: rows.ownerFacts.length - factsStart,
      })
    }
    for (const field of update.fields) {
      rows.fields.push({
        sourceFileId: fileId,
        ownerId: appendOwnerType(field.owner),
        nameId: strings.intern(field.name),
        targetNameId: optionalString(field.targetName),
        sourceCollectionId: optionalString(field.sourceCollection),
        parentNameId: optionalString(field.parentName),
        typeInfoId: appendTypeInfo(field.typeInfo),
        tableInfoId: field.table === undefined ? NONE : appendTableInfo(field.table),
        kind: FIELD_KIND_IDS[field.kind],
        tableHasColumns: booleanFlag(field.tableHasColumns),
        reserved: 0,
      })
    }
    appendForms(update.forms, fileId)
  }

  function appendTargetFacts(targets: ProjectStateFileUpdate["targets"], fileId: number): void {
    for (const reference of targets) {
      const detailsId = reference.details === undefined ? NONE : rows.referenceDetails.length
      if (reference.details !== undefined) {
        rows.referenceDetails.push({
          typeInfoId: reference.details.typeInfo === undefined ? NONE : appendTypeInfo({
            kinds: reference.details.typeInfo.kinds,
            nextTypes: [],
            definedTypes: reference.details.typeInfo.definedTypes,
            sourceText: reference.details.typeInfo.sourceText,
          }),
          sourceTextId: optionalString(reference.details.typeInfo?.sourceText),
          kind: reference.details.kind === "attribute" ? 1 : reference.details.kind === "standardAttribute" ? 2 : 0,
          styleItemType: reference.details.styleItemType === "Color" ? 1 : reference.details.styleItemType === "Font" ? 2
            : reference.details.styleItemType === "Border" ? 3 : 0,
          reserved: 0,
        })
      }
      rows.targets.push({
        sourceFileId: fileId,
        canonicalId: strings.intern(reference.canonical),
        detailsId,
        itemProjectPathId: optionalString(reference.fileBacked?.itemProjectPath),
        ownerProjectPathId: optionalString(reference.fileBacked?.ownerProjectPath),
        kind: REFERENCE_KIND_IDS[reference.kind],
        reserved8: 0,
        reserved16: 0,
      })
    }
  }

  function appendForms(forms: ProjectStateImportIndexContribution["forms"], fileId: number): void {
    for (const form of forms) {
      if (form.kind === "tabularElement") {
        rows.formColumns.push({
          sourceFileId: fileId,
          ownerTypeId: appendOwnerType(form.owner),
          nameId: strings.intern(form.name),
          tablePathId: strings.intern(form.dataPath ?? ""),
          typeInfoId: NONE,
          tableInfoId: NONE,
          kind: 3,
          tableHasColumns: 0,
          reserved: 0,
        })
        continue
      }
      const source = form.source
      rows[form.kind === "root" ? "forms" : "formColumns"].push({
        sourceFileId: fileId,
        ownerTypeId: appendOwnerType(form.owner),
        nameId: strings.intern(form.name),
        tablePathId: form.kind === "additionalColumn" ? strings.intern(form.tablePath) : NONE,
        typeInfoId: appendTypeInfo(source.typeInfo),
        tableInfoId: "table" in source && source.table !== undefined ? appendTableInfo(source.table) : NONE,
        kind: form.kind === "root" ? 1 : 2,
        tableHasColumns: "tableHasColumns" in source ? booleanFlag(source.tableHasColumns) : 0,
        reserved: 0,
      })
    }
  }

  function appendFinalFacts(
    update: Pick<ProjectStateYamlFileUpdate, "pendingReferences" | "pendingChecks" | "dependencies">,
    fileId: number,
  ): void {
    for (const reference of update.pendingReferences) {
      const target = reference.target
      const targetMember = target.kind === "member" ? target.segments.at(-1)?.name
        : target.kind === "value" && "valueName" in target ? target.valueName : undefined
      rows.pendingReferences.push({
        sourceFileId: fileId,
        yamlPathId: appendYamlPath(reference.yamlPath),
        canonicalId: strings.intern(reference.canonical),
        targetKindId: strings.intern(target.kind),
        targetRootId: strings.intern(target.root),
        targetNameId: strings.intern(target.objectName),
        targetMemberId: optionalString(targetMember),
        constraintKindId: strings.intern(encodeMetadataTargetConstraint(reference.constraint)),
      })
    }
    for (const check of update.pendingChecks) {
      if (check.kind === "fillValue") {
        rows.pendingChecks.push({
          sourceFileId: fileId,
          yamlPathId: appendYamlPath(check.yamlPath),
          kindId: strings.intern("fillValue"),
          payloadId: strings.intern(JSON.stringify({
            version: 1,
            itemType: check.itemType,
            type: check.type,
            value: check.value,
            tagged: check.tagged,
          })),
          line: check.location.line,
          col: check.location.col,
          pathId: optionalString(check.location.path),
          ownerTypeId: NONE,
          valueId: NONE,
          policyYamlId: NONE,
          allowedKindsStart: rows.allowedKinds.length,
          allowedKindsCount: 0,
          elementTypeId: NONE,
          tableContextId: NONE,
          allowComposite: 0,
          hasValuesPicture: 0,
          reserved: 0,
        })
        continue
      }
      const allowedKindsStart = rows.allowedKinds.length
      for (const kind of check.policyInput.allowedKinds ?? []) {
        rows.allowedKinds.push({ valueId: strings.intern(kind) })
      }
      rows.pendingChecks.push({
        sourceFileId: fileId,
        yamlPathId: appendYamlPath(check.yamlPath),
        kindId: strings.intern("dataPath"),
        payloadId: NONE,
        line: check.location.line,
        col: check.location.col,
        pathId: optionalString(check.location.path),
        ownerTypeId: appendOwnerType(check.owner),
        valueId: strings.intern(check.value),
        policyYamlId: strings.intern(check.policyInput.yaml),
        allowedKindsStart,
        allowedKindsCount: rows.allowedKinds.length - allowedKindsStart,
        elementTypeId: optionalString(check.elementType),
        tableContextId: optionalString(check.tableContext?.dataPath),
        allowComposite: booleanFlag(check.policyInput.allowComposite),
        hasValuesPicture: booleanFlag(check.hasValuesPicture),
        reserved: 0,
      })
    }
    for (const dependency of update.dependencies) {
      rows.dependencies.push({ sourceFileId: fileId, projectPathId: strings.intern(dependency) })
    }
  }

  function appendOwnerFact(ownerId: number, role: string, value: unknown): void {
    if (STRING_OWNER_FACT_ROLES.has(role) && typeof value === "string") {
      rows.ownerFacts.push({
        ownerId, roleId: strings.intern(role), valueKind: 1, reserved: 0,
        valueId: strings.intern(value), itemsStart: 0, itemsCount: 0,
      })
      return
    }
    if (STRING_LIST_OWNER_FACT_ROLES.has(role) && Array.isArray(value) && value.every((item) => typeof item === "string")) {
      const itemsStart = rows.definedTypes.length
      value.forEach((item) => rows.definedTypes.push({ valueId: strings.intern(item) }))
      rows.ownerFacts.push({
        ownerId, roleId: strings.intern(role), valueKind: 2, reserved: 0,
        valueId: NONE, itemsStart, itemsCount: value.length,
      })
      return
    }
    if (role === "type" && isTypeDescription(value)) {
      rows.ownerFacts.push({
        ownerId, roleId: strings.intern(role), valueKind: 3, reserved: 0,
        valueId: appendTypeDescription(value), itemsStart: 0, itemsCount: 0,
      })
      return
    }
    if (NAMED_ITEMS_OWNER_FACT_ROLES.has(role) && isNamedTypeItems(value)) {
      const ownerFactId = rows.ownerFacts.length
      const itemsStart = rows.ownerFactItems.length
      value.forEach((item) => appendOwnerFactItem(ownerFactId, NONE, item, 1))
      rows.ownerFacts.push({
        ownerId, roleId: strings.intern(role), valueKind: 4, reserved: 0,
        valueId: NONE, itemsStart, itemsCount: rows.ownerFactItems.length - itemsStart,
      })
      return
    }
    if (role === "tabularSections" && isTabularSections(value)) {
      const ownerFactId = rows.ownerFacts.length
      const itemsStart = rows.ownerFactItems.length
      for (const section of value) {
        const sectionId = appendOwnerFactItem(ownerFactId, NONE, section, 2)
        section.attributes.forEach((item) => appendOwnerFactItem(ownerFactId, sectionId, item, 3))
        section.standardAttributes?.forEach((item) => appendOwnerFactItem(ownerFactId, sectionId, item, 4))
      }
      rows.ownerFacts.push({
        ownerId, roleId: strings.intern(role), valueKind: 5, reserved: 0,
        valueId: NONE, itemsStart, itemsCount: rows.ownerFactItems.length - itemsStart,
      })
      return
    }
    throw new Error(`Неподдерживаемый тип owner fact ${role}`)
  }

  function appendOwnerFactItem(
    ownerFactId: number,
    parentItemId: number,
    item: { readonly name: string; readonly type?: ProjectStateTypeDescription },
    kind: number,
  ): number {
    const id = rows.ownerFactItems.length
    rows.ownerFactItems.push({
      ownerFactId,
      parentItemId,
      nameId: strings.intern(item.name),
      typeDescriptionId: item.type === undefined ? NONE : appendTypeDescription(item.type),
      kind,
      reserved8: 0,
      reserved16: 0,
    })
    return id
  }

  function appendTypeDescription(type: ProjectStateTypeDescription): number {
    const typesStart = rows.typeDescriptionValues.length
    type.type.forEach((value) => rows.typeDescriptionValues.push({ valueId: strings.intern(value) }))
    const typeIdsStart = rows.typeDescriptionValues.length
    type.typeId?.forEach((value) => rows.typeDescriptionValues.push({ valueId: strings.intern(value) }))
    const id = rows.typeDescriptions.length
    rows.typeDescriptions.push({
      typesStart,
      typesCount: type.type.length,
      typeIdsStart,
      typeIdsCount: type.typeId?.length ?? 0,
      stringLength: type.stringQualifiers?.length ?? NONE,
      digits: type.numberQualifiers?.digits ?? NONE,
      fractionDigits: type.numberQualifiers?.fractionDigits ?? NONE,
      allowedLength: type.stringQualifiers?.allowedLength === "Variable" ? 1
        : type.stringQualifiers?.allowedLength === "Fixed" ? 2 : 0,
      allowedSign: type.numberQualifiers?.allowedSign === "Any" ? 1
        : type.numberQualifiers?.allowedSign === "Nonnegative" ? 2 : 0,
      dateFractions: type.dateQualifiers?.dateFractions === "Date" ? 1
        : type.dateQualifiers?.dateFractions === "Time" ? 2
          : type.dateQualifiers?.dateFractions === "DateTime" ? 3 : 0,
      reserved: 0,
    })
    return id
  }

  function appendTypeInfo(typeInfo: Pick<DataPathTypeInfo, "nextTypes" | "definedTypes" | "table" | "isComposite" | "sourceText"> & {
    readonly kinds: readonly string[]
  }): number {
    const kindsStart = rows.typeKinds.length
    typeInfo.kinds.forEach((kind) => rows.typeKinds.push({ valueId: strings.intern(kind) }))
    const nextTypesStart = rows.ownerTypes.length
    typeInfo.nextTypes.forEach((owner) => appendOwnerType(owner, false))
    const definedTypesStart = rows.definedTypes.length
    typeInfo.definedTypes?.forEach((value) => rows.definedTypes.push({ valueId: strings.intern(value) }))
    const id = rows.typeInfo.length
    rows.typeInfo.push({
      kindsStart,
      kindsCount: rows.typeKinds.length - kindsStart,
      nextTypesStart,
      nextTypesCount: rows.ownerTypes.length - nextTypesStart,
      definedTypesStart,
      definedTypesCount: rows.definedTypes.length - definedTypesStart,
      tableInfoId: typeInfo.table === undefined ? NONE : appendTableInfo(typeInfo.table),
      sourceTextId: optionalString(typeInfo.sourceText),
      isComposite: booleanFlag(typeInfo.isComposite),
      reserved8: 0,
      reserved16: 0,
    })
    return id
  }

  function appendOwnerType(owner: OwnerTypeRef, deduplicate = true): number {
    const key = `${owner.kind}\u0000${owner.name ?? ""}`
    const existing = deduplicate ? ownerTypeIds.get(key) : undefined
    if (existing !== undefined) return existing
    const id = rows.ownerTypes.length
    rows.ownerTypes.push({ kindId: strings.intern(owner.kind), nameId: optionalString(owner.name) })
    if (deduplicate) ownerTypeIds.set(key, id)
    return id
  }

  function appendTableInfo(table: DataPathTableInfo): number {
    const owner = "owner" in table ? table.owner : undefined
    const name = "name" in table ? table.name : undefined
    const kinds: Record<DataPathTableInfo["kind"], number> = {
      ValueTable: 1, ValueTree: 2, ValueList: 3, GanttChart: 4, DynamicList: 5,
      RegisterRecordSet: 6, TabularSection: 7,
    }
    const id = rows.tableInfo.length
    rows.tableInfo.push({
      ownerTypeId: owner === undefined ? NONE : appendOwnerType(owner),
      nameId: optionalString(name),
      kind: kinds[table.kind],
      reserved8: 0,
      reserved16: 0,
    })
    return id
  }

  function appendYamlPath(path: readonly (string | number)[]): number {
    const segmentsStart = rows.yamlPathSegments.length
    for (const segment of path) {
      rows.yamlPathSegments.push(typeof segment === "string"
        ? { stringId: strings.intern(segment), numericValue: 0, kind: 1, reserved8: 0, reserved16: 0 }
        : { stringId: NONE, numericValue: segment, kind: 2, reserved8: 0, reserved16: 0 })
    }
    const id = rows.yamlPaths.length
    rows.yamlPaths.push({ segmentsStart, segmentsCount: path.length })
    return id
  }

  function optionalString(value: string | undefined): number {
    return value === undefined ? NONE : strings.intern(value)
  }

  function assertOpen(): void {
    if (closed) throw new Error("Двоичный фрагмент уже завершён")
  }

  function release(): void {
    files = []
    fileIds = new Map()
    diagnostics = []
    rows = emptyRows()
    ownerTypeIds = new Map()
  }
}

export function openProjectStateFragment(fragment: ProjectStateFragment): ProjectStateFragmentView {
  assertFragmentBoundary(fragment)
  const { buffers } = fragment
  if (buffers.header.byteLength !== ProjectStateFragmentHeaderRecordView.viewLength) {
    throw new Error("Неверный размер заголовка двоичного фрагмента")
  }
  const header = ProjectStateFragmentHeaderRecordView.decode(new DataView(buffers.header))
  if (header.magicFirst !== MAGIC_FIRST || header.magicSecond !== MAGIC_SECOND) {
    throw new Error("Неверная сигнатура двоичного фрагмента")
  }
  if (
    header.major !== PROJECT_STATE_FORMAT_VERSION.major ||
    header.minor !== PROJECT_STATE_FORMAT_VERSION.minor ||
    header.patch !== PROJECT_STATE_FORMAT_VERSION.patch
  ) throw new Error("Несовместимая версия двоичного фрагмента")
  if (
    header.stringsByteLength !== buffers.strings.byteLength ||
    header.filesByteLength !== buffers.files.byteLength ||
    header.factsByteLength !== buffers.facts.byteLength ||
    header.diagnosticsByteLength !== buffers.diagnostics.byteLength
  ) throw new Error("Размеры двоичного фрагмента не соответствуют заголовку")

  const strings = openStrings(buffers.strings, header.stringCount)
  const expectedFileBytes = header.fileCount * ProjectStateFragmentFileRecordView.viewLength
  if (buffers.files.byteLength !== expectedFileBytes) throw new Error("Раздел файлов двоичного фрагмента повреждён")
  const filesView = new DataView(buffers.files)
  for (let fileId = 0; fileId < header.fileCount; fileId += 1) {
    const record = ProjectStateFragmentFileRecordView.decode(
      filesView,
      fileId * ProjectStateFragmentFileRecordView.viewLength,
    )
    if (record.projectPathId >= strings.count || record.componentPathId >= strings.count) {
      throw new Error("Файл фрагмента ссылается на неизвестную строку")
    }
    if (record.updateKind < 1 || record.updateKind > 2 || record.resourceKind < 1 || record.resourceKind > 2) {
      throw new Error("Файл фрагмента имеет неизвестный вид")
    }
  }
  assertProjectStateFactSection({
    facts: buffers.facts,
    diagnostics: buffers.diagnostics,
    fileCount: header.fileCount,
    stringCount: header.stringCount,
  })
  const factTables = openProjectStateFactCatalog(buffers.facts)
  const diagnosticHeader = ProjectStateDiagnosticSectionHeaderView.decode(new DataView(buffers.diagnostics))

  return {
    buffers,
    fileCount: header.fileCount,
    stringCount: header.stringCount,
    diagnosticCount: diagnosticHeader.count,
    fileRecord(fileId) {
      assertIndex(fileId, header.fileCount, "файл")
      return ProjectStateFragmentFileRecordView.decode(
        filesView,
        fileId * ProjectStateFragmentFileRecordView.viewLength,
      )
    },
    stringValue(stringId) {
      return textDecoder.decode(readStringRecord(strings, stringId).bytes)
    },
    stringHash(stringId) {
      return readStringRecord(strings, stringId).hash
    },
    stringBytes(stringId) {
      return readStringRecord(strings, stringId).bytes
    },
    tableRange(kind) {
      return factTables.get(kind)
    },
  }
}

class LocalStringTable {
  readonly #ids = new Map<string, number>()
  readonly #entries: { readonly bytes: Uint8Array; readonly hash: bigint }[] = []

  constructor(private readonly hash: (bytes: Uint8Array) => bigint) {}

  get count(): number {
    return this.#entries.length
  }

  intern(value: string): number {
    const existing = this.#ids.get(value)
    if (existing !== undefined) return existing
    const bytes = textEncoder.encode(value)
    const id = this.#entries.length
    this.#entries.push({ bytes, hash: this.hash(bytes) })
    this.#ids.set(value, id)
    return id
  }

  finish(): { readonly buffer: ArrayBuffer; readonly count: number } {
    const count = this.count
    const recordsOffset = ProjectStateFragmentStringSectionHeaderView.viewLength
    const utf8Offset = recordsOffset + count * ProjectStateFragmentStringRecordView.viewLength
    const utf8ByteLength = this.#entries.reduce((sum, entry) => sum + entry.bytes.byteLength, 0)
    const buffer = new ArrayBuffer(utf8Offset + utf8ByteLength)
    const view = new DataView(buffer)
    const bytes = new Uint8Array(buffer)
    ProjectStateFragmentStringSectionHeaderView.encode({ count, recordsOffset, utf8Offset, utf8ByteLength }, view)
    let offset = 0
    this.#entries.forEach((entry, id) => {
      ProjectStateFragmentStringRecordView.encode(
        { offset, byteLength: entry.bytes.byteLength, hash: entry.hash },
        view,
        recordsOffset + id * ProjectStateFragmentStringRecordView.viewLength,
      )
      bytes.set(entry.bytes, utf8Offset + offset)
      offset += entry.bytes.byteLength
    })
    this.#ids.clear()
    this.#entries.splice(0)
    return { buffer, count }
  }
}

function emptyRows(): Record<ProjectStateFactTableKind, Record<string, number>[]> {
  return {
    validationStatus: [], targets: [], referenceDetails: [], pendingReferences: [],
    owners: [], ownerFacts: [], ownerFactItems: [], fields: [], typeInfo: [], typeKinds: [], definedTypes: [],
    ownerTypes: [], tableInfo: [], forms: [], formColumns: [], pendingChecks: [],
    allowedKinds: [], dependencies: [], yamlPaths: [], yamlPathSegments: [],
    typeDescriptions: [], typeDescriptionValues: [],
  }
}

function packFiles(files: readonly ProjectStateFragmentFileRecord[]): ArrayBuffer {
  const buffer = new ArrayBuffer(files.length * ProjectStateFragmentFileRecordView.viewLength)
  const view = new DataView(buffer)
  files.forEach((file, index) => {
    ProjectStateFragmentFileRecordView.encode(file, view, index * ProjectStateFragmentFileRecordView.viewLength)
  })
  return buffer
}

function packFacts(rows: Readonly<Record<ProjectStateFactTableKind, readonly Record<string, number>[]>>): ArrayBuffer {
  const populatedKinds = PROJECT_STATE_FACT_TABLE_ORDER.filter((kind) => rows[kind].length > 0)
  const catalogOffset = ProjectStateFactSectionHeaderView.viewLength
  let offset = catalogOffset + populatedKinds.length * ProjectStateFactTableRecordView.viewLength
  const tableOffsets = new Map<ProjectStateFactTableKind, number>()
  for (const kind of populatedKinds) {
    tableOffsets.set(kind, offset)
    offset += rows[kind].length * PROJECT_STATE_FACT_RECORD_VIEWS[kind].viewLength
  }
  const buffer = new ArrayBuffer(offset)
  const view = new DataView(buffer)
  ProjectStateFactSectionHeaderView.encode({ tableCount: populatedKinds.length, catalogOffset }, view)
  populatedKinds.forEach((kind, index) => {
    const recordView = PROJECT_STATE_FACT_RECORD_VIEWS[kind]
    const tableOffset = tableOffsets.get(kind)!
    ProjectStateFactTableRecordView.encode({
      kind: PROJECT_STATE_FACT_TABLE_IDS[kind],
      reserved: 0,
      offset: tableOffset,
      records: rows[kind].length,
      recordByteLength: recordView.viewLength,
    }, view, catalogOffset + index * ProjectStateFactTableRecordView.viewLength)
    rows[kind].forEach((row, rowIndex) => {
      recordView.encode(row as never, view, tableOffset + rowIndex * recordView.viewLength)
    })
  })
  return buffer
}

function packDiagnostics(rows: readonly Record<string, number>[]): ArrayBuffer {
  const recordsOffset = ProjectStateDiagnosticSectionHeaderView.viewLength
  const buffer = new ArrayBuffer(recordsOffset + rows.length * ProjectStateDiagnosticRecordView.viewLength)
  const view = new DataView(buffer)
  ProjectStateDiagnosticSectionHeaderView.encode({ count: rows.length, recordsOffset }, view)
  rows.forEach((row, index) => {
    ProjectStateDiagnosticRecordView.encode(
      row as never,
      view,
      recordsOffset + index * ProjectStateDiagnosticRecordView.viewLength,
    )
  })
  return buffer
}

function openStrings(buffer: ArrayBuffer, expectedCount: number) {
  if (buffer.byteLength < ProjectStateFragmentStringSectionHeaderView.viewLength) {
    throw new Error("Таблица строк фрагмента оборвана")
  }
  const view = new DataView(buffer)
  const header = ProjectStateFragmentStringSectionHeaderView.decode(view)
  const expectedUtf8Offset = header.recordsOffset + header.count * ProjectStateFragmentStringRecordView.viewLength
  if (
    header.count !== expectedCount ||
    header.recordsOffset !== ProjectStateFragmentStringSectionHeaderView.viewLength ||
    header.utf8Offset !== expectedUtf8Offset ||
    header.utf8Offset + header.utf8ByteLength !== buffer.byteLength
  ) throw new Error("Таблица строк фрагмента повреждена")
  let previousEnd = 0
  for (let id = 0; id < header.count; id += 1) {
    const record = ProjectStateFragmentStringRecordView.decode(
      view,
      header.recordsOffset + id * ProjectStateFragmentStringRecordView.viewLength,
    )
    if (record.offset !== previousEnd || record.offset + record.byteLength > header.utf8ByteLength) {
      throw new Error("Строка фрагмента выходит за UTF-8 данные")
    }
    previousEnd += record.byteLength
  }
  if (previousEnd !== header.utf8ByteLength) throw new Error("UTF-8 данные фрагмента содержат лишние байты")
  return { buffer, view, ...header }
}

function readStringRecord(strings: ReturnType<typeof openStrings>, stringId: number) {
  assertIndex(stringId, strings.count, "строку")
  const record = ProjectStateFragmentStringRecordView.decode(
    strings.view,
    strings.recordsOffset + stringId * ProjectStateFragmentStringRecordView.viewLength,
  )
  return {
    hash: record.hash,
    bytes: new Uint8Array(strings.buffer, strings.utf8Offset + record.offset, record.byteLength),
  }
}

function assertFragmentBoundary(value: unknown): asserts value is ProjectStateFragment {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Двоичный фрагмент должен быть объектом")
  }
  const fragment = value as Record<string, unknown>
  if (Object.keys(fragment).length !== 1 || typeof fragment["buffers"] !== "object" || fragment["buffers"] === null) {
    throw new Error("Двоичный фрагмент должен содержать только buffers")
  }
  const buffers = fragment["buffers"] as Record<string, unknown>
  const names = ["header", "strings", "files", "facts", "diagnostics"] as const
  if (Object.keys(buffers).length !== names.length) throw new Error("Неверный набор буферов фрагмента")
  for (const name of names) {
    if (!(buffers[name] instanceof ArrayBuffer)) throw new Error(`Буфер ${name} должен быть переносимым ArrayBuffer`)
  }
}

function booleanFlag(value: boolean | undefined): number {
  return value === undefined ? 0 : value ? 1 : 2
}

function isTypeDescription(value: unknown): value is ProjectStateTypeDescription {
  return typeof value === "object" && value !== null && Array.isArray((value as { type?: unknown }).type)
}

function isNamedTypeItems(value: unknown): value is Array<{ name: string; type?: ProjectStateTypeDescription }> {
  return Array.isArray(value) && value.every((item) => {
    if (typeof item !== "object" || item === null) return false
    const record = item as Record<string, unknown>
    return typeof record["name"] === "string" && !("attributes" in record)
      && (record["type"] === undefined || isTypeDescription(record["type"]))
  })
}

function isTabularSections(value: unknown): value is Array<{
  name: string
  attributes: Array<{ name: string; type?: ProjectStateTypeDescription }>
  standardAttributes?: Array<{ name: string; type?: ProjectStateTypeDescription }>
}> {
  return Array.isArray(value) && value.every((item) => {
    if (typeof item !== "object" || item === null) return false
    const record = item as Record<string, unknown>
    return typeof record["name"] === "string"
      && isNamedTypeItems(record["attributes"])
      && (record["standardAttributes"] === undefined || isNamedTypeItems(record["standardAttributes"]))
  })
}

function assertIndex(index: number, count: number, label: string): void {
  if (!Number.isSafeInteger(index) || index < 0 || index >= count) {
    throw new Error(`Неизвестная ${label} двоичного фрагмента: ${index}`)
  }
}
