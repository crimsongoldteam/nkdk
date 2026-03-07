import { ChildItem } from "../commonObjects/childItems/types"
import { ClientApplicationForm } from "./types"

export const getAllElements = (form: ClientApplicationForm): ChildItem[] => {
  const elements: ChildItem[] = []
  const queue: ChildItem[] = []

  for (const childItem of form.childItems ?? []) {
    queue.push(childItem)
  }

  if (form.autoCommandBar?.childItems) {
    for (const childItem of form.autoCommandBar.childItems) {
      queue.push(childItem)
    }
  }

  while (queue.length > 0) {
    const element = queue.shift()!
    elements.push(element)

    const childItems = getChildItems(element)
    queue.push(...childItems)
  }

  return elements
}

const getChildItems = (element: ChildItem): ChildItem[] => {
  const result: ChildItem[] = []

  if ("childItems" in element && Array.isArray(element.childItems)) {
    result.push(...element.childItems)
  }

  if (
    "autoCommandBar" in element &&
    element.autoCommandBar &&
    typeof element.autoCommandBar === "object" &&
    "childItems" in element.autoCommandBar &&
    Array.isArray(element.autoCommandBar.childItems)
  ) {
    result.push(...element.autoCommandBar.childItems)
  }

  return result
}
