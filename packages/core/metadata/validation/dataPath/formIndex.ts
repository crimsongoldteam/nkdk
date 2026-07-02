import type { ParsedYaml } from "~/yaml/parseMetadataYaml"
import type { ClientApplicationForm } from "~/metadata/forms/clientApplicationForm/types"
import type { FormAttribute, FormAttributeColumn } from "~/metadata/forms/commonObjects/formAttribute/types"
import { matchRegisteredFormPlatformSource } from "../formValidationRegistry"
import type { Diagnostic } from "../types"
import { diagnosticAtYamlPath } from "../yamlLocations"
import { typeDescriptionToDataPathTypeInfo } from "./typeDescription"
import type {
  FormDataPathAdditionalColumnsByTablePath,
  DataPathTableInfo,
  DataPathTypeInfo,
  FormDataPathColumnSource,
  FormDataPathSource,
} from "./types"

export interface FormDataPathIndex {
  roots: Map<string, FormDataPathSource>
  additionalColumnsByTablePath: FormDataPathAdditionalColumnsByTablePath
  duplicateDiagnostics: Diagnostic[]
  getRoot(name: string): FormDataPathSource | undefined
}

export interface BuildFormDataPathIndexParams {
  filePath: string
  parsed: ParsedYaml
  form: ClientApplicationForm
}

export interface KnownPlatformFormSource {
  kind: "platformSource"
  path: string
  matchedSource: string
  match: "exact" | "prefix"
}

export function buildFormDataPathIndex({ filePath, parsed, form }: BuildFormDataPathIndexParams): FormDataPathIndex {
  const roots = new Map<string, FormDataPathSource>()
  const additionalColumnsByTablePath: FormDataPathAdditionalColumnsByTablePath = new Map()
  const duplicateDiagnostics: Diagnostic[] = []
  const seenNames = new Map<string, number>()

  for (const attribute of form.attributes ?? []) {
    const name = attribute.name
    const occurrence = (seenNames.get(name) ?? 0) + 1
    seenNames.set(name, occurrence)

    if (roots.has(name)) {
      duplicateDiagnostics.push(duplicateRootDiagnostic({ filePath, parsed, name, occurrence }))
      continue
    }

    roots.set(name, formAttributeToSource(attribute))
    addAdditionalColumns({ additionalColumnsByTablePath, attribute })
  }

  return {
    roots,
    additionalColumnsByTablePath,
    duplicateDiagnostics,
    getRoot(name: string): FormDataPathSource | undefined {
      return roots.get(name)
    },
  }
}

export function getKnownPlatformFormSource(path: string): KnownPlatformFormSource | undefined {
  return matchRegisteredFormPlatformSource(path)
}

function formAttributeToSource(attribute: FormAttribute): FormDataPathSource {
  const typeInfo = attribute.dynamicList
    ? dynamicListTypeInfo()
    : typeDescriptionToDataPathTypeInfo(attribute.type)
  const tableSource = tableSourceFromAttribute(attribute, typeInfo)

  return {
    kind: "formAttribute",
    name: attribute.name,
    typeInfo,
    ...(tableSource !== undefined ? { tableSource } : {}),
  }
}

function tableSourceFromAttribute(
  attribute: FormAttribute,
  typeInfo: DataPathTypeInfo,
): FormDataPathSource["tableSource"] {
  if (typeInfo.table === undefined) return undefined
  const columns = tableColumns(attribute, typeInfo.table)

  return {
    table: typeInfo.table,
    columns: columnsToMap(columns),
    hasColumns:
      columns.length > 0 ||
      typeInfo.table.kind === "ValueList" ||
      typeInfo.table.kind === "GanttChart" ||
      typeInfo.table.kind === "RegisterRecordSet",
  }
}

function tableColumns(attribute: FormAttribute, table: DataPathTableInfo): FormAttributeColumn[] {
  if (table.kind !== "ValueTable" && table.kind !== "ValueTree" && table.kind !== "RegisterRecordSet") return []
  return attribute.columns ?? []
}

function columnsToMap(columns: readonly FormAttributeColumn[]): Map<string, FormDataPathColumnSource> {
  const result = new Map<string, FormDataPathColumnSource>()
  for (const column of columns) {
    result.set(column.name, {
      name: column.name,
      typeInfo: typeDescriptionToDataPathTypeInfo(column.type),
    })
  }
  return result
}

function addAdditionalColumns(params: {
  additionalColumnsByTablePath: FormDataPathAdditionalColumnsByTablePath
  attribute: FormAttribute
}): void {
  for (const additionalColumnGroup of params.attribute.additionalColumns ?? []) {
    params.additionalColumnsByTablePath.set(
      normalizeIndexedPath(additionalColumnGroup.table),
      columnsToMap(additionalColumnGroup.columns),
    )
  }
}

function normalizeIndexedPath(path: string): string {
  return path.split(".").map(segmentLookupName).join(".")
}

function segmentLookupName(segment: string): string {
  const match = /^(?<name>.+)\[(?<index>\d+)\]$/.exec(segment)
  return match?.groups?.name ?? segment
}

function dynamicListTypeInfo(): DataPathTypeInfo {
  return {
    kinds: ["dynamicList", "tableSource"],
    nextTypes: [],
    table: { kind: "DynamicList" },
    sourceText: "DynamicList",
  }
}

function duplicateRootDiagnostic(params: {
  filePath: string
  parsed: ParsedYaml
  name: string
  occurrence: number
}): Diagnostic {
  const diagnostic = diagnosticAtYamlPath({
    filePath: params.filePath,
    parsed: params.parsed,
    path: ["Реквизиты", params.name],
    severity: "error",
    source: "structure",
    message: `Дублируется реквизит формы "${params.name}"`,
  })
  const position = findRequisitesKeyOccurrence(params.parsed, params.name, params.occurrence)
  return position === undefined ? diagnostic : { ...diagnostic, ...position }
}

function findRequisitesKeyOccurrence(
  parsed: ParsedYaml,
  name: string,
  occurrence: number,
): { line: number; col: number } | undefined {
  return parsed.locations.keyOccurrences(["Реквизиты", name])[occurrence - 1]
}
