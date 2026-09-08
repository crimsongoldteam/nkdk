import type { ProjectStateStructuredDocumentEntry } from "../../projectState/fileUpdate"
import type { FormStructuredComponent } from "../../validation/formContracts"
import { indexClientApplicationFormComponents, type ClientApplicationFormComponentIndex } from "./formComponentIndex"
import { collectClientApplicationFormDataPathPreparation } from "./formDataPathContext"
import { serializeClientApplicationFormSemanticPayload } from "./formSemanticPayload"
import type { ClientApplicationFormYAML } from "./types"
import type { XmlAnomalyAnnotations } from "@nkdk/runtime"

export interface FormElementDataPathPayloadV1 {
  readonly version: 1
  readonly primaryDataPath: "missing" | "empty" | "explicit"
  readonly value?: string
  readonly tableOwnerName?: string
  readonly owner?: { readonly kind: string; readonly name: string }
}

export interface FormDataPathPayloadV1 {
  readonly version: 1
  readonly mode: "explicit"
  readonly owner?: { readonly kind: string; readonly name: string }
}

export function collectClientApplicationFormStructure(
  yaml: unknown,
  owner?: { readonly kind: string; readonly name: string },
  annotations?: XmlAnomalyAnnotations,
): readonly FormStructuredComponent[] {
  const index = indexClientApplicationFormComponents(yaml)
  const preparation = collectClientApplicationFormDataPathPreparation({
    yaml: yaml as ClientApplicationFormYAML,
  })
  return projectPreparedClientApplicationFormStructure({ yaml, index,
    elementsByName: preparation.collected.elementsByName, occurrences: preparation.collected.occurrences,
    owner, annotations,
  })
}

export function projectPreparedClientApplicationFormStructure(params: {
  readonly yaml: unknown
  readonly index: ClientApplicationFormComponentIndex
  readonly elementsByName: ReadonlyMap<string, {
    readonly present: boolean; readonly value: unknown; readonly tableOwnerName?: string
  }>
  readonly occurrences: readonly { readonly yamlPath: readonly (string | number)[]; readonly value: string }[]
  readonly owner?: { readonly kind: string; readonly name: string }
  readonly annotations?: XmlAnomalyAnnotations
}): readonly FormStructuredComponent[] {
  const { yaml, index, owner, annotations } = params
  const components = ([
    ["element", index.elements],
    ["attribute", index.attributes],
    ["command", index.commands],
    ["parameter", index.parameters],
  ] as const).flatMap(([componentKind, entries]) =>
    [...entries.values()].map(({ name, path }) => ({
      componentKind,
      name,
      yamlPath: path.split("."),
    }))
  )
  const elements = params.elementsByName
  const withPayload = components.map((component) => {
    if (component.componentKind !== "element") return component
    const element = elements.get(component.name)
    if (element === undefined) return component
    const primaryDataPath = !element.present
      ? "missing"
      : element.value === ""
        ? "empty"
        : "explicit"
    const payload: FormElementDataPathPayloadV1 = {
      version: 1,
      primaryDataPath,
      ...(typeof element.value === "string" && element.value !== "" ? { value: element.value } : {}),
      ...(element.tableOwnerName === undefined ? {} : { tableOwnerName: element.tableOwnerName }),
      ...(owner === undefined ? {} : { owner }),
    }
    return { ...component, payload: JSON.stringify(payload) }
  })
  const dataPaths = params.occurrences
    .filter((occurrence) => !hasInvalidAnnotation(yaml, occurrence.yamlPath, annotations))
    .map((occurrence) => {
      const payload: FormDataPathPayloadV1 = {
        version: 1,
        mode: "explicit",
        ...(owner === undefined ? {} : { owner }),
      }
      return {
        componentKind: "dataPath",
        name: occurrence.value,
        yamlPath: occurrence.yamlPath,
        payload: JSON.stringify(payload),
      }
    })
  return [{
    componentKind: "document",
    name: "",
    yamlPath: [],
    payload: serializeClientApplicationFormSemanticPayload(yaml),
  }, ...withPayload, ...dataPaths, ...mainAttributeComponents(yaml)]
}

function hasInvalidAnnotation(
  root: unknown,
  path: readonly (string | number)[],
  annotations: XmlAnomalyAnnotations | undefined,
): boolean {
  if (annotations === undefined || path.length === 0) return false
  let parent = root
  for (const segment of path.slice(0, -1)) {
    if (parent === null || typeof parent !== "object") return false
    parent = (parent as Record<string | number, unknown>)[segment]
  }
  if (parent === null || typeof parent !== "object") return false
  const annotation = annotations.at(parent, path.at(-1)!)
  return annotation?.kind === "invalid"
    || (annotation?.kind === "raw" && annotation.semantic?.kind === "invalid")
}

function mainAttributeComponents(yaml: unknown): FormStructuredComponent[] {
  const root = asRecord(yaml)
  const attributes = asRecord(root?.["Реквизиты"])
  if (attributes === undefined) return []
  return Object.entries(attributes).flatMap(([name, value]) => {
    const main = asRecord(value)?.["ОсновнойРеквизит"]
    return main === true || main === "Истина"
      ? [{ componentKind: "mainAttribute", name, yamlPath: ["Реквизиты", name, "ОсновнойРеквизит"] }]
      : []
  })
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined
}

export function projectClientApplicationFormStructure(params: {
  readonly components: readonly FormStructuredComponent[]
  readonly representation: "working" | "base"
  readonly logicalAddress: string
  readonly workingProjectPath: string
}): readonly ProjectStateStructuredDocumentEntry[] {
  const semanticPayload = params.components.find(({ componentKind }) => componentKind === "document")?.payload
  const document = {
    documentKind: "clientApplicationForm",
    representation: params.representation,
    logicalAddress: params.logicalAddress,
    workingProjectPath: params.workingProjectPath,
  }
  return [{
    ...document,
    componentKind: "document",
    name: "",
    yamlPath: [],
    ...(semanticPayload === undefined ? {} : { payload: semanticPayload }),
  }, ...params.components.filter(({ componentKind }) => componentKind !== "document").map((component) => ({
    ...document,
    ...component,
  }))]
}
