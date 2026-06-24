import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import { importDcsLocalStringTypeFromXML } from "../dcsLocalStringType/fromXML"
import { importDcsMetadataValueFromDcsXML } from "../dcsMetadataValue/fromXML"
import type { DcsMetadataValuePropertyRule, MetadataDcsMetadataValueDcsRootXML } from "../dcsMetadataValue/types"
import type { DcsAvailableValue, DcsAvailableValues } from "./types"

const valueRule = { type: "MetadataDcsMetadataValue", valueType: "Primitive" } as const satisfies DcsMetadataValuePropertyRule

const toArray = <T>(value: T | T[] | undefined): T[] => {
  if (value === undefined) return []
  return Array.isArray(value) ? value : [value]
}

const isNilValueXML = (value: unknown): boolean =>
  typeof value === "object" &&
  value !== null &&
  ((value as { "_xsi:nil"?: unknown })["_xsi:nil"] === true ||
    (value as { "_xsi:nil"?: unknown })["_xsi:nil"] === "true")

export const importDcsAvailableValuesFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: unknown
): DcsAvailableValues | undefined => {
  const items = toArray(xml as Record<string, unknown> | Record<string, unknown>[] | undefined)
  if (items.length === 0) return undefined

  return items.map((item): DcsAvailableValue => {
    const valueXML = item["dcssch:value"]
    const value =
      valueXML !== undefined && !isNilValueXML(valueXML)
        ? importDcsMetadataValueFromDcsXML(context, valueRule, {
            "dcscor:value": valueXML as MetadataDcsMetadataValueDcsRootXML["dcscor:value"],
          })
        : undefined
    const presentation = importDcsLocalStringTypeFromXML(
      context,
      { type: "DcsLocalStringType" },
      item["dcssch:presentation"] as never
    )

    return {
      itemType: "DcsAvailableValue",
      ...(value !== undefined ? { value } : {}),
      ...(presentation !== undefined ? { presentation } : {}),
    }
  })
}

registerTypeRule("DcsAvailableValues", "importFromXML", importDcsAvailableValuesFromXML)
