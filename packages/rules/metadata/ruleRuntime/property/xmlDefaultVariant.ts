import { resolveXMLDefaultVariant, type XMLDefaultVariantContext } from "@nkdk/runtime/rule-kit"

export function xmlDefaultVariant(
  context: XMLDefaultVariantContext | undefined,
): "full" | "adopted" | "indexed" | undefined {
  return context === undefined ? undefined : resolveXMLDefaultVariant(context)
}

export function hasYAMLProperty(source: unknown, propertyKey: string): boolean {
  return source !== null &&
    source !== undefined &&
    typeof source === "object" &&
    ("has" in source && typeof source.has === "function"
      ? source.has(propertyKey)
      : Object.prototype.hasOwnProperty.call(source, propertyKey))
}

export function exportDependentAdoptedDefault(
  source: unknown,
  context: XMLDefaultVariantContext | undefined,
  propertyKey: string,
  dependencyKeys: readonly string[],
): boolean {
  if (xmlDefaultVariant(context) !== "adopted") return true
  return hasYAMLProperty(source, propertyKey) || dependencyKeys.some((key) => hasYAMLProperty(source, key))
}

export function exportExplicitAdoptedValue(
  source: { readonly raw: (propertyKey: string) => unknown },
  context: XMLDefaultVariantContext | undefined,
  propertyKey: string,
): boolean {
  if (xmlDefaultVariant(context) !== "adopted") return true
  const value = source.raw(propertyKey)
  return value !== null && value !== undefined
}
