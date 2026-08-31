import { Packr } from "msgpackr"
import type { XmlDocument } from "@nkdk/runtime"
import type { ValidationProfiler } from "../validation/profile"
import type { ImportXmlInput } from "./types"

const PROFILE_STEP = "Подготовка импорта конфигурации"
const PAYLOAD_VERSION = 1

export interface PackedImportXmlInput {
  readonly input: ImportXmlInput
  readonly document: XmlDocument
}

export interface PackedXmlAssignmentStats {
  readonly assignments: number
  readonly bytes: number
}

export interface PackedXmlAssignmentStore {
  put(assignmentId: string, inputs: readonly PackedImportXmlInput[]): void
  take(assignmentId: string): PackedImportXmlInput[]
  release(assignmentId: string): void
  clear(): void
  stats(): PackedXmlAssignmentStats
}

interface PackedXmlCodec {
  pack(value: unknown): Uint8Array
  unpack(value: Uint8Array): unknown
}

interface PackedXmlAssignmentPayload {
  readonly version: typeof PAYLOAD_VERSION
  readonly inputs: readonly PackedImportXmlInput[]
}

export function createPackedXmlAssignmentStore(options: {
  readonly profiler?: ValidationProfiler
  readonly codec?: PackedXmlCodec
} = {}): PackedXmlAssignmentStore {
  const codec = options.codec ?? createPackedXmlCodec()
  const buffers = new Map<string, Uint8Array>()
  let retainedBytes = 0

  function checkpoint(): void {
    options.profiler?.checkpoint(PROFILE_STEP, "Удерживаемый packed XML", {
      items: buffers.size,
      bytes: retainedBytes,
    })
  }

  return {
    put(assignmentId, inputs) {
      if (buffers.has(assignmentId)) throw new Error(`XML assignment already packed: ${assignmentId}`)
      const payload: PackedXmlAssignmentPayload = { version: PAYLOAD_VERSION, inputs }
      const bytes = measure(options.profiler, "MessagePack pack", { items: inputs.length }, () =>
        Uint8Array.from(codec.pack(payload))
      )
      options.profiler?.record(PROFILE_STEP, "Packed XML bytes", {
        items: inputs.length,
        bytes: bytes.byteLength,
        timeMs: 0,
      })
      buffers.set(assignmentId, bytes)
      retainedBytes += bytes.byteLength
      checkpoint()
    },

    take(assignmentId) {
      const bytes = buffers.get(assignmentId)
      if (bytes === undefined) throw new Error(`XML assignment is not packed: ${assignmentId}`)
      buffers.delete(assignmentId)
      retainedBytes -= bytes.byteLength
      checkpoint()
      const payload = measure(
        options.profiler,
        "MessagePack unpack",
        { items: 1, bytes: bytes.byteLength },
        () => codec.unpack(bytes)
      )
      return requirePackedXmlAssignmentPayload(payload).inputs.slice()
    },

    release(assignmentId) {
      const bytes = buffers.get(assignmentId)
      if (bytes === undefined) return
      buffers.delete(assignmentId)
      retainedBytes -= bytes.byteLength
      checkpoint()
    },

    clear() {
      buffers.clear()
      retainedBytes = 0
      checkpoint()
    },

    stats() {
      return { assignments: buffers.size, bytes: retainedBytes }
    },
  }
}

function createPackedXmlCodec(): PackedXmlCodec {
  const codec = new Packr({ structuredClone: true, useRecords: true })
  return {
    pack: (value) => codec.pack(value),
    unpack: (value) => codec.unpack(value),
  }
}

function requirePackedXmlAssignmentPayload(value: unknown): PackedXmlAssignmentPayload {
  if (
    value === null
    || typeof value !== "object"
    || !("version" in value)
    || value.version !== PAYLOAD_VERSION
    || !("inputs" in value)
    || !Array.isArray(value.inputs)
    || !value.inputs.every(isPackedImportXmlInput)
  ) {
    throw new Error("Unsupported or malformed packed XML assignment")
  }
  return value as PackedXmlAssignmentPayload
}

function isPackedImportXmlInput(value: unknown): value is PackedImportXmlInput {
  if (value === null || typeof value !== "object" || !("input" in value) || !("document" in value)) {
    return false
  }
  const input = value.input
  const document = value.document
  return input !== null
    && typeof input === "object"
    && "role" in input
    && (input.role === "metadata" || input.role === "body" || input.role === "property")
    && "sourcePath" in input
    && typeof input.sourcePath === "string"
    && document !== null
    && typeof document === "object"
    && "content" in document
    && Array.isArray(document.content)
    && "roots" in document
    && Array.isArray(document.roots)
    && "compatibility" in document
    && document.compatibility !== null
    && typeof document.compatibility === "object"
    && "sourceLength" in document
    && typeof document.sourceLength === "number"
}

function measure<T>(
  profiler: ValidationProfiler | undefined,
  substep: string,
  params: { readonly items?: number; readonly bytes?: number },
  action: () => T,
): T {
  return profiler === undefined ? action() : profiler.measure(PROFILE_STEP, substep, params, action)
}
