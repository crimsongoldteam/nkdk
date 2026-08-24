import { describe, expect, it } from "vitest"
import { importChildSubsystemNamesFromXML, metadataPropertyRule001 } from "./fromXML"

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

  it("объявляет повторные XML-узлы одним значением", () => {
    expect(metadataPropertyRule001.handler.repeatedXMLNodes).toBe(true)
  })
})
