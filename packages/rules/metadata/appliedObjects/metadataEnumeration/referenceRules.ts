import { join } from "path"
import type { ProjectReferenceContribution } from "../../validation/projectReferenceIndexRegistry"
import { createNamedValueReference } from "../namedValueReference"

export const metadataEnumerationReferenceRules: readonly ProjectReferenceContribution[] = [
  {
    kind: "objectPath",
    root: "Enum",
    contributor: ({ projectDir, target }) => ({
      filePath: join(projectDir, "Перечисление", target.objectName, "Свойства.yaml"),
    }),
  },
  { kind: "value", root: "Enum", contributor: createNamedValueReference("enumValues") },
]
