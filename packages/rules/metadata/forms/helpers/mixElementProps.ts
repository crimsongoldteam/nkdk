export const mixElementProps = <T extends object>(
  element: T | undefined,
  enterpriseProps: Partial<T> | undefined
): T | undefined => {
  if (element === undefined) return undefined
  if (!element && !enterpriseProps) return undefined

  return { ...element, ...(enterpriseProps || {}) }
}
