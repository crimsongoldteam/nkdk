import fs from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { beforeEach, describe, expect, it } from "vitest"
import { getXMLFixturePath, readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { CONFIGURATION_XML_FILE } from "./rootIO"
import { shortRoundTripXML } from "./shortRoundTripXML"

const normalizeXML = (value: string) => value.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\n$/, "")

describe("shortRoundTripXML", () => {
  const inputDir = getXMLFixturePath("sync/syncConfiguration/xml")
  const outputDir = getXMLFixturePath("sync/syncConfiguration/out-round-trip")

  beforeEach(() => {
    if (fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true })
    }
  })

  it("round-trip XML -> модель -> XML должен быть идемпотентным для зарегистрированных типов", async () => {
    await shortRoundTripXML({ inputDir, outputDir })

    const expectedCatalogXML = readXMLFileAsString("sync/syncConfiguration/xml/Catalogs/Контрагенты.xml")
    const resultCatalogXML = fs.readFileSync(join(outputDir, "Catalogs", "Контрагенты.xml"), "utf-8")
    expect(resultCatalogXML).toBe(expectedCatalogXML)

    const expectedDocumentXML = readXMLFileAsString("sync/syncConfiguration/xml/Documents/ДокументПоУмолчанию.xml")
    const resultDocumentXML = fs.readFileSync(join(outputDir, "Documents", "ДокументПоУмолчанию.xml"), "utf-8")
    expect(resultDocumentXML).toBe(expectedDocumentXML)

    const expectedNumeratorXML = readXMLFileAsString(
      "sync/syncConfiguration/xml/DocumentNumerators/НумераторПоУмолчанию.xml"
    )
    const resultNumeratorXML = fs.readFileSync(
      join(outputDir, "DocumentNumerators", "НумераторПоУмолчанию.xml"),
      "utf-8"
    )
    expect(resultNumeratorXML).toBe(expectedNumeratorXML)

    const expectedSequenceXML = readXMLFileAsString(
      "sync/syncConfiguration/xml/Sequences/ПоследовательностьПоУмолчанию.xml"
    )
    const resultSequenceXML = fs.readFileSync(
      join(outputDir, "Sequences", "ПоследовательностьПоУмолчанию.xml"),
      "utf-8"
    )
    expect(resultSequenceXML).toBe(expectedSequenceXML)

    const expectedFormXML = readXMLFileAsString(
      "sync/syncConfiguration/xml/Catalogs/Контрагенты/Forms/ФормаЭлемента/Ext/Form.xml"
    )
    const resultFormXML = fs.readFileSync(
      join(outputDir, "Catalogs", "Контрагенты", "Forms", "ФормаЭлемента", "Ext", "Form.xml"),
      "utf-8"
    )
    expect(resultFormXML).toBe(expectedFormXML)

    const expectedFormMetaXML = readXMLFileAsString(
      "sync/syncConfiguration/xml/Catalogs/Контрагенты/Forms/ФормаЭлемента.xml"
    )
    const resultFormMetaXML = fs.readFileSync(
      join(outputDir, "Catalogs", "Контрагенты", "Forms", "ФормаЭлемента.xml"),
      "utf-8"
    )
    expect(resultFormMetaXML).toBe(expectedFormMetaXML)
  })

  it("включает корневой Configuration.xml в short round-trip", async () => {
    const rootInputDir = fs.mkdtempSync(join(tmpdir(), "short-round-trip-root-"))
    const rootOutputDir = fs.mkdtempSync(join(tmpdir(), "short-round-trip-root-out-"))
    try {
      fs.copyFileSync(getXMLFixturePath("configuration/full.xml"), join(rootInputDir, CONFIGURATION_XML_FILE))

      await shortRoundTripXML({ inputDir: rootInputDir, outputDir: rootOutputDir })

      const actual = fs.readFileSync(join(rootOutputDir, CONFIGURATION_XML_FILE), "utf-8")
      expect(normalizeXML(actual)).toBe(normalizeXML(readXMLFileAsString("configuration/full.xml")))
    } finally {
      fs.rmSync(rootInputDir, { recursive: true, force: true })
      fs.rmSync(rootOutputDir, { recursive: true, force: true })
    }
  })

  it("останавливается на первой ошибке round-trip объекта", async () => {
    const brokenInputDir = fs.mkdtempSync(join(tmpdir(), "short-round-trip-object-"))
    const brokenOutputDir = fs.mkdtempSync(join(tmpdir(), "short-round-trip-object-out-"))
    fs.mkdirSync(join(brokenInputDir, "Catalogs"), { recursive: true })
    fs.writeFileSync(join(brokenInputDir, "Catalogs", "Сломанный.xml"), "<broken", "utf-8")

    await expect(shortRoundTripXML({ inputDir: brokenInputDir, outputDir: brokenOutputDir })).rejects.toThrow(
      'Ошибка round-trip объекта "Catalogs/Сломанный"'
    )
  })

  it("останавливается на первой ошибке round-trip формы", async () => {
    const brokenInputDir = fs.mkdtempSync(join(tmpdir(), "short-round-trip-form-"))
    const brokenOutputDir = fs.mkdtempSync(join(tmpdir(), "short-round-trip-form-out-"))
    const catalogInputDir = join(brokenInputDir, "Catalogs")
    const catalogFixtureDir = join(inputDir, "Catalogs")

    fs.mkdirSync(catalogInputDir, { recursive: true })
    fs.copyFileSync(join(catalogFixtureDir, "Контрагенты.xml"), join(catalogInputDir, "Контрагенты.xml"))
    fs.cpSync(join(catalogFixtureDir, "Контрагенты"), join(catalogInputDir, "Контрагенты"), { recursive: true })
    fs.writeFileSync(
      join(catalogInputDir, "Контрагенты", "Forms", "ФормаЭлемента", "Ext", "Form.xml"),
      "<broken",
      "utf-8"
    )

    await expect(shortRoundTripXML({ inputDir: brokenInputDir, outputDir: brokenOutputDir })).rejects.toThrow(
      'Ошибка round-trip формы "Catalogs/Контрагенты/ФормаЭлемента"'
    )
  })
})
