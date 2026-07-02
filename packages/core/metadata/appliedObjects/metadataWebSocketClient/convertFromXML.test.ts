import fs from "fs"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { testConvertAppliedObjectFromXML } from "../../../tests/appliedObject"
import { readWebSocketClientYAML } from "./__fixtures__/sync/data"
import { MetadataWebSocketClientRules } from "./rules"

describe("convertAppliedObjectFromXML — MetadataWebSocketClient", () => {
  const name = "WebSocketКлиентВсеСвойства"

  it("читает WebSocketClient из XML и записывает Свойства.yaml + модуль", async () => {
    const { outputDir, inputDir, yaml } = await testConvertAppliedObjectFromXML({
      rule: MetadataWebSocketClientRules,
      name,
      importMetaUrl: import.meta.url,
      expectedYAML: readWebSocketClientYAML,
    })

    expect(yaml.result).toBe(yaml.expected)
    expect(fs.readFileSync(join(outputDir, name, "Модуль.bsl"), "utf-8")).toBe(
      fs.readFileSync(join(inputDir, name, "Ext", "Module.bsl"), "utf-8")
    )
  })
})
