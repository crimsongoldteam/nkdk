import type { ConfigurationContext } from "@nkdk/runtime"
import { callAtomicFromYAML, type PropertyRule, definePropertyTypeRule } from "../../../ruleRuntime"
import type { StructureItemGroupCollection } from "./collection/types"
import type { StructureItemGroup } from "./types"

export const importStructureItemGroupFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule,
  value: unknown
): StructureItemGroup | undefined => {
  if (!Array.isArray(value)) return undefined

  const groupItems = callAtomicFromYAML({
    context,
    rule: { type: "StructureItemGroupCollection" } as PropertyRule,
    value,
  }) as StructureItemGroupCollection | undefined

  if (!groupItems || groupItems.length === 0) return undefined

  const root: StructureItemGroup = {
    itemType: "StructureItemGroup",
    groupItems: [groupItems[0]],
  }

  let current = root
  for (const groupItem of groupItems.slice(1)) {
    const next: StructureItemGroup = {
      itemType: "StructureItemGroup",
      groupItems: [groupItem],
    }
    current.item = next
    current = next
  }

  return root
}

export const metadataPropertyRule000 = definePropertyTypeRule("StructureItemGroup", "importFromYAML", importStructureItemGroupFromYAML)
