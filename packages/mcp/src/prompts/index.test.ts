import { describe, expect, it } from "vitest"
import { promptDefinitions } from "./index"

describe("prompt definitions", () => {
  it("contains the four first-version prompts", () => {
    expect(promptDefinitions.map((prompt) => prompt.name)).toEqual([
      "nkdk_config_edit_yaml",
      "nkdk_config_import_from_xml",
      "nkdk_config_sync_to_xml",
      "nkdk_config_validate_yaml",
    ])
  })
})
