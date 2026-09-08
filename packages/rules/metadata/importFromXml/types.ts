import type { XmlDocument } from "@nkdk/runtime"
import type { ImportXmlInput } from "../workerPool/importContracts"

export * from "../workerPool/importContracts"

export interface ParsedImportXmlDocument {
  readonly input: ImportXmlInput
  readonly document: XmlDocument
}
