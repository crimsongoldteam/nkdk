import { ClientApplicationForm } from "~/packages/core"
import { ChildItem } from "~/packages/core/metadata/forms/elements/childItems/types"

export type NameIdMapping = Map<string, string>

export const createNameIdMapping = (form: ClientApplicationForm): NameIdMapping => {
  const result: NameIdMapping = new Map()
  form.childItems?.forEach((item: ChildItem) => {
    if (!item.id) return
    result.set(item.id!, item.name!)
  })
  return result
}

export const updateNameIdMapping = (nameIdMapping: NameIdMapping, form: ClientApplicationForm): void => {
  if (!form.childItems) return
  form.childItems.forEach((item: ChildItem) => {
    if (item.id) {
      nameIdMapping.set(item.id!, item.name!)
      return
    }

    const id = Array.from(nameIdMapping.entries()).find(([_, value]) => value === item.name)?.[0]
    if (id) {
      item.id = id
      return
    }

    item.id = getNextFreeId(nameIdMapping)
    nameIdMapping.set(item.id!, item.name!)
  })
}

const getNextFreeId = (nameIdMapping: NameIdMapping): string => {
  const keys = Array.from(nameIdMapping.keys())
  let id = 1
  while (keys.includes(id.toString())) {
    id++
  }
  return id.toString()
}
