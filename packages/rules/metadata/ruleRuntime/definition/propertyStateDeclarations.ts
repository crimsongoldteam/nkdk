import type {
  PropertyStateCapabilityContribution,
  PropertyStatePropertyCapability,
} from "./contracts"
import type { MetadataItemRule } from "../property/types"

export function definePropertyStateProfile(
  id: string,
  properties: Readonly<Record<string, PropertyStatePropertyCapability>>,
): PropertyStateCapabilityContribution {
  return { kind: "propertyStateCapability", id, profile: { properties } }
}

export function definePropertyStateItemCapabilities<
  const Rule extends MetadataItemRule,
  const Properties extends Partial<Record<keyof Rule["properties"] & string, PropertyStatePropertyCapability>>,
>(
  rule: Rule,
  options: {
    readonly itemType?: string
    readonly profiles?: readonly string[]
    readonly properties?: Properties
  },
): PropertyStateCapabilityContribution {
  return {
    kind: "propertyStateCapability",
    id: `item:${options.itemType ?? rule.itemType}`,
    item: {
      itemType: options.itemType ?? rule.itemType,
      profiles: options.profiles ?? [],
      properties: options.properties as Readonly<Record<string, PropertyStatePropertyCapability>> | undefined,
    },
  }
}

const borrowed = (
  modes: PropertyStatePropertyCapability["modes"],
  representation?: PropertyStatePropertyCapability["representation"],
): PropertyStatePropertyCapability => ({
  availability: "borrowed",
  modes,
  ...(representation === undefined ? {} : { representation }),
})

export const controlled = (...keys: readonly string[]): Readonly<Record<string, PropertyStatePropertyCapability>> =>
  Object.fromEntries(keys.map((key) => [key, borrowed(["control", "notify"], "tagged")]))

export const extended = (...keys: readonly string[]): Readonly<Record<string, PropertyStatePropertyCapability>> =>
  Object.fromEntries(keys.map((key) => [key, borrowed(["extend"], "plain")]))

export const allPropertyStateModes = (...keys: readonly string[]): Readonly<Record<string, PropertyStatePropertyCapability>> =>
  Object.fromEntries(keys.map((key) => [key, borrowed(["control", "notify", "extend"], "tagged")]))

export const multiState = (...keys: readonly string[]): Readonly<Record<string, PropertyStatePropertyCapability>> =>
  Object.fromEntries(keys.map((key) => [key, borrowed(["control", "notify", "extend", "multi"], "multi")]))

export const externalProperty = (
  propertyKey: string,
  externalName: string,
  modes: readonly ("control" | "notify" | "extend")[],
): Readonly<Record<string, PropertyStatePropertyCapability>> => ({
  [propertyKey]: {
    availability: "borrowed",
    modes,
    representation: "section",
    externalName,
  },
})
