import { describe, expect, it } from "vitest"
import { exportMetadataItemToXML } from "~/metadata/orchestration"
import { importPropertyFromXML } from "~/metadata/orchestration/property/fromXML"
import { mockContextFromXML, mockContextToXML } from "~/tests/mockContext"
import { readAndParseXMLFixture, readXMLFixtureAsString } from "~/tests/readFixtureXML"
import { xmlExport } from "~/xml/export/exporter"
import { full } from "./__fixtures__/full"
import { minimal } from "./__fixtures__/minimal"
import { MetadataDocumentNumeratorRules } from "./rules"
import { MetadataDocumentNumerator } from "./types"

const ROOT_XML_ATTRS = {
  _xmlns: "http://v8.1c.ru/8.3/MDClasses",
  "_xmlns:app": "http://v8.1c.ru/8.2/managed-application/core",
  "_xmlns:cfg": "http://v8.1c.ru/8.1/data/enterprise/current-config",
  "_xmlns:cmi": "http://v8.1c.ru/8.2/managed-application/cmi",
  "_xmlns:ent": "http://v8.1c.ru/8.1/data/enterprise",
  "_xmlns:lf": "http://v8.1c.ru/8.2/managed-application/logform",
  "_xmlns:style": "http://v8.1c.ru/8.1/data/ui/style",
  "_xmlns:sys": "http://v8.1c.ru/8.1/data/ui/fonts/system",
  "_xmlns:v8": "http://v8.1c.ru/8.1/data/core",
  "_xmlns:v8ui": "http://v8.1c.ru/8.1/data/ui",
  "_xmlns:web": "http://v8.1c.ru/8.1/data/ui/colors/web",
  "_xmlns:win": "http://v8.1c.ru/8.1/data/ui/colors/windows",
  "_xmlns:xen": "http://v8.1c.ru/8.3/xcf/enums",
  "_xmlns:xpr": "http://v8.1c.ru/8.3/xcf/predef",
  "_xmlns:xr": "http://v8.1c.ru/8.3/xcf/readable",
  "_xmlns:xs": "http://www.w3.org/2001/XMLSchema",
  "_xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
  _version: "2.20",
}

const rule = { type: "MetadataDocumentNumerator" } as const

const importFixture = (fixture: string, forReference = false): MetadataDocumentNumerator | undefined => {
  const parsed = readAndParseXMLFixture<{ MetaDataObject: unknown }>(import.meta.url, fixture)
  return importPropertyFromXML({
    context: mockContextFromXML({ forReference }),
    rule,
    value: parsed.MetaDataObject,
  }) as MetadataDocumentNumerator | undefined
}

describe("import MetadataDocumentNumerator from XML", () => {
  it("should import full", () => {
    expect(importFixture("full.xml")).toEqual(full)
  })

  it("should import minimal", () => {
    expect(importFixture("minimal.xml")).toEqual(minimal)
  })

  it.each(["full.xml", "minimal.xml"])(
    "round-trip: %s — import затем export совпадает с исходным XML",
    (fixture) => {
      const source = readXMLFixtureAsString(import.meta.url, fixture)
      const data = importFixture(fixture)
      const referenceData = importFixture(fixture, true)

      const xmlData = exportMetadataItemToXML({
        context: mockContextToXML(),
        data,
        referenceData,
        rule: MetadataDocumentNumeratorRules,
      })

      const exported = xmlExport({ MetaDataObject: { ...ROOT_XML_ATTRS, ...xmlData } })

      expect(exported).toEqual(source)
    }
  )
})
