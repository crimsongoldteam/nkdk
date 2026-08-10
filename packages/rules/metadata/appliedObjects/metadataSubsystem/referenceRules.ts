import { join } from "path"
import type { ProjectReferenceContribution } from "../../validation/projectReferenceIndexRegistry"

export const metadataSubsystemReferenceRules: readonly ProjectReferenceContribution[] = [{
  kind: "objectPath",
  root: "Subsystem",
  contributor: ({ projectDir, target }) => {
    const parts = [projectDir, "Подсистема", target.objectName]
    for (const segment of target.segments ?? []) {
      if (segment.kind !== "Subsystem") return undefined
      parts.push("Подсистемы", segment.objectName)
    }
    return { filePath: join(...parts, "Свойства.yaml") }
  },
}]
