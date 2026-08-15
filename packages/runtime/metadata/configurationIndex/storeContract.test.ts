import { join } from "node:path"
import { describe, expect, it } from "vitest"
import {
  CONFIGURATION_INDEX_SCHEMA_VERSION,
  configurationIndexStoreDescriptor,
} from "./storePath"
import { validateConfigurationIndexProjectPath } from "./utilities"

describe("configuration index store contract", () => {
  it("places configuration data and lock under the component directory", () => {
    const projectDir = "/project"

    expect(configurationIndexStoreDescriptor(projectDir, { kind: "configuration" })).toEqual({
      dataPath: join(projectDir, ".nkdk/components/cf/configuration-index.lmdb"),
      lockPath: join(projectDir, ".nkdk/components/cf/configuration-index.lmdb-lock"),
      schemaVersion: CONFIGURATION_INDEX_SCHEMA_VERSION,
    })
  })

  it.each(["", "a\0b", "a\\b", "./a", "a/../b", "/absolute"])(
    "rejects invalid project path %j",
    (projectPath) => {
      expect(() => validateConfigurationIndexProjectPath(projectPath)).toThrow("Недопустимый project path")
    },
  )
})
