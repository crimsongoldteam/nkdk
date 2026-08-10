import type { ProjectStateStructuredDocumentEntry } from "../../projectState/fileUpdate"
import type { FormStructuredComponent } from "../../validation/formContracts"
import { indexClientApplicationFormComponents } from "./formComponentIndex"

export function collectClientApplicationFormStructure(yaml: unknown): readonly FormStructuredComponent[] {
  const index = indexClientApplicationFormComponents(yaml)
  return ([
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
}

export function projectClientApplicationFormStructure(params: {
  readonly components: readonly FormStructuredComponent[]
  readonly representation: "working" | "base"
  readonly logicalAddress: string
  readonly workingProjectPath: string
}): readonly ProjectStateStructuredDocumentEntry[] {
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
  }, ...params.components.map((component) => ({
    ...document,
    ...component,
  }))]
}
