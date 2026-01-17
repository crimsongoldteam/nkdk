import { ChildItem, ChildItems } from "../../collections/childItems/types"
import { ClientApplicationForm } from "./types"

export const getAllElements = (form: ClientApplicationForm): ChildItems => {
  const elements: ChildItems = []
  const queue: ChildItems = []

  for (const childItem of form.childItems ?? []) {
    queue.push(childItem)
  }

  while (queue.length > 0) {
    const element = queue.shift()!
    elements.push(element)

    const childItems = getChildItems(element)
    queue.push(...childItems)
  }

  return elements
}

const getChildItems = (element: ChildItem): ChildItems => {
  if (!("childItems" in element) || !Array.isArray(element.childItems)) return []

  return element.childItems
}
