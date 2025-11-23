import { TClientApplicationForm } from "~/lib"
import { TChildItem } from "~/lib/metadata/forms/elements/childItems/types"

export type TNameIdMapping = Map<string, string>

export const createNameIdMapping = (
  form: TClientApplicationForm
): TNameIdMapping => {
  const result: TNameIdMapping = new Map()
  form.childItems.forEach((item: TChildItem) => {
    if (!item.id) return
    result.set(item.id, item.name)
  })
  return result
}

export const updateNameIdMapping = (
  nameIdMapping: TNameIdMapping,
  form: TClientApplicationForm
): void => {
  form.childItems.forEach((item: TChildItem) => {
    if (item.id) {
      nameIdMapping.set(item.id, item.name)
      return
    }

    const id = Array.from(nameIdMapping.entries()).find(
      ([_, value]) => value === item.name
    )?.[0]
    if (id) {
      item.id = id
      return
    }

    item.id = getNextFreeId(nameIdMapping)
    nameIdMapping.set(item.id, item.name)
  })
}

const getNextFreeId = (nameIdMapping: TNameIdMapping): string => {
  const keys = Array.from(nameIdMapping.keys())
  let id = 1
  while (keys.includes(id.toString())) {
    id++
  }
  return id.toString()
}
