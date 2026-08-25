import { expect, it } from "vitest"

import type { XmlAnomalyRegistration } from "../xmlAnomaly/contracts"
import { composeMetadataRules } from "./composeMetadataRules"
import { emptyMetadataRules } from "./testSupport"

it("составляет xmlAnomalies как отдельный упорядоченный вклад", () => {
  const important: XmlAnomalyRegistration = {
    kind: "important",
    boundary: { propertyType: "SyntheticValue" },
  }
  const exactImportant: XmlAnomalyRegistration = {
    kind: "important",
    boundary: { itemType: "SyntheticOwner", propertyKey: "value" },
  }

  const definition = composeMetadataRules(
    { ...emptyMetadataRules, xmlAnomalies: [important] },
    { ...emptyMetadataRules, xmlAnomalies: [exactImportant] },
  )

  expect(definition.xmlAnomalies).toEqual([important, exactImportant])
})
