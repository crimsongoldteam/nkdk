import { TClientApplicationForm } from "~/lib"

export type TNameIdMapping = Map<string, string>

export function createNameIdMapping(form: TClientApplicationForm): TNameIdMapping {
  const result: TNameIdMapping = new Map()
  form.childItems.forEach((item) => {
    if (!item.id) return
    result.set(item.id, item.name)
  })
  return result
}

export function updateNameIdMapping(nameIdMapping: TNameIdMapping, form: TClientApplicationForm): void {
  form.childItems.forEach((item) => {
    if (item.id) {
      nameIdMapping.set(item.id, item.name)
      return
    }

    const id = Array.from(nameIdMapping.entries()).find(([_, value]) => value === item.name)?.[0]
    if (id) {
      item.id = id
      return
    }

    item.id = getNextFreeId(nameIdMapping)
    nameIdMapping.set(item.id, item.name)
  })
}

function getNextFreeId(nameIdMapping: TNameIdMapping): string {
  const keys = Array.from(nameIdMapping.keys())
  let id = 1
  while (keys.includes(id.toString())) {
    id++
  }
  return id.toString()
}
