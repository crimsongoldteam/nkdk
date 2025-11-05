import { expect, it } from "vitest"
import { importChoiceListFromXML } from "./importFromXML"
import { xmlImport } from "~/lib"
import { TChoiceListXML, ZChoiceListXML } from "./types"
import z from "zod"

it("should import choice list from XML", () => {
  const mockXml = `
		<ChoiceList>
			<xr:Item>
				<xr:Presentation/>
				<xr:CheckState>0</xr:CheckState>
				<xr:Value xsi:type="FormChoiceListDesTimeValue">
					<Presentation>
						<v8:item>
							<v8:lang>ru</v8:lang>
							<v8:content>Представление 1</v8:content>
						</v8:item>
					</Presentation>
					<Value xsi:type="xs:string">Значение 1</Value>
				</xr:Value>
			</xr:Item>
			<xr:Item>
				<xr:Presentation/>
				<xr:CheckState>1</xr:CheckState>
				<xr:Value xsi:type="FormChoiceListDesTimeValue">
					<Presentation>
						<v8:item>
							<v8:lang>ru</v8:lang>
							<v8:content>Представление 2</v8:content>
						</v8:item>
					</Presentation>
					<Value xsi:type="xs:string">Значение 2</Value>
				</xr:Value>
			</xr:Item>
		</ChoiceList>`

  const xml = xmlImport<{ ChoiceList: TChoiceListXML }>(mockXml, z.object({ ChoiceList: ZChoiceListXML }))
  const input = importChoiceListFromXML(xml.ChoiceList)

  expect(input).toEqual({
    items: [
      { presentation: { items: { ru: "Представление 1" } }, checkState: 0, value: "Значение 1" },
      { presentation: { items: { ru: "Представление 2" } }, checkState: 1, value: "Значение 2" },
    ],
  })
})
