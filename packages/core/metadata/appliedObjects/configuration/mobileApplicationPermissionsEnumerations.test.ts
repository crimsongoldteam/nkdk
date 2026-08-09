import { describe, expect, it } from "vitest"
import {
  RequiredMobileApplicationPermissionMessagesFromYAML,
  RequiredMobileApplicationPermissionMessagesToYAML,
  RequiredMobileApplicationPermissionsFromYAML,
  RequiredMobileApplicationPermissionsToYAML,
} from "../../systemEnumerations/types"

const expectInverseMappings = (toYAML: Record<string, string>, fromYAML: Record<string, string>) => {
  expect(Object.keys(fromYAML)).toHaveLength(Object.keys(toYAML).length)
  for (const [xml, yaml] of Object.entries(toYAML)) {
    expect(fromYAML[yaml]).toBe(xml)
  }
}

const untranslatedPermissions = [
  "PermissionGroupPhone",
  "PermissionGroupCallLog",
  "PermissionGroupSMS",
  "PostNotifications",
] as const

describe("mobile application permission enumerations", () => {
  it("keeps both XML/YAML tables complete and invertible", () => {
    expectInverseMappings(
      RequiredMobileApplicationPermissionMessagesToYAML,
      RequiredMobileApplicationPermissionMessagesFromYAML
    )
    expectInverseMappings(RequiredMobileApplicationPermissionsToYAML, RequiredMobileApplicationPermissionsFromYAML)
    expect(Object.keys(RequiredMobileApplicationPermissionMessagesToYAML)).toHaveLength(21)
    expect(Object.keys(RequiredMobileApplicationPermissionsToYAML)).toHaveLength(39)
  })

  it.each(untranslatedPermissions)("keeps %s untranslated wherever it is allowed", (value) => {
    expect(RequiredMobileApplicationPermissionsToYAML[value]).toBe(value)
    expect(RequiredMobileApplicationPermissionsFromYAML[value]).toBe(value)
    expect(RequiredMobileApplicationPermissionMessagesToYAML[value]).toBe(value)
    expect(RequiredMobileApplicationPermissionMessagesFromYAML[value]).toBe(value)
  })
})
