import fs from "fs"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { testConvertAppliedObjectFromXML } from "../../../tests/appliedObject"
import { readXDTOPackageYAML } from "./__fixtures__/sync/data"
import { MetadataXDTOPackageRules } from "./rules"

describe("convertAppliedObjectFromXML — MetadataXDTOPackage", () => {
  const name = "ПакетXDTOВсеСвойства"

  it("читает XDTOPackage из XML и записывает Свойства.yaml + Package.bin", async () => {
    const { outputDir, inputDir, yaml } = await testConvertAppliedObjectFromXML({
      rule: MetadataXDTOPackageRules,
      name,
      importMetaUrl: import.meta.url,
      expectedYAML: readXDTOPackageYAML,
    })

    expect(yaml.result).toBe(yaml.expected)
    expect(fs.readFileSync(join(outputDir, name, "Package.bin"))).toEqual(
      fs.readFileSync(join(inputDir, name, "Ext", "Package.bin"))
    )
  })
})
