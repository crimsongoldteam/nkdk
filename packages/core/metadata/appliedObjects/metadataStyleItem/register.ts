import "./types"
import { existsSync } from "fs"
import { join } from "path"
import * as SE from "~/metadata/systemEnumerations/types"
import {
  registerProjectNamedResourceResolver,
  type MetadataResolveResult,
} from "~/metadata/validation/projectMetadataResolverRegistry"
import type { ProjectYamlCache } from "~/metadata/validation/projectYamlCache"
import type { StyleItemTargetType } from "~/metadata/commonObjects/metadataTargets"

registerProjectNamedResourceResolver("StyleItem", ({ projectDir, name, expectedTypes = [], yamlCache }) => {
  const filePath = join(projectDir, "ЭлементСтиля", name, "Свойства.yaml")
  if (!existsSync(filePath)) return referenceError(filePath, `Не найден элемент стиля "ЭлементСтиля.${name}"`)

  const styleItemType = readStyleItemType({ filePath, yamlCache })
  if (styleItemType && expectedTypes.length > 0 && !expectedTypes.includes(styleItemType)) {
    return referenceError(
      filePath,
      `Элемент стиля "ЭлементСтиля.${name}" имеет тип "${styleItemType}", ожидался: ${expectedTypes.join(", ")}`,
    )
  }

  return { ok: true, filePath }
})

function readStyleItemType(params: { filePath: string; yamlCache: ProjectYamlCache }): StyleItemTargetType | undefined {
  const entry = params.yamlCache.get(params.filePath)
  if ("error" in entry || entry.parsed.syntaxErrors.length > 0) return undefined

  const typeValue = styleItemTypeValue(entry.parsed.data)
  if (typeof typeValue !== "string") return undefined

  return SE.StyleElementTypeFromYAML[typeValue as SE.StyleElementTypeYAML] ?? styleItemTypeFromModelValue(typeValue)
}

function styleItemTypeValue(data: unknown): unknown {
  return typeof data === "object" && data !== null ? (data as Record<string, unknown>).Тип : undefined
}

function styleItemTypeFromModelValue(value: string): StyleItemTargetType | undefined {
  return Object.prototype.hasOwnProperty.call(SE.StyleElementTypeToYAML, value) ? (value as StyleItemTargetType) : undefined
}

function referenceError(filePath: string, message: string): MetadataResolveResult {
  return {
    ok: false,
    diagnostics: [{ filePath, line: 1, col: 1, source: "reference", severity: "error", message }],
  }
}
