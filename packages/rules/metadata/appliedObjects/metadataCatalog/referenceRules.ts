import { join } from "path"
import type { ProjectReferenceContribution } from "../../validation/projectReferenceIndexRegistry"
import { createNamedValueReference } from "../namedValueReference"

export const metadataCatalogReferenceRules: readonly ProjectReferenceContribution[] = [
  {
    kind: "objectPath",
    root: "Catalog",
    contributor: ({ projectDir, target }) => ({
      filePath: join(projectDir, "Справочник", target.objectName, "Свойства.yaml"),
    }),
  },
  { kind: "value", root: "Catalog", contributor: createNamedValueReference("predefined") },
]
