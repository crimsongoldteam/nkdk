import type { MetadataItemRule } from "../../../orchestration/property/types"

export function remapReferenceModel(params: {
  rule: MetadataItemRule
  currentObjectPath: string
  currentModel: Record<string, unknown>
  referenceModel: Record<string, unknown> | undefined
  referencePathByCurrentPath: Map<string, string>
}): Record<string, unknown> | undefined {
  const { currentObjectPath, currentModel, referenceModel, referencePathByCurrentPath } = params
  if (!referenceModel) return undefined
  const cloned = cloneWithPropertyDescriptors(referenceModel)

  remapCollection({
    ownerPath: currentObjectPath,
    segment: "Реквизит",
    currentItems: currentModel["attributes"],
    referenceItems: cloned["attributes"],
    referencePathByCurrentPath,
  })
  remapCollection({
    ownerPath: currentObjectPath,
    segment: "РеквизитАдресации",
    currentItems: currentModel["addressingAttributes"],
    referenceItems: cloned["addressingAttributes"],
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
    segment: "Ресурс",
    currentItems: currentModel["resources"],
    referenceItems: cloned["resources"],
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
  segment: "Реквизит" | "РеквизитАдресации" | "ТабличнаяЧасть" | "Измерение" | "Ресурс"
  currentItems: unknown
  referenceItems: unknown
  referencePathByCurrentPath: Map<string, string>
  nested?: (sectionPath: string, currentItem: Record<string, unknown>, referenceItem: Record<string, unknown>) => void
}): void {
  const { ownerPath, segment, referencePathByCurrentPath, nested } = params
  if (!Array.isArray(params.currentItems) || !Array.isArray(params.referenceItems)) return

  const remappedReferenceItems: Record<string, unknown>[] = []

  for (const current of params.currentItems) {
    if (!current || typeof current !== "object") continue
    const currentRecord = current as Record<string, unknown>
    const currentName = typeof currentRecord["name"] === "string" ? currentRecord["name"] : undefined
    if (!currentName) continue

    const currentPath = `${ownerPath}.${segment}.${currentName}`
    const referencePath = referencePathByCurrentPath.get(currentPath)
    const referenceName = referencePath ? referencePath.split(".").at(-1) : currentName
    const referenceRecord = findReferenceItem(params.referenceItems, referenceName)
    if (!referenceRecord) continue

    referenceRecord["name"] = currentName
    if (nested) nested(currentPath, currentRecord, referenceRecord)
    remappedReferenceItems.push(referenceRecord)
  }

  params.referenceItems.splice(0, params.referenceItems.length, ...remappedReferenceItems)
}

function findReferenceItem(items: unknown[], name: string | undefined): Record<string, unknown> | undefined {
  if (!name) return undefined

  return items.find((item): item is Record<string, unknown> => {
    return isRecord(item) && item["name"] === name
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function cloneWithPropertyDescriptors<T>(value: T, seen = new WeakMap<object, unknown>()): T {
  if (value === null || typeof value !== "object") return value

  const source = value as object
  const cached = seen.get(source)
  if (cached !== undefined) return cached as T

  const target: object = Array.isArray(value) ? [] : {}
  seen.set(source, target)

  for (const key of Reflect.ownKeys(source)) {
    const descriptor = Object.getOwnPropertyDescriptor(source, key)
    if (!descriptor) continue

    if ("value" in descriptor) {
      Object.defineProperty(target, key, {
        ...descriptor,
        value: cloneWithPropertyDescriptors(descriptor.value, seen),
      })
      continue
    }

    Object.defineProperty(target, key, descriptor)
  }

  return target as T
}
