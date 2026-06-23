import { describe, expect, it, vi } from "vitest"
import { registerNkdkCapabilities } from "./registerTools"

describe("registerNkdkCapabilities", () => {
  it("registers four tools, four resources, and four prompts", () => {
    const calls = {
      tools: [] as string[],
      resources: [] as string[],
      prompts: [] as string[],
    }
    const server = {
      registerTool: vi.fn((name: string) => calls.tools.push(name)),
      registerResource: vi.fn((name: string) => calls.resources.push(name)),
      registerPrompt: vi.fn((name: string) => calls.prompts.push(name)),
    }

    registerNkdkCapabilities(server as unknown as Parameters<typeof registerNkdkCapabilities>[0])

    expect(calls.tools).toEqual(["nkdk.get_schema", "nkdk.validate_project", "nkdk.import_from_xml", "nkdk.sync_to_xml"])
    expect(calls.resources).toEqual([
      "config-edit-yaml",
      "config-import-from-xml",
      "config-sync-to-xml",
      "config-validate-yaml",
    ])
    expect(calls.prompts).toEqual([
      "nkdk_config_edit_yaml",
      "nkdk_config_import_from_xml",
      "nkdk_config_sync_to_xml",
      "nkdk_config_validate_yaml",
    ])
  })
})
