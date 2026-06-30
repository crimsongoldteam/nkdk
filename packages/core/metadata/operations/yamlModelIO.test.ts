import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, it } from "vitest"
import { buildMetadataOperationSnapshot } from "./projectSnapshot"
import { exportOperationItemToYamlText, writeOperationYamlFile } from "./yamlModelIO"

describe("metadata operation YAML model IO", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  it("exports and writes a touched metadata item through the model exporter", () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-yaml-model-io-"))
    tempDirs.push(projectDir)
    const propertiesPath = join(projectDir, "Справочник", "Товары", "Свойства.yaml")
    mkdirSync(join(propertiesPath, ".."), { recursive: true })
    writeFileSync(propertiesPath, ["Реквизиты:", "  Артикул:", "    Тип: Строка"].join("\n"))

    const snapshot = buildMetadataOperationSnapshot({ projectDir, requireValidProject: false })
    expect(snapshot.ok).toBe(true)
    if (!snapshot.ok) return
    const item = snapshot.items[0]!

    const text = exportOperationItemToYamlText(item, snapshot.context)
    expect(text).toContain("Реквизиты:")
    expect(text).toContain("Артикул:")

    writeOperationYamlFile(item, snapshot.context)
    expect(readFileSync(propertiesPath, "utf-8")).toBe(text)
  })
})
