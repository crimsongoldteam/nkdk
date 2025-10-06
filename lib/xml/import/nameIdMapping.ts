import { TClientApplicationForm } from "~/lib/metadata/forms/elements/сlientApplicationForm/types"

type TNameIdMapping = Map<string, string>

export function createNameIdMapping(form: TClientApplicationForm): TNameIdMapping {
  const result: TNameIdMapping = new Map()
  form.items.forEach((item) => {
    if (!item.id) return
    result.set(item.id, item.name)
  })
  return result
}

export function updateNameIdMapping(nameIdMapping: TNameIdMapping, form: TClientApplicationForm): void {
  form.items.forEach((item) => {
    if (item.id) {
      nameIdMapping.set(item.id, item.name)
      return
    }

    item.id = getNextFreeId(nameIdMapping)
    nameIdMapping.set(item.id, item.name)
  })
}

function getNextFreeId(nameIdMapping: TNameIdMapping): string {
  let id = 1
  while (nameIdMapping.has(id.toString())) {
    id++
  }
  return id.toString()
}
