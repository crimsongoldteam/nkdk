import fs from "fs"
import os from "os"
import { join } from "path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { XmlSyncManifest } from "~/metadata/appliedObjects/configuration/migrations/xmlManifest"
import { mockContextFromXML, mockContextToXML } from "~/tests/mockContext"
import { getXMLFixtureDir, readXMLFixtureAsString } from "~/tests/readFixtureXML"
import { convertFormFromXML } from "./convertFromXML"
import { syncFormToXML } from "./syncToXML"

describe("sync ClientApplicationForm to XML", () => {
  const inputDir = getXMLFixtureDir(import.meta.url, "sync/yaml")
  const referenceDir = getXMLFixtureDir(import.meta.url, "sync/xml/Forms")
  const formName = "ФормаЭлемента"
  let outputDir: string

  beforeEach(() => {
    outputDir = fs.mkdtempSync(join(os.tmpdir(), "nakidka-form-sync-"))
  })

  afterEach(() => {
    fs.rmSync(outputDir, { recursive: true, force: true })
  })

  it("читает форму из YAML и экспортирует XML", async () => {
    const tmpRoot = fs.mkdtempSync(join(os.tmpdir(), "nakidka-form-yaml-only-"))
    const tmpInputDir = join(tmpRoot, "yaml")

    try {
      fs.cpSync(inputDir, tmpInputDir, { recursive: true })

      await syncFormToXML({
        context: mockContextToXML(),
        inputDir: tmpInputDir,
        outputDir: outputDir,
        referenceDir: referenceDir,
        formName,
      })
    } finally {
      fs.rmSync(tmpRoot, { recursive: true, force: true })
    }

    const expectedFormXML = readXMLFixtureAsString(
      import.meta.url,
      join("sync/xml/Forms", formName, "Ext", "Form.xml")
    )
    const expectedMetadataXML = readXMLFixtureAsString(
      import.meta.url,
      join("sync/xml/Forms", "ФормаЭлемента.xml")
    )

    const resultFormXML = fs.readFileSync(join(outputDir, "Forms", formName, "Ext", "Form.xml"), "utf-8")
    const resultMetadataXML = fs.readFileSync(join(outputDir, "Forms", "ФормаЭлемента.xml"), "utf-8")

    expect(resultFormXML).toBe(expectedFormXML)
    expect(resultMetadataXML).toBe(expectedMetadataXML)
  })

  it("не накапливает состояние нумерации в родительском контексте между формами", async () => {
    const tmpRoot = fs.mkdtempSync(join(os.tmpdir(), "nakidka-form-numbering-"))
    const tmpInputDir = join(tmpRoot, "yaml")
    const tmpReferenceDir = join(tmpRoot, "reference-forms")
    const tmpOutputDir = join(tmpRoot, "out")
    const secondFormName = "ФормаВторая"

    try {
      fs.cpSync(inputDir, tmpInputDir, { recursive: true })
      fs.cpSync(referenceDir, tmpReferenceDir, { recursive: true })
      fs.cpSync(join(inputDir, "Формы", formName), join(tmpInputDir, "Формы", secondFormName), {
        recursive: true,
      })
      fs.cpSync(join(referenceDir, `${formName}.xml`), join(tmpReferenceDir, `${secondFormName}.xml`))
      fs.cpSync(join(referenceDir, formName), join(tmpReferenceDir, secondFormName), { recursive: true })

      const context = mockContextToXML()

      await syncFormToXML({
        context,
        inputDir: tmpInputDir,
        outputDir: tmpOutputDir,
        referenceDir: tmpReferenceDir,
        formName,
      })

      expect(fs.existsSync(join(tmpOutputDir, "Forms", formName, "Ext", "Form.xml"))).toBe(true)
      expect(context.exportToXML.context?.metadataForNumbering).toHaveLength(0)
      expect(context.exportToXML.context?.propertiesItemXmlStack).toBeUndefined()

      await syncFormToXML({
        context,
        inputDir: tmpInputDir,
        outputDir: tmpOutputDir,
        referenceDir: tmpReferenceDir,
        formName: secondFormName,
      })

      expect(fs.existsSync(join(tmpOutputDir, "Forms", secondFormName, "Ext", "Form.xml"))).toBe(true)
      expect(context.exportToXML.context?.metadataForNumbering).toHaveLength(0)
      expect(context.exportToXML.context?.propertiesItemXmlStack).toBeUndefined()
    } finally {
      fs.rmSync(tmpRoot, { recursive: true, force: true })
    }
  })

  it("восстанавливает внешние картинки элементов формы из YAML и добавляет их в manifest", async () => {
    const tmpRoot = fs.mkdtempSync(join(os.tmpdir(), "nakidka-form-item-pictures-to-xml-"))
    const tmpInputDir = join(tmpRoot, "yaml")
    const tmpReferenceDir = join(tmpRoot, "reference-forms")
    const xmlManifest = new XmlSyncManifest(outputDir)

    try {
      fs.cpSync(inputDir, tmpInputDir, { recursive: true })
      fs.cpSync(referenceDir, tmpReferenceDir, { recursive: true })
      fs.mkdirSync(join(tmpInputDir, "Формы", formName, "Картинки"), { recursive: true })
      fs.mkdirSync(join(tmpInputDir, "Формы", formName, "КартинкиЗначений"), { recursive: true })
      fs.writeFileSync(join(tmpInputDir, "Формы", formName, "Картинки", "Декорация2.png"), Buffer.from([1, 2, 3]))
      fs.writeFileSync(join(tmpInputDir, "Формы", formName, "КартинкиЗначений", "Статус.bmp"), Buffer.from([4, 5, 6]))

      await syncFormToXML({
        context: mockContextToXML(),
        inputDir: tmpInputDir,
        outputDir,
        referenceDir: tmpReferenceDir,
        formName,
        xmlManifest,
      })

      const picturePath = join(outputDir, "Forms", formName, "Ext", "Form", "Items", "Декорация2", "Picture.png")
      const valuesPicturePath = join(
        outputDir,
        "Forms",
        formName,
        "Ext",
        "Form",
        "Items",
        "Статус",
        "ValuesPicture.bmp"
      )

      expect([...fs.readFileSync(picturePath)]).toEqual([1, 2, 3])
      expect([...fs.readFileSync(valuesPicturePath)]).toEqual([4, 5, 6])
      expect(xmlManifest.expectedFiles()).toContain("Forms/ФормаЭлемента/Ext/Form/Items/Декорация2/Picture.png")
      expect(xmlManifest.expectedFiles()).toContain("Forms/ФормаЭлемента/Ext/Form/Items/Статус/ValuesPicture.bmp")
    } finally {
      fs.rmSync(tmpRoot, { recursive: true, force: true })
    }
  })
})

describe("round-trip: withDynamicList XML → YAML+bsl → XML", () => {
  const xmlFixturesDir = getXMLFixtureDir(import.meta.url, "sync/xml/Forms")
  const formName = "withDynamicList"
  let tmpDir: string

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(join(os.tmpdir(), "nakidka-roundtrip-"))
    // Шаг 1: экспортируем XML → YAML+bsl (в tmp)
    await convertFormFromXML({
      context: mockContextFromXML(),
      inputDir: xmlFixturesDir,
      formName,
      outputDir: tmpDir,
    })
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true })
  })

  it("должен восстановить идентичный XML из YAML+bsl", async () => {
    const xmlOutDir = join(tmpDir, "xml-out")

    // Шаг 2: импортируем YAML+bsl → XML
    await syncFormToXML({
      context: mockContextToXML(),
      inputDir: tmpDir,
      referenceDir: xmlFixturesDir,
      formName,
      outputDir: xmlOutDir,
    })

    const expectedFormXML = readXMLFixtureAsString(
      import.meta.url,
      join("sync/xml/Forms", formName, "Ext", "Form.xml")
    )

    const resultFormXML = fs.readFileSync(join(xmlOutDir, "Forms", formName, "Ext", "Form.xml"), "utf-8")
    expect(resultFormXML).toBe(expectedFormXML)
  })
})
