import fs from "fs"
import os from "os"
import { join } from "path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { MetadataCalculationRegisterRules } from "../../appliedObjects/metadataCalculationRegister/rules"
import { XmlSyncManifest } from "../../appliedObjects/configuration/migrations/xmlManifest"
import { convertAppliedObjectFromXML } from "../../orchestration/appliedObject/convertFromXML"
import { syncAppliedObjectToXML } from "../../orchestration/appliedObject/syncToXML"
import { mockContextFromXML, mockContextToXML } from "../../../tests/mockContext"

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
  it("convertFromXML copies full recalculation XML to nkdk", async () => {
    const inputDir = join(import.meta.dirname, "../../appliedObjects/metadataCalculationRegister/__fixtures__/sync/xml")
    const outputDir = join(tmpDir, "nkdk")

    await convertAppliedObjectFromXML({
      rule: MetadataCalculationRegisterRules,
      context: mockContextFromXML(),
      inputDir,
      name: REGISTER_NAME,
      outputDir,
    })

    const resultPath = join(outputDir, REGISTER_NAME, "Перерасчеты", RECALCULATION_NAME, "Recalculation.xml")
    const expectedPath = join(inputDir, REGISTER_NAME, "Recalculations", `${RECALCULATION_NAME}.xml`)

    expect(fs.readFileSync(resultPath, "utf-8")).toBe(fs.readFileSync(expectedPath, "utf-8"))
    expect(fs.readFileSync(resultPath, "utf-8")).toContain("fe3ce121-d6fc-409c-9b83-19e551d26b21")
  })

  it("syncToXML writes full recalculation XML from nkdk", async () => {
    const fixturesDir = join(import.meta.dirname, "../../appliedObjects/metadataCalculationRegister/__fixtures__/sync")
    const referenceDir = join(fixturesDir, "xml")
    const convertedDir = join(tmpDir, "converted")
    const outputDir = join(tmpDir, "xml")

    await convertAppliedObjectFromXML({
      rule: MetadataCalculationRegisterRules,
      context: mockContextFromXML(),
      inputDir: referenceDir,
      name: REGISTER_NAME,
      outputDir: convertedDir,
    })

    await syncAppliedObjectToXML({
      rule: MetadataCalculationRegisterRules,
      context: mockContextToXML(),
      inputDir: convertedDir,
      name: REGISTER_NAME,
      outputDir,
      referenceDir,
      externalOutputDir: join(outputDir, REGISTER_NAME),
      externalReferenceDir: join(referenceDir, REGISTER_NAME),
    })

    const resultPath = join(outputDir, REGISTER_NAME, "Recalculations", `${RECALCULATION_NAME}.xml`)
    const expectedPath = join(referenceDir, REGISTER_NAME, "Recalculations", `${RECALCULATION_NAME}.xml`)

    expect(fs.readFileSync(resultPath, "utf-8")).toBe(fs.readFileSync(expectedPath, "utf-8"))
    expect(fs.readFileSync(resultPath, "utf-8")).toContain("<Comment>Комментарий</Comment>")
  })

  it("syncToXML ignores recalculation folders that are absent from the model list", async () => {
    const fixturesDir = join(import.meta.dirname, "../../appliedObjects/metadataCalculationRegister/__fixtures__/sync")
    const referenceDir = join(fixturesDir, "xml")
    const convertedDir = join(tmpDir, "converted")
    const outputDir = join(tmpDir, "xml")

    await convertAppliedObjectFromXML({
      rule: MetadataCalculationRegisterRules,
      context: mockContextFromXML(),
      inputDir: referenceDir,
      name: REGISTER_NAME,
      outputDir: convertedDir,
    })

    const staleDir = join(convertedDir, REGISTER_NAME, "Перерасчеты", "ЛишнийПерерасчет")
    fs.mkdirSync(staleDir, { recursive: true })
    fs.writeFileSync(join(staleDir, "Recalculation.xml"), "<stale/>", "utf-8")

    const manifest = new XmlSyncManifest(outputDir)
    await syncAppliedObjectToXML({
      rule: MetadataCalculationRegisterRules,
      context: mockContextToXML(),
      inputDir: convertedDir,
      name: REGISTER_NAME,
      outputDir,
      referenceDir,
      externalOutputDir: join(outputDir, REGISTER_NAME),
      externalReferenceDir: join(referenceDir, REGISTER_NAME),
      xmlManifest: manifest,
    })

    expect(fs.existsSync(join(outputDir, REGISTER_NAME, "Recalculations", "ЛишнийПерерасчет.xml"))).toBe(false)
    expect(manifest.expectedFiles()).not.toContain(`${REGISTER_NAME}/Recalculations/ЛишнийПерерасчет.xml`)
  })

  it("syncToXML restores listed recalculation XML from reference when nkdk file is missing", async () => {
    const fixturesDir = join(import.meta.dirname, "../../appliedObjects/metadataCalculationRegister/__fixtures__/sync")
    const referenceDir = join(fixturesDir, "xml")
    const convertedDir = join(tmpDir, "converted")
    const outputDir = join(tmpDir, "xml")

    await convertAppliedObjectFromXML({
      rule: MetadataCalculationRegisterRules,
      context: mockContextFromXML(),
      inputDir: referenceDir,
      name: REGISTER_NAME,
      outputDir: convertedDir,
    })

    fs.rmSync(join(convertedDir, REGISTER_NAME, "Перерасчеты", RECALCULATION_NAME, "Recalculation.xml"))

    const manifest = new XmlSyncManifest(outputDir)
    await syncAppliedObjectToXML({
      rule: MetadataCalculationRegisterRules,
      context: mockContextToXML(),
      inputDir: convertedDir,
      name: REGISTER_NAME,
      outputDir,
      referenceDir,
      externalOutputDir: join(outputDir, REGISTER_NAME),
      externalReferenceDir: join(referenceDir, REGISTER_NAME),
      xmlManifest: manifest,
    })

    const resultPath = join(outputDir, REGISTER_NAME, "Recalculations", `${RECALCULATION_NAME}.xml`)
    const expectedPath = join(referenceDir, REGISTER_NAME, "Recalculations", `${RECALCULATION_NAME}.xml`)

    expect(fs.readFileSync(resultPath, "utf-8")).toBe(fs.readFileSync(expectedPath, "utf-8"))
    expect(manifest.expectedFiles()).toContain(`${REGISTER_NAME}/Recalculations/${RECALCULATION_NAME}.xml`)
  })
})
