export * from "./types"
export * from "./rules"
import { join } from "path"
import { registerProjectObjectPathResolver } from "../../validation/projectMetadataResolverRegistry"

registerProjectObjectPathResolver("Subsystem", ({ projectDir, target }) => {
  const parts = [projectDir, "Подсистема", target.objectName]
  for (const segment of target.segments ?? []) {
    if (segment.kind !== "Subsystem") return undefined
    parts.push("Подсистемы", segment.objectName)
  }

  return { filePath: join(...parts, "Свойства.yaml") }
})
