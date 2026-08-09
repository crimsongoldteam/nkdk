type ContentWithChildren = {
  readonly childItems?: readonly unknown[]
}

export const getSearchControlAdditionName = (parentElement: { name: string }): string => {
  return `${parentElement.name}УправлениеПоиском`
}

export const isHasContent = (data: ContentWithChildren): boolean => {
  if ((data.childItems?.length ?? 0) > 0) return true
  return Object.keys(data).filter((key) => key !== "childItems" && key !== "itemType").length > 0
}
