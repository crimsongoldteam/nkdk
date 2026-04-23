import { convertPath } from "~/metadata/commonObjects/metadataPath/helper"
import { MetadataFieldsRulesToYAML } from "~/metadata/commonObjects/metadataPath/types"
import { GraphOpsReference } from "./fn"

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
  position?: { offset: number; length?: number }
): GraphOpsReference | undefined {
  if (!path) return undefined

  const dotIndex = path.indexOf(".")
  if (dotIndex === -1) return undefined

  const prefix = path.substring(0, dotIndex)
  if (!(prefix in MetadataFieldsRulesToYAML)) return undefined

  const nodeId = convertPath(MetadataFieldsRulesToYAML, path)

  const parts = nodeId.split(".")
  const name = parts[parts.length - 1]

  return { id: nodeId, name, positionFrom: position }
}
