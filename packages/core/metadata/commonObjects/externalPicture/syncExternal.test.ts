import fs from "fs"
import { join } from "path"
import { afterEach, describe, expect, it } from "vitest"
import { XmlSyncManifest } from "~/metadata/appliedObjects/configuration/migrations/xmlManifest"
import { syncExternalPictureFromXML } from "./fromXML"
import { syncExternalPictureToXML } from "./toXML"

const tmpRoot = join(process.cwd(), "tmp", "external-picture-test")
const rule = {
  type: "ExternalPicture",
  nkdkDir: "Картинка",
  xmlPath: "Ext/Picture.xml",
  payloadXmlDir: "Ext/Picture",
} as const

afterEach(() => {
  fs.rmSync(tmpRoot, { recursive: true, force: true })
})

describe("ExternalPicture sync", () => {
  it("copies root Picture.xml and payload without object name", async () => {
    fs.rmSync(tmpRoot, { recursive: true, force: true })
    const xmlDir = join(tmpRoot, "xml")
    const nkdkDir = join(tmpRoot, "nkdk")
    const outDir = join(tmpRoot, "out")
    const rootRule = {
      type: "ExternalPicture" as const,
      nkdkDir: "Заставка",
      xmlPath: "Ext/Splash.xml",
      payloadXmlDir: "Ext/Splash",
    }

    fs.mkdirSync(join(xmlDir, "Ext", "Splash"), { recursive: true })
    fs.writeFileSync(join(xmlDir, "Ext", "Splash.xml"), "<ExtPicture/>")
    fs.writeFileSync(join(xmlDir, "Ext", "Splash", "Picture.png"), Buffer.from([137, 80, 78, 71]))

    await syncExternalPictureFromXML({ rule: rootRule, xmlDir, nkdkDir })
    expect(fs.readFileSync(join(nkdkDir, "Заставка", "Splash.xml"), "utf-8")).toBe("<ExtPicture/>")
    expect([...fs.readFileSync(join(nkdkDir, "Заставка", "Picture.png"))]).toEqual([137, 80, 78, 71])

    const xmlManifest = new XmlSyncManifest(outDir)
    await syncExternalPictureToXML({ rule: rootRule, nkdkDir, xmlDir: outDir, xmlManifest })
    expect(fs.readFileSync(join(outDir, "Ext", "Splash.xml"), "utf-8")).toBe("<ExtPicture/>")
    expect([...fs.readFileSync(join(outDir, "Ext", "Splash", "Picture.png"))]).toEqual([137, 80, 78, 71])
    expect([...xmlManifest.expectedFiles()]).toEqual(expect.arrayContaining(["Ext/Splash.xml", "Ext/Splash/Picture.png"]))
  })

  it("copies Picture.xml and binary payload from XML to nkdk", async () => {
    fs.rmSync(tmpRoot, { recursive: true, force: true })
    const xmlDir = join(tmpRoot, "xml", "CommonPictures")
    const nkdkDir = join(tmpRoot, "nkdk", "ОбщаяКартинкаВсеСвойства")
    fs.mkdirSync(join(xmlDir, "ОбщаяКартинкаВсеСвойства", "Ext", "Picture"), { recursive: true })
    fs.writeFileSync(join(xmlDir, "ОбщаяКартинкаВсеСвойства", "Ext", "Picture.xml"), "<ExtPicture/>")
    fs.writeFileSync(join(xmlDir, "ОбщаяКартинкаВсеСвойства", "Ext", "Picture", "Picture.zip"), Buffer.from([0, 1, 2, 255]))

    await syncExternalPictureFromXML({ rule, xmlDir, nkdkDir, name: "ОбщаяКартинкаВсеСвойства" })

    expect(fs.readFileSync(join(nkdkDir, "Картинка", "Picture.xml"), "utf-8")).toBe("<ExtPicture/>")
    expect([...fs.readFileSync(join(nkdkDir, "Картинка", "Picture.zip"))]).toEqual([0, 1, 2, 255])
  })

  it("copies Picture.xml and binary payload from nkdk to XML", async () => {
    fs.rmSync(tmpRoot, { recursive: true, force: true })
    const xmlDir = join(tmpRoot, "xml", "CommonPictures")
    const nkdkDir = join(tmpRoot, "nkdk", "ОбщаяКартинкаВсеСвойства")
    fs.mkdirSync(join(nkdkDir, "Картинка"), { recursive: true })
    fs.writeFileSync(join(nkdkDir, "Картинка", "Picture.xml"), "<ExtPicture/>")
    fs.writeFileSync(join(nkdkDir, "Картинка", "Picture.png"), Buffer.from([137, 80, 78, 71]))

    await syncExternalPictureToXML({ rule, nkdkDir, xmlDir, name: "ОбщаяКартинкаВсеСвойства" })

    expect(fs.readFileSync(join(xmlDir, "ОбщаяКартинкаВсеСвойства", "Ext", "Picture.xml"), "utf-8")).toBe(
      "<ExtPicture/>",
    )
    expect([...fs.readFileSync(join(xmlDir, "ОбщаяКартинкаВсеСвойства", "Ext", "Picture", "Picture.png"))]).toEqual([
      137,
      80,
      78,
      71,
    ])
  })

  it("does not duplicate object name when XML dir already points at object dir", async () => {
    fs.rmSync(tmpRoot, { recursive: true, force: true })
    const xmlDir = join(tmpRoot, "xml", "CommonPictures", "ОбщаяКартинкаВсеСвойства")
    const nkdkDir = join(tmpRoot, "nkdk", "ОбщаяКартинкаВсеСвойства")
    fs.mkdirSync(join(nkdkDir, "Картинка"), { recursive: true })
    fs.writeFileSync(join(nkdkDir, "Картинка", "Picture.xml"), "<ExtPicture/>")
    fs.writeFileSync(join(nkdkDir, "Картинка", "Picture.png"), Buffer.from([137, 80, 78, 71]))

    await syncExternalPictureToXML({ rule, nkdkDir, xmlDir, name: "ОбщаяКартинкаВсеСвойства" })

    expect(fs.readFileSync(join(xmlDir, "Ext", "Picture.xml"), "utf-8")).toBe("<ExtPicture/>")
    expect([...fs.readFileSync(join(xmlDir, "Ext", "Picture", "Picture.png"))]).toEqual([137, 80, 78, 71])
    expect(
      fs.existsSync(join(xmlDir, "ОбщаяКартинкаВсеСвойства", "Ext", "Picture.xml")),
    ).toBe(false)
    expect(
      fs.existsSync(join(xmlDir, "ОбщаяКартинкаВсеСвойства", "Ext", "Picture", "Picture.png")),
    ).toBe(false)
  })
})
