import { expect, it } from "vitest"

import { hasExplicitXMLPropertyRegistration } from "../../../ruleRuntime/property/explicitXMLPropertyRegistry"
import { defineExplicitHeaderHorizontalAlign } from "./explicitHeaderHorizontalAlign"

it("defines explicit header alignment without legacy registration", () => {
  const itemType = "PureHeaderHorizontalAlignProbe"

  const definition = defineExplicitHeaderHorizontalAlign(itemType)

  expect(
    hasExplicitXMLPropertyRegistration(itemType, "headerHorizontalAlign"),
  ).toBe(false)
  expect(
    Object.values(definition.explicitXMLProperties)[0],
  ).toMatchObject({ itemType, propertyKey: "headerHorizontalAlign" })
})
