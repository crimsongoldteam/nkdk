export function temporaryMappingKey(
  prefix: string,
  index: number,
  mapping: Readonly<Record<string, unknown>>,
): string {
  const base = `__nkdk_${prefix}_${index}`
  if (!Object.prototype.hasOwnProperty.call(mapping, base)) return base
  let suffix = 1
  while (Object.prototype.hasOwnProperty.call(mapping, `${base}_${suffix}`)) suffix += 1
  return `${base}_${suffix}`
}
