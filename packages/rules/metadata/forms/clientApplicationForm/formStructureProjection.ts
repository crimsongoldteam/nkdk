import type { ProjectStateStructuredDocumentEntry } from "../../projectState/fileUpdate"
import type { FormStructuredComponent } from "../../validation/formContracts"
import { indexClientApplicationFormComponents } from "./formComponentIndex"
import { collectClientApplicationFormDataPathPreparation } from "./formDataPathContext"
import { serializeClientApplicationFormSemanticPayload } from "./formSemanticPayload"
import type { ClientApplicationFormYAML } from "./types"

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
  owner?: { readonly kind: string; readonly name: string }
): readonly FormStructuredComponent[] {
  const index = indexClientApplicationFormComponents(yaml)
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
  const preparation = collectClientApplicationFormDataPathPreparation({
    yaml: yaml as ClientApplicationFormYAML,
  })
  const elements = new Map(preparation.collected.elementsByName)
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
  const dataPaths = preparation.collected.occurrences.map((occurrence) => {
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
