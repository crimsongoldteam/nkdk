import fs from "node:fs"
import os from "node:os"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { MetadataCalculationRegisterRules } from "../../appliedObjects/metadataCalculationRegister/rules"
import { XmlSyncManifest } from "../../appliedObjects/configuration/migrations/xmlManifest"
import { syncAppliedObjectToXML } from "../../orchestration/appliedObject/syncToXML"
import { mockContextToXML } from "../../../tests/mockContext"

const REGISTER_NAME = "РегистрРасчетаВсеСвойства"
const RECALCULATION_NAME = "ПерерасчетВсеСвойства"
let tmpDir: string

beforeEach(() => {
  tmpDir = fs.mkdtempSync(join(os.tmpdir(), "recalculation-sync-"))
})

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

describe("sync external Recalculations", () => {
  it("syncToXML writes full recalculation XML from nkdk", async () => {
    const { referenceDir, outputDir } = await syncConverted()
    const result = recalculationXML(outputDir)
    expect(fs.readFileSync(result, "utf8")).toBe(fs.readFileSync(recalculationXML(referenceDir), "utf8"))
    expect(fs.readFileSync(result, "utf8")).toContain("<Comment>Комментарий</Comment>")
  })

  it("syncToXML ignores recalculation folders that are absent from the model list", async () => {
    const referenceDir = fixtureXMLDir()
    const convertedDir = join(tmpDir, "converted")
    const outputDir = join(tmpDir, "xml")
    await convert(referenceDir, convertedDir)
    const staleDir = join(convertedDir, REGISTER_NAME, "Перерасчеты", "ЛишнийПерерасчет")
    fs.mkdirSync(staleDir, { recursive: true })
    fs.writeFileSync(join(staleDir, "Recalculation.xml"), "<stale/>", "utf8")
    const manifest = new XmlSyncManifest(outputDir)
    await sync(referenceDir, convertedDir, outputDir, manifest)
    expect(fs.existsSync(join(outputDir, REGISTER_NAME, "Recalculations", "ЛишнийПерерасчет.xml"))).toBe(false)
    expect(manifest.expectedFiles()).not.toContain(`${REGISTER_NAME}/Recalculations/ЛишнийПерерасчет.xml`)
  })

  it("syncToXML restores listed recalculation XML from reference when nkdk file is missing", async () => {
    const referenceDir = fixtureXMLDir()
    const convertedDir = join(tmpDir, "converted")
    const outputDir = join(tmpDir, "xml")
    await convert(referenceDir, convertedDir)
    fs.rmSync(join(convertedDir, REGISTER_NAME, "Перерасчеты", RECALCULATION_NAME, "Recalculation.xml"))
    const manifest = new XmlSyncManifest(outputDir)
    await sync(referenceDir, convertedDir, outputDir, manifest)
    expect(fs.readFileSync(recalculationXML(outputDir), "utf8")).toBe(
      fs.readFileSync(recalculationXML(referenceDir), "utf8")
    )
    expect(manifest.expectedFiles()).toContain(`${REGISTER_NAME}/Recalculations/${RECALCULATION_NAME}.xml`)
  })
})

const fixtureXMLDir = () =>
  join(import.meta.dirname, "../../appliedObjects/metadataCalculationRegister/__fixtures__/sync/xml")
const recalculationXML = (base: string) =>
  join(base, REGISTER_NAME, "Recalculations", `${RECALCULATION_NAME}.xml`)

async function convert(referenceDir: string, convertedDir: string): Promise<void> {
  void referenceDir
  fs.cpSync(join(import.meta.dirname, "../../appliedObjects/metadataCalculationRegister/__fixtures__/sync/yaml"), convertedDir, {
    recursive: true,
  })
}

async function sync(
  referenceDir: string,
  convertedDir: string,
  outputDir: string,
  xmlManifest?: XmlSyncManifest
): Promise<void> {
  await syncAppliedObjectToXML({
    rule: MetadataCalculationRegisterRules,
    context: mockContextToXML(),
    inputDir: convertedDir,
    name: REGISTER_NAME,
    outputDir,
    referenceDir,
    externalOutputDir: join(outputDir, REGISTER_NAME),
    externalReferenceDir: join(referenceDir, REGISTER_NAME),
    xmlManifest,
  })
}

async function syncConverted(): Promise<{ referenceDir: string; outputDir: string }> {
  const referenceDir = fixtureXMLDir()
  const convertedDir = join(tmpDir, "converted")
  const outputDir = join(tmpDir, "xml")
  await convert(referenceDir, convertedDir)
  await sync(referenceDir, convertedDir, outputDir)
  return { referenceDir, outputDir }
}
