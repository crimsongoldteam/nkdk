import { join } from "path"
import type { ProjectReferenceContribution } from "../../validation/projectReferenceIndexRegistry"

export const metadataExternalDataSourceReferenceRules: readonly ProjectReferenceContribution[] = [{
  kind: "objectPath",
  root: "ExternalDataSource",
  contributor: ({ projectDir, target }) => {
    const parts = [projectDir, "ВнешнийИсточникДанных", target.objectName]
    for (const segment of target.segments ?? []) {
      if (segment.kind === "Table") parts.push("Таблицы", segment.objectName)
      else if (segment.kind === "Cube") parts.push("Кубы", segment.objectName)
      else if (segment.kind === "DimensionTable") parts.push("ТаблицыИзмерений", segment.objectName)
      else if (segment.kind === "Function") parts.push("Функции", segment.objectName)
      else return undefined
    }
    return { filePath: join(...parts, "Свойства.yaml") }
  },
}]
