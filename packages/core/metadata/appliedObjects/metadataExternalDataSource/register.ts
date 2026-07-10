import "./types"
import { join } from "path"
import { registerDataPathOwnerKind } from "../../validation/dataPath/registry"
import { registerProjectReferenceObjectPathContributor } from "../../validation/projectReferenceIndexRegistry"
import { MetadataExternalDataSourceRules } from "./rules"

registerDataPathOwnerKind({
  kind: "ВнешнийИсточникДанных",
  projectDir: "ВнешнийИсточникДанных",
  rule: MetadataExternalDataSourceRules,
})

registerProjectReferenceObjectPathContributor("ExternalDataSource", ({ projectDir, target }) => {
  const parts = [projectDir, "ВнешнийИсточникДанных", target.objectName]
  for (const segment of target.segments ?? []) {
    if (segment.kind === "Table") parts.push("Таблицы", segment.objectName)
    else if (segment.kind === "Cube") parts.push("Кубы", segment.objectName)
    else if (segment.kind === "DimensionTable") parts.push("ТаблицыИзмерений", segment.objectName)
    else if (segment.kind === "Function") parts.push("Функции", segment.objectName)
    else return undefined
  }

  return { filePath: join(...parts, "Свойства.yaml") }
})
