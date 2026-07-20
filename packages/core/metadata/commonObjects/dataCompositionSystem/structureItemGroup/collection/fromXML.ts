import { ConfigurationContextFromXML } from "../../../../context/types"
import { withConfigurationIndexYamlCollectionItemContext } from "../../../../configurationIndex/collector/context"
import { importPropertyFromXML, PropertyRule, registerTypeRule } from "../../../../orchestration"
import { StructureItemGroupRegistry } from "./registry"
import { StructureItemGroupCollection } from "./types"

export const importStructureItemGroupCollectionFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule,
  xml: unknown
): StructureItemGroupCollection | undefined => {
  if (!xml) return undefined

  const source =
    xml && typeof xml === "object" && "dcsset:item" in (xml as Record<string, unknown>)
      ? (xml as Record<string, unknown>)["dcsset:item"]
      : xml

  const items = Array.isArray(source) ? source : [source]
  const result: StructureItemGroupCollection = []

  for (const [index, item] of items.entries()) {
    if (!item || typeof item !== "object") continue
    const xsiType = (item as Record<string, unknown>)["_xsi:type"]
    const registryItem = findStructureItemGroupRegistryItemByXMLKey(typeof xsiType === "string" ? xsiType : undefined)
    if (!registryItem) continue

    const itemContext = withConfigurationIndexYamlCollectionItemContext(context, { index, yamlAsArray: true })
    const converted = importPropertyFromXML({
      context: itemContext,
      rule: { type: registryItem.itemType } as PropertyRule,
      value: item,
    })
    if (converted) result.push(converted)
  }

  return result.length > 0 ? result : undefined
}

const findStructureItemGroupRegistryItemByXMLKey = (xmlKey: string | undefined) =>
  StructureItemGroupRegistry.find((item) => item.xmlKey === xmlKey)

registerTypeRule("StructureItemGroupCollection", "importFromXML", importStructureItemGroupCollectionFromXML)
