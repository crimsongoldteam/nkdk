import { describe, expect, it } from "vitest"
import { importChildSubsystemNamesFromXML } from "./fromXML"

describe("ChildSubsystemNames XML import", () => {
  it("imports undefined as undefined", () => {
    expect(importChildSubsystemNamesFromXML(undefined)).toBeUndefined()
  })

  it("imports single subsystem name", () => {
    expect(importChildSubsystemNamesFromXML("ПодчиненнаяПодсистема")).toEqual(["ПодчиненнаяПодсистема"])
  })

  it("imports several subsystem names", () => {
    expect(importChildSubsystemNamesFromXML(["А", "Б"])).toEqual(["А", "Б"])
  })
})
