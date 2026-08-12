import { createRequire } from "node:module"
import type {
  NativeProjectStateReader,
  ProjectStateSections,
} from "@nkdk/project-state-native"
import type { ProjectStateSharedBuffers } from "../binary/snapshot"

const require = createRequire(import.meta.url)

export class RustProjectStateBackendUnavailableError extends Error {
  readonly code = "RUST_BACKEND_UNAVAILABLE"

  constructor(cause: unknown) {
    super("Rust-реализация ProjectState недоступна", { cause })
    this.name = "RustProjectStateBackendUnavailableError"
  }
}

export function openRustProjectStateReader(sections: ProjectStateSections): NativeProjectStateReader {
  try {
    const addon = require("@nkdk/project-state-native") as typeof import("@nkdk/project-state-native")
    return addon.openProjectStateReader(sections)
  } catch (caught) {
    if (isNativeLoadFailure(caught)) throw new RustProjectStateBackendUnavailableError(caught)
    throw caught
  }
}

export function projectStateSectionViews(buffers: ProjectStateSharedBuffers): ProjectStateSections {
  return {
    header: new Uint8Array(buffers.header), strings: new Uint8Array(buffers.strings),
    files: new Uint8Array(buffers.files), facts: new Uint8Array(buffers.facts),
    lookups: new Uint8Array(buffers.lookups), diagnostics: new Uint8Array(buffers.diagnostics),
  }
}

function isNativeLoadFailure(value: unknown): boolean {
  return value instanceof Error && (
    ("code" in value && ["MODULE_NOT_FOUND", "ERR_DLOPEN_FAILED"].includes(String(value.code)))
    || /Cannot find module|dlopen/u.test(value.message)
  )
}
