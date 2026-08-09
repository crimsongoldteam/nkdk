type ContentWithChildren = {
  readonly childItems?: readonly unknown[]
}

export const getContextMenuName = (parentElement: { name: string }): string => {
  return `${parentElement.name}КонтекстноеМеню`
}

export const isHasContent = (data: ContentWithChildren | undefined): boolean => {
  if (!data) return false

  if ((data.childItems?.length ?? 0) > 0) return true

  const keys = Object.keys(data)
  const hasOtherFields = keys.some((key) => key !== "childItems")

  return hasOtherFields
}
