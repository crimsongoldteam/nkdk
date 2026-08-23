import { expect, it } from "vitest"

import type { XmlAnomalyRegistration } from "../xmlAnomaly/contracts"
import { composeMetadataRules } from "./composeMetadataRules"
import { emptyMetadataRules } from "./testSupport"

it("составляет xmlAnomalies как отдельный упорядоченный вклад", () => {
  const important: XmlAnomalyRegistration = {
    kind: "important",
    boundary: { propertyType: "SyntheticValue" },
  }
  const hiddenName: XmlAnomalyRegistration = {
    kind: "hiddenSingletonName",
    boundary: { itemType: "SyntheticOwner", propertyKey: "value" },
  }

  const definition = composeMetadataRules(
    { ...emptyMetadataRules, xmlAnomalies: [important] },
    { ...emptyMetadataRules, xmlAnomalies: [hiddenName] },
  )

  expect(definition.xmlAnomalies).toEqual([important, hiddenName])
})
