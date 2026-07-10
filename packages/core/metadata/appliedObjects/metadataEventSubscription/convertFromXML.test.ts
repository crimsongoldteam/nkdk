import { describe, expect, it } from "vitest"
import { testConvertAppliedObjectFromXML } from "../../../tests/appliedObject"
import { readEventSubscriptionYAML } from "./__fixtures__/sync/data"
import { MetadataEventSubscriptionRules } from "./rules"

describe("convertAppliedObjectFromXML — MetadataEventSubscription", () => {
  it("читает EventSubscription из XML и записывает Свойства.yaml", async () => {
    const { yaml } = await testConvertAppliedObjectFromXML({
      rule: MetadataEventSubscriptionRules,
      name: "ПодпискаНаСобытиеВсеСвойства",
      importMetaUrl: import.meta.url,
      expectedYAML: readEventSubscriptionYAML,
    })

    expect(yaml.result).toBe(yaml.expected)
  })
})
