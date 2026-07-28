import { describe, expect, it } from "vitest"
import { PlatformSessionError } from "../sessions/errors"
import {
  parseExtensionPropertyRecords,
  parseIbcmdExtensionList,
} from "./parse"

const firstRecord = {
  name: "Patch",
  version: "",
  active: "yes",
  purpose: "patch",
  "safe-mode": "no",
  "security-profile-name": "",
  "unsafe-action-protection": "yes",
  "used-in-distributed-infobase": "no",
  scope: "infobase",
  "hash-sum": "+0jilJURdR/U2I/ncgzahEAQU4Y=",
}

const firstExtension = {
  name: "Patch",
  version: "",
  active: true,
  purpose: "patch" as const,
  safeMode: false,
  securityProfileName: "",
  unsafeActionProtection: true,
  usedInDistributedInfobase: false,
  scope: "infobase" as const,
  hashSum: "+0jilJURdR/U2I/ncgzahEAQU4Y=",
}

const secondRecord = {
  name: "Addon",
  version: "1.2.3",
  active: "no",
  purpose: "add-on",
  "safe-mode": "yes",
  "security-profile-name": "Restricted",
  "unsafe-action-protection": "no",
  "used-in-distributed-infobase": "yes",
  scope: "data-separation",
  "hash-sum": "second-hash",
}

const secondExtension = {
  name: "Addon",
  version: "1.2.3",
  active: false,
  purpose: "add-on" as const,
  safeMode: true,
  securityProfileName: "Restricted",
  unsafeActionProtection: false,
  usedInDistributedInfobase: true,
  scope: "data-separation" as const,
  hashSum: "second-hash",
}

describe("configuration extension property parser", () => {
  it("normalizes all properties and preserves platform order", () => {
    expect(
      parseExtensionPropertyRecords([firstRecord, secondRecord])
    ).toEqual([firstExtension, secondExtension])
  })

  it("accepts an empty list", () => {
    expect(parseExtensionPropertyRecords([])).toEqual([])
  })

  it("accepts native booleans returned by the designer agent", () => {
    expect(
      parseExtensionPropertyRecords([
        {
          ...firstRecord,
          active: true,
          "safe-mode": false,
          "unsafe-action-protection": true,
          "used-in-distributed-infobase": false,
        },
      ])
    ).toEqual([firstExtension])
  })

  it.each([
    [{ ...firstRecord, unexpected: "value" }],
    [{ ...firstRecord, version: undefined }],
    [{ ...firstRecord, active: 1 }],
    [{ ...firstRecord, active: "unknown" }],
    [{ ...firstRecord, purpose: "unknown" }],
    [{ ...firstRecord, scope: "unknown" }],
    [null],
  ])("rejects an invalid property record without exposing it: %j", (record) => {
    const error = captureError(() => parseExtensionPropertyRecords([record]))

    expect(error).toMatchObject<Partial<PlatformSessionError>>({
      code: "platform_command_failed",
    })
    expect(String(error)).not.toContain("unexpected")
    expect(String(error)).not.toContain("unknown")
  })

  it("parses the aligned table returned by ibcmd", () => {
    const source = `${ibcmdRecord({
      name: "Patch",
      version: "",
      active: "yes",
      purpose: "patch",
      safeMode: "no",
      securityProfileName: "",
      unsafeActionProtection: "yes",
      usedInDistributedInfobase: "no",
      scope: "infobase",
      hashSum: "+0jilJURdR/U2I/ncgzahEAQU4Y=",
    })}

${ibcmdRecord({
      name: "Addon",
      version: "1.2.3",
      active: "no",
      purpose: "add-on",
      safeMode: "yes",
      securityProfileName: "Restricted: profile",
      unsafeActionProtection: "no",
      usedInDistributedInfobase: "yes",
      scope: "data-separation",
      hashSum: "second-hash",
    })}
`

    expect(parseIbcmdExtensionList(source)).toEqual([
      firstExtension,
      { ...secondExtension, securityProfileName: "Restricted: profile" },
    ])
  })

  it.each(["", " \n\r\n "])("treats empty ibcmd output as an empty list", (source) => {
    expect(parseIbcmdExtensionList(source)).toEqual([])
  })

  it.each([
    ["broken line"],
    [`${ibcmdRecordFrom(firstRecord)}\nname : "Duplicate"`],
    [`${ibcmdRecordFrom(firstRecord)}\nunknown : value`],
    [`${ibcmdRecordFrom(firstRecord).replace('"Patch"', '"bad\\q"')}`],
  ])("rejects malformed ibcmd output without exposing it", (source) => {
    const error = captureError(() => parseIbcmdExtensionList(source))

    expect(error).toMatchObject<Partial<PlatformSessionError>>({
      code: "platform_command_failed",
    })
    expect(String(error)).not.toContain("Duplicate")
    expect(String(error)).not.toContain("bad")
  })
})

function ibcmdRecord(values: {
  name: string
  version: string
  active: string
  purpose: string
  safeMode: string
  securityProfileName: string
  unsafeActionProtection: string
  usedInDistributedInfobase: string
  scope: string
  hashSum: string
}): string {
  return ibcmdRecordFrom({
    name: values.name,
    version: values.version,
    active: values.active,
    purpose: values.purpose,
    "safe-mode": values.safeMode,
    "security-profile-name": values.securityProfileName,
    "unsafe-action-protection": values.unsafeActionProtection,
    "used-in-distributed-infobase": values.usedInDistributedInfobase,
    scope: values.scope,
    "hash-sum": values.hashSum,
  })
}

function ibcmdRecordFrom(record: Record<string, string>): string {
  return Object.entries(record)
    .map(([key, value]) => {
      const rendered =
        value.length === 0
          ? ""
          : key === "name" ||
              key === "security-profile-name" ||
              key === "hash-sum"
          ? JSON.stringify(value)
          : value
      return `${key.padEnd(29)}: ${rendered}`
    })
    .join("\n")
}

function captureError(operation: () => unknown): unknown {
  try {
    operation()
  } catch (caught) {
    return caught
  }
  throw new Error("expected operation to throw")
}
