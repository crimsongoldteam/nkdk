import { describe, expect, it } from "vitest"
import type { MetadataItemRule } from "../orchestration/property/types"
import { createValidationYamlQueue } from "./projectValidationQueue"
import type { ValidationProjectFile } from "./projectFiles"
import type { ValidationProjectSpec } from "./projectSpecs"

describe("ValidationYamlQueue", () => {
  it("deduplicates absolute paths", () => {
    const file = validationFile("/project/Справочник/Товары/Свойства.yaml", "Справочник/Товары/Свойства.yaml")
    const queue = createValidationYamlQueue({ mode: "full", initialFiles: [file, file] })

    expect(queue.takePending(10)).toEqual([file])
    queue.markRunning(file.absolutePath)
    queue.markReady(file.absolutePath)
    expect(queue.takePending(10)).toEqual([])
  })

  it("tracks dependency requests without re-enqueueing ready files", () => {
    const file = validationFile("/project/Справочник/Товары/Свойства.yaml", "Справочник/Товары/Свойства.yaml")
    const queue = createValidationYamlQueue({ mode: "partial", initialFiles: [file] })

    queue.markRunning(file.absolutePath)
    queue.markReady(file.absolutePath)

    expect(queue.enqueueDependency(file)).toBe("already-known")
    expect(queue.takePending(10)).toEqual([])
  })
})

function validationFile(absolutePath: string, projectPath: string): ValidationProjectFile {
  return {
    absolutePath,
    projectPath,
    kind: "properties",
    owner: {
      dir: "Справочник",
      name: "Товары",
      spec: {
        kind: "catalog",
        dir: "Справочник",
        rule: { itemType: "Catalog", properties: {} } as MetadataItemRule,
        exportSchema: () => ({ type: "object" }) as never,
        importModel: () => ({ itemType: "Catalog", name: "Товары" }),
      } satisfies ValidationProjectSpec,
    },
  }
}
