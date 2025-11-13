import { TClientApplicationForm } from "./types"
import { TBaseElement } from "../baseElement/types"

export const getAllElements = (
  form: TClientApplicationForm
): TBaseElement[] => {
  const elements: TBaseElement[] = []
  const queue: TBaseElement[] = []

  for (const childItem of form.childItems) {
    queue.push(childItem)
  }

  while (queue.length > 0) {
    const element = queue.shift()!
    elements.push(element)

    if (!("childItems" in element) || !Array.isArray(element.childItems))
      continue

    for (const childItem of element.childItems) queue.push(childItem)
  }

  return elements
}
