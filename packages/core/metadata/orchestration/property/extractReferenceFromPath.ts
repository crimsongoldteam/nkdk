import { compressMetadataFieldPath } from "~/metadata/commonObjects/metadataPath/compressPath"
import { convertPath } from "~/metadata/commonObjects/metadataPath/helper"
import { MetadataFieldsRulesToYAML } from "~/metadata/commonObjects/metadataPath/types"
import { GraphOpsReference } from "./fn"

/**
 * Преобразует внутренний путь к объекту метаданных (например, "Catalog.Контрагенты")
 * в GraphOpsReference с node ID в формате YAML ("Справочник.Контрагенты").
 *
 * Используется экстракторами MetadataItemLink, MetadataItemLinks и MetadataValue.
 * Для MetadataField передать { compress: true } — тогда служебные сегменты
 * (Реквизит, ТабличнаяЧасть и др.) вырезаются из node ID через
 * compressMetadataFieldPath.
 *
 * Возвращает undefined для пустых, коротких или неизвестных путей.
 */
export function extractReferenceFromPath(
  path: string,
  position?: { offset: number; length?: number },
  options?: { compress?: boolean }
): GraphOpsReference | undefined {
  if (!path) return undefined

  const dotIndex = path.indexOf(".")
  if (dotIndex === -1) return undefined

  const prefix = path.substring(0, dotIndex)
  if (!(prefix in MetadataFieldsRulesToYAML)) return undefined

  let nodeId = convertPath(MetadataFieldsRulesToYAML, path)
  if (options?.compress) {
    nodeId = compressMetadataFieldPath(nodeId)
  }

  const parts = nodeId.split(".")
  const name = parts[parts.length - 1]

  return { id: nodeId, name, positionFrom: position }
}
