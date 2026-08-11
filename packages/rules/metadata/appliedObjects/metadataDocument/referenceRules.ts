import { join } from "path"
import type { ProjectReferenceContribution } from "../../validation/projectReferenceIndexRegistry"

export const metadataDocumentReferenceRules: readonly ProjectReferenceContribution[] = [{
  kind: "objectPath",
  root: "Document",
  contributor: ({ projectDir, target }) => ({
    filePath: join(projectDir, "Документ", target.objectName, "Свойства.yaml"),
  }),
}]
