import type { XmlRootStructure } from "../import/saxesParser"
import { xmlObjectRootFingerprints } from "./document"

export type XmlRootFingerprint = Pick<XmlRootStructure, "name" | "path" | "structuralHash">

export type XmlObjectStructureResult =
  | { readonly kind: "supported"; readonly roots: readonly XmlRootFingerprint[] }
  | { readonly kind: "unsupported"; readonly reason: string }

export function xmlObjectRootStructures(value: unknown): XmlObjectStructureResult {
  try {
    return {
      kind: "supported",
      roots: xmlObjectRootFingerprints(value),
    }
  } catch (caught) {
    return { kind: "unsupported", reason: caught instanceof Error ? caught.message : String(caught) }
  }
}
