import fs from "fs"
import os from "os"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { XmlSyncManifest } from "~/metadata/appliedObjects/configuration/migrations/xmlManifest"
import { syncExternalFileFromXML } from "./fromXML"
import { syncExternalFileToXML } from "./toXML"

describe("ExternalFile sync", () => {
  it("round-trips root configuration external file without object name", async () => {
    const tmpDir = fs.mkdtempSync(join(os.tmpdir(), "root-external-file-"))
    const xmlDir = join(tmpDir, "xml")
    const nkdkDir = join(tmpDir, "yaml")
    const outDir = join(tmpDir, "out")
    const rule = {
      type: "ExternalFile" as const,
      nkdkPath: "ПодписьМобильногоКлиента.bin",
      xmlPath: "Ext/MobileClientSignature.bin",
      syncExternalOnly: true as const,
    }
    const bytes = Buffer.from([0xff, 0x00, 0x7f, 0x42])

    await fs.promises.mkdir(join(xmlDir, "Ext"), { recursive: true })
    await fs.promises.writeFile(join(xmlDir, "Ext", "MobileClientSignature.bin"), bytes)

    await syncExternalFileFromXML({ rule, xmlDir, nkdkDir })
    expect([...fs.readFileSync(join(nkdkDir, "ПодписьМобильногоКлиента.bin"))]).toEqual([...bytes])

    const xmlManifest = new XmlSyncManifest(outDir)
    await syncExternalFileToXML({ rule, nkdkDir, xmlDir: outDir, xmlManifest })
    expect([...fs.readFileSync(join(outDir, "Ext", "MobileClientSignature.bin"))]).toEqual([...bytes])
    expect(xmlManifest.expectedFiles()).toContain("Ext/MobileClientSignature.bin")
  })
})
