import { canonicalizeMetadataGraphPath } from "~/metadata/commonObjects/metadataPath/graphPath"
import {
  MetadataFieldsRulesToYAML,
  MetadataTypeFromYAML,
  MetadataTypeToYAML,
} from "~/metadata/commonObjects/metadataPath/types"
import { GraphOpsReference } from "./fn"
import { SourcePosition } from "./position"

/**
 * Преобразует внутренний путь к объекту метаданных (например, "Catalog.Контрагенты")
 * в GraphOpsReference с node ID в формате полного YAML-пути ("Справочник.Контрагенты").
 *
 * Используется экстракторами MetadataItemLink, MetadataItemLinks, MetadataValue и MetadataField.
 * Всегда возвращает полный путь без компрессии сегментов.
 *
 * Возвращает undefined для пустых, коротких или неизвестных путей.
 */
export function extractReferenceFromPath(
  path: string,
  position?: SourcePosition
): GraphOpsReference | undefined {
  if (!path) return undefined

  const dotIndex = path.indexOf(".")
  if (dotIndex === -1) return undefined

  const prefix = path.substring(0, dotIndex)
  if (
    !(prefix in MetadataFieldsRulesToYAML) &&
    !(prefix in MetadataTypeFromYAML) &&
    !(prefix in MetadataTypeToYAML)
  ) return undefined

  const nodeId = canonicalizeMetadataGraphPath(path)

  const parts = nodeId.split(".")
  const name = parts[parts.length - 1]

  return { id: nodeId, name, positionFrom: position }
}
