import type { ProjectStateStructuredDocumentEntry } from "../../projectState/contracts/fileUpdate"

export const CONFIGURATION_EXTENSION_STRUCTURE_DOCUMENT = "configurationExtensionStructure"

export function configurationExtensionStructureDocument(params: {
  readonly itemType: string
  readonly logicalAddress: string
  readonly workingProjectPath: string
  readonly compatibilityMode?: string
  readonly lineNumberLength?: number
}): ProjectStateStructuredDocumentEntry {
  return {
    documentKind: CONFIGURATION_EXTENSION_STRUCTURE_DOCUMENT,
    representation: "working",
    logicalAddress: params.logicalAddress,
    workingProjectPath: params.workingProjectPath,
    componentKind: "object",
    name: params.itemType,
    yamlPath: [],
    payload: JSON.stringify({
      version: 1,
      itemType: params.itemType,
      ...(params.compatibilityMode === undefined ? {} : { compatibilityMode: params.compatibilityMode }),
      ...(params.lineNumberLength === undefined ? {} : { lineNumberLength: params.lineNumberLength }),
    }),
  }
}
