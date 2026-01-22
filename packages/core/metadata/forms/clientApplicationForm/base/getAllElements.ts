import { AllChildItem, AllChildItems } from "../../collections/childItems/types"
import { ClientApplicationForm } from "./types"

export const getAllElements = (form: ClientApplicationForm): AllChildItems => {
  const elements: AllChildItems = []
  const queue: AllChildItems = []

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

const getChildItems = (element: AllChildItem): AllChildItems => {
  const result: AllChildItems = []

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
