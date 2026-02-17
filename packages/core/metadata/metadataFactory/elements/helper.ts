import { BaseElement as MetadataItem } from "~/metadata/forms/elements/baseElement/types"

export const isEmptyMetadataItem = (element: MetadataItem | undefined): boolean => {
  if (!element) return true

  for (const [key, value] of Object.entries(element) as [string, any][]) {
    if (key === "itemType") continue
    if (key === "childItems" && (value as Array<unknown>).length === 0) continue

    return false
  }

  return true
}
