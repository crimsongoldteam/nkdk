import type { ProjectStateFragment } from "../projectState/binary/fragment"

export const PROJECT_STATE_FRAGMENT_BUFFER_NAMES = [
  "header",
  "strings",
  "files",
  "facts",
  "diagnostics",
] as const

export function projectStateFragmentFromNamedBuffers(
  buffers: ReadonlyMap<string, ArrayBuffer>,
  prefix = "projectState.",
): ProjectStateFragment {
  const buffer = (name: typeof PROJECT_STATE_FRAGMENT_BUFFER_NAMES[number]): ArrayBuffer => {
    const value = buffers.get(`${prefix}${name}`)
    if (value === undefined) throw new Error(`Отсутствует буфер ${prefix}${name}`)
    return value
  }
  return { buffers: {
    header: buffer("header"),
    strings: buffer("strings"),
    files: buffer("files"),
    facts: buffer("facts"),
    diagnostics: buffer("diagnostics"),
  } }
}
