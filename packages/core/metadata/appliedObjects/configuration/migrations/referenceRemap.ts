import type { MetadataItemRule } from "~/metadata/orchestration/property/types"

export function remapReferenceModel(params: {
  rule: MetadataItemRule
  currentObjectPath: string
  currentModel: Record<string, unknown>
  referenceModel: Record<string, unknown> | undefined
  referencePathByCurrentPath: Map<string, string>
}): Record<string, unknown> | undefined {
  const { currentObjectPath, currentModel, referenceModel, referencePathByCurrentPath } = params
  if (!referenceModel) return undefined
  const cloned = structuredClone(referenceModel)

  remapCollection({
    ownerPath: currentObjectPath,
    segment: "Реквизит",
    currentItems: currentModel["attributes"],
    referenceItems: cloned["attributes"],
    referencePathByCurrentPath,
  })
  remapCollection({
    ownerPath: currentObjectPath,
    segment: "Измерение",
    currentItems: currentModel["dimensions"],
    referenceItems: cloned["dimensions"],
    referencePathByCurrentPath,
  })
  remapCollection({
    ownerPath: currentObjectPath,
    segment: "ТабличнаяЧасть",
    currentItems: currentModel["tabularSections"],
    referenceItems: cloned["tabularSections"],
    referencePathByCurrentPath,
    nested: (sectionPath, currentSection, referenceSection) => {
      remapCollection({
        ownerPath: sectionPath,
        segment: "Реквизит",
        currentItems: currentSection["attributes"],
        referenceItems: referenceSection["attributes"],
        referencePathByCurrentPath,
      })
    },
  })

  return cloned
}

function remapCollection(params: {
  ownerPath: string
  segment: "Реквизит" | "ТабличнаяЧасть" | "Измерение"
  currentItems: unknown
  referenceItems: unknown
  referencePathByCurrentPath: Map<string, string>
  nested?: (
    sectionPath: string,
    currentItem: Record<string, unknown>,
    referenceItem: Record<string, unknown>,
  ) => void
}): void {
  const { ownerPath, segment, referencePathByCurrentPath, nested } = params
  if (!Array.isArray(params.currentItems) || !Array.isArray(params.referenceItems)) return

  for (const current of params.currentItems) {
    if (!current || typeof current !== "object") continue
    const currentRecord = current as Record<string, unknown>
    const currentName = typeof currentRecord["name"] === "string" ? currentRecord["name"] : undefined
    if (!currentName) continue

    const currentPath = `${ownerPath}.${segment}.${currentName}`
    const referencePath = referencePathByCurrentPath.get(currentPath) ?? currentPath
    const referencePathParts = referencePath.split(".")
    const referenceName = referencePathParts[referencePathParts.length - 1]
    const referenceRecord = params.referenceItems.find((item): item is Record<string, unknown> => {
      return item !== null &&
        typeof item === "object" &&
        !Array.isArray(item) &&
        (item as Record<string, unknown>)["name"] === referenceName
    })
    if (!referenceRecord) continue

    referenceRecord["name"] = currentName
    if (nested) nested(currentPath, currentRecord, referenceRecord)
  }
}
