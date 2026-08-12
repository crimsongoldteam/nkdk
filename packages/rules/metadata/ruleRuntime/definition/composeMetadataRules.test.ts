import { describe, expect, it } from "vitest"

import {
  composeMetadataRules,
  defineMetadataRules,
} from "."
import {
  brokenXMLReferenceCarrier,
  emptyMetadataRules,
} from "./testSupport"

describe("metadata rules definition", () => {
  it("replaces keyed entries with the later layer and appends ordered entries", () => {
    const firstValidation = () => []
    const secondValidation = () => []
    const first = defineMetadataRules({
      ...emptyMetadataRules,
      metadataItems: { Item: { itemType: "First", properties: {} } },
      validation: [
        {
          kind: "localYamlValue",
          propertyType: "first",
          validate: firstValidation,
        },
      ],
    })
    const second = defineMetadataRules({
      ...emptyMetadataRules,
      metadataItems: { Item: { itemType: "Second", properties: {} } },
      validation: [
        {
          kind: "localYamlValue",
          propertyType: "second",
          validate: secondValidation,
        },
      ],
    })

    const result = composeMetadataRules(first, second)

    expect(result.metadataItems.Item?.itemType).toBe("Second")
    expect(result.validation
      .filter((contribution) => contribution.kind === "localYamlValue")
      .map(({ validate }) => validate)).toEqual([
      firstValidation,
      secondValidation,
    ])
  })

  it("merges operations of the same property type", () => {
    const importFromXML = () => undefined
    const firstExportToXML = () => undefined
    const secondExportToXML = () => ({ value: "second" })

    const result = composeMetadataRules(
      defineMetadataRules({
        ...emptyMetadataRules,
        propertyTypes: {
          Sample: { importFromXML, exportToXML: firstExportToXML },
        },
      }),
      defineMetadataRules({
        ...emptyMetadataRules,
        propertyTypes: { Sample: { exportToXML: secondExportToXML } },
      }),
    )

    expect(result.propertyTypes.Sample?.importFromXML).toBe(importFromXML)
    expect(result.propertyTypes.Sample?.exportToXML).toBe(secondExportToXML)
  })

  it("appends broken XML reference carriers in layer order", () => {
    const firstCarrier = brokenXMLReferenceCarrier("first", "MetadataValue")
    const secondCarrier = brokenXMLReferenceCarrier("second", "DataPath")

    const result = composeMetadataRules(
      defineMetadataRules({
        ...emptyMetadataRules,
        brokenXMLReferenceCarriers: [firstCarrier],
      }),
      defineMetadataRules({
        ...emptyMetadataRules,
        brokenXMLReferenceCarriers: [secondCarrier],
      }),
    )

    expect(result.brokenXMLReferenceCarriers).toEqual([
      firstCarrier,
      secondCarrier,
    ])
  })

  it("сохраняет возможности PropertyState в порядке слоёв", () => {
    const first = { kind: "propertyStateCapability" as const, id: "first", profile: { properties: {} } }
    const second = { kind: "propertyStateCapability" as const, id: "second", profile: { properties: {} } }

    const result = composeMetadataRules(
      defineMetadataRules({ ...emptyMetadataRules, propertyStateCapabilities: [first] }),
      defineMetadataRules({ ...emptyMetadataRules, propertyStateCapabilities: [second] }),
    )

    expect(result.propertyStateCapabilities).toEqual([first, second])
  })
})
