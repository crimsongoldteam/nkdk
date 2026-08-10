import type { Diagnostic } from "../../diagnostics/types"
import { FormComponentIndexError, indexClientApplicationFormComponents } from "./formComponentIndex"

export function validateBaseFormCompatibility(params: {
  readonly base: unknown
  readonly extension: unknown
  readonly extensionFilePath: string
}): readonly Diagnostic[] {
  const diagnostics: Diagnostic[] = []
  try {
    const base = indexClientApplicationFormComponents(params.base)
    const extension = indexClientApplicationFormComponents(params.extension)
    for (const [category, label] of [
      ["elements", "элемент"], ["attributes", "реквизит"], ["commands", "команда"], ["parameters", "параметр"],
    ] as const) {
      for (const [name, component] of base[category]) {
        if (extension[category].has(name)) continue
        diagnostics.push(diagnostic(params.extensionFilePath,
          `В форме расширения отсутствует ${label} основной формы «${name}»`, component.path, "warning"))
      }
    }
  } catch (caught) {
    if (!(caught instanceof FormComponentIndexError)) throw caught
    diagnostics.push(diagnostic(params.extensionFilePath, caught.message, caught.path))
  }
  return diagnostics
}

function diagnostic(
  filePath: string,
  message: string,
  path: string,
  severity: Diagnostic["severity"] = "error",
): Diagnostic {
  return { filePath, line: 1, col: 1, severity, source: "cross-file", message, path }
}
