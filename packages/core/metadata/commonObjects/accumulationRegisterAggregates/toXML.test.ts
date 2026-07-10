import { readFileSync } from "fs"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { exportMetadataItemToXML, importMetadataItemFromXML } from "../../orchestration"
import { mockContextFromXML, mockContextToXML } from "../../../tests/mockContext"
import { xmlExport } from "../../../xml/export/exporter"
import { aggregates, currentRegisterName } from "./__fixtures__/data"
import { AccumulationRegisterAggregatesRules } from "./rules"

import "./register"

const aggregatesXmlPath = join(
  __dirname,
  "../../appliedObjects/metadataAccumulationRegister/__fixtures__/sync/xml/РегистрНакопленияВсеСвойстваОбороты/Ext/Aggregates.xml"
)

describe("export AccumulationRegisterAggregates to XML", () => {
  it("round-trips real Aggregates.xml and restores dimension refs from current register context", () => {
    const source = readFileSync(aggregatesXmlPath, "utf-8").trimEnd()
    const reference = importMetadataItemFromXML({
      context: mockContextFromXML({ forReference: true }),
      rule: AccumulationRegisterAggregatesRules,
      xmlString: source,
    })

    const context = mockContextToXML()
    context.exportToXML.context!.parentName = currentRegisterName

    const xmlObj = exportMetadataItemToXML({
      context,
      data: aggregates,
      referenceData: reference,
      rule: AccumulationRegisterAggregatesRules,
    })

    expect(normalizeLineEndings(xmlExport(xmlObj!))).toEqual(normalizeLineEndings(source))
  })
})

const normalizeLineEndings = (value: string): string => value.replace(/\r\n/g, "\n")
