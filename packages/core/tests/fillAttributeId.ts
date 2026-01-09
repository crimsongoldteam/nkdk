interface ElementWithId {
  _id: string
  id?: string
  childItems?: ElementWithId[]
}

const fillAttributeIdRecursive = <T extends ElementWithId>(element: T): T & { id: string } => {
  const filledElement = { ...element, id: "1" } as T & { id: string }

  if (element.childItems && element.childItems.length > 0) {
    filledElement.childItems = element.childItems.map((child) => fillAttributeIdRecursive(child)) as T["childItems"]
  }

  return filledElement
}

export const fillAttributeId = <T extends ElementWithId>(data: T | T[]): (T & { id: string })[] | undefined => {
  if (!data) return undefined

  if (Array.isArray(data)) {
    return data.map((attribute) => fillAttributeIdRecursive(attribute))
  }

  return [fillAttributeIdRecursive(data)]
}
