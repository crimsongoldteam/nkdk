import { TSchema } from "@sinclair/typebox"
import { TypeCheck, ValueError, ValueErrorType } from "@sinclair/typebox/compiler"
import { ParsedYaml } from "~/yaml/parseMetadataYaml"
import { expandDiscriminatedUnionErrors } from "./discriminatedUnionErrors"
import { Diagnostic } from "./types"
import { diagnosticAtYamlPath } from "./yamlLocations"

function parseJsonPointer(pointer: string): (string | number)[] {
  if (!pointer || pointer === "/") return []
  return pointer
    .slice(1) // удалить ведущий /
    .split("/")
    .map((segment) => {
      const decoded = segment.replace(/~1/g, "/").replace(/~0/g, "~")
      return /^\d+$/.test(decoded) ? parseInt(decoded, 10) : decoded
    })
}

function isDiagnosticAtKey(error: ValueError): boolean {
  return error.type === ValueErrorType.ObjectAdditionalProperties && error.schema.diagnosticLocation === "key"
}

export function typeboxErrorsToDiagnostics(
  errors: ValueError[],
  parsed: ParsedYaml,
  filePath: string,
  schema?: TypeCheck<TSchema>,
): Diagnostic[] {
  const diagnostics: Diagnostic[] = []

  for (const error of expandDiscriminatedUnionErrors(errors, schema)) {
    const pointer = error.path
    const keys = parseJsonPointer(pointer)

    if (isDiagnosticAtKey(error)) {
      diagnostics.push(
        diagnosticAtYamlPath({
          filePath,
          parsed,
          path: keys,
          message: error.message,
          severity: "error",
          source: "structure",
        }),
      )
      continue
    }

    // Для отсутствующего обязательного поля берём координаты родительского узла
    const isRequired = error.type === ValueErrorType.ObjectRequiredProperty
    const lookupKeys = isRequired && keys.length > 0 ? keys.slice(0, -1) : keys

    let line = 1
    let col = 1

    if (lookupKeys.length > 0) {
      const node = parsed.doc.getIn(lookupKeys, true) as { range?: number[] } | null
      if (node?.range) {
        const pos = parsed.lineCounter.linePos(node.range[0])
        line = pos.line
        col = pos.col
      }
    } else {
      const rootNode = parsed.doc.contents as { range?: number[] } | null
      if (rootNode?.range) {
        const pos = parsed.lineCounter.linePos(rootNode.range[0])
        line = pos.line
        col = pos.col
      }
    }

    diagnostics.push({
      filePath,
      line,
      col,
      message: error.message,
      severity: "error",
      source: "structure",
      path: pointer || undefined,
    })
  }

  return diagnostics
}
