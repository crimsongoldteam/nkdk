import { describe, expect, it } from "vitest"
import { Client } from "@modelcontextprotocol/client"
import { InMemoryTransport, McpServer } from "@modelcontextprotocol/server"
import {
  PROJECT_SETTINGS_SCHEMA_URI,
  projectSettingsExamples,
  projectSettingsJsonSchema,
  validateProjectSettings,
} from "@nkdk/platform"
import { registerProjectSettingsSchemaResource } from "./projectSettingsSchema"

describe("project settings schema resource", () => {
  it("publishes the platform schema through MCP", async () => {
    const server = new McpServer({ name: "schema-test", version: "1.0.0" })
    registerProjectSettingsSchemaResource(server)
    const client = new Client({ name: "schema-client", version: "1.0.0" })
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)])

    try {
      const listed = await client.listResources()
      expect(listed.resources).toEqual([
        expect.objectContaining({
          uri: PROJECT_SETTINGS_SCHEMA_URI,
          mimeType: "application/schema+json",
        }),
      ])
      const read = await client.readResource({ uri: PROJECT_SETTINGS_SCHEMA_URI })
      expect(read.contents).toEqual([
        expect.objectContaining({
          uri: PROJECT_SETTINGS_SCHEMA_URI,
          mimeType: "application/schema+json",
          text: JSON.stringify(projectSettingsJsonSchema),
        }),
      ])
    } finally {
      await client.close()
    }
  })

  it("contains only examples accepted by runtime validation", () => {
    for (const example of projectSettingsExamples) {
      expect(validateProjectSettings(example)).toMatchObject({ ok: true })
    }
  })
})
