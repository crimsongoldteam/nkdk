import { describe, expect, it } from "vitest"
import {
  defaultMetadataCommands,
  fullMetadataCommands,
  minimalMetadataCommands,
} from "~/tests/fixtures/metadataCommand/data"

import { mockContext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importMetadataCommandsFromXML } from "./fromXML"
import { MetadataCommandsXML } from "./types"

describe("importMetadataCommandFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importMetadataCommandsFromXML(mockContext, { type: "MetadataCommands" }, undefined)

    expect(result).toBeUndefined()
  })

  it("should import metadata command with all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ Command: MetadataCommandsXML }>("metadataCommand/full.xml")

    const result = importMetadataCommandsFromXML(mockContext, { type: "MetadataCommands" }, xmlData.Command)

    expect(result).toEqual(fullMetadataCommands)
  })

  it("should import minimal nodes", () => {
    const xmlData = readAndParseXMLFile<{ Command: MetadataCommandsXML }>("metadataCommand/minimal.xml")

    const result = importMetadataCommandsFromXML(mockContext, { type: "MetadataCommands" }, xmlData.Command)

    expect(result).toEqual(minimalMetadataCommands)
  })

  it("should import defaults nodes", () => {
    const xmlData = readAndParseXMLFile<{ Command: MetadataCommandsXML }>("metadataCommand/defaults.xml")

    const result = importMetadataCommandsFromXML(mockContext, { type: "MetadataCommands" }, xmlData.Command)

    expect(result).toEqual(defaultMetadataCommands)
  })
})
