export const getViewStatusAdditionName = (parentElement: { name: string }): string => {
  return `${parentElement.name}СостояниеПросмотра`
}

export const isHasContent = (data: object): boolean => {
  return Object.keys(data).length > 0
}
