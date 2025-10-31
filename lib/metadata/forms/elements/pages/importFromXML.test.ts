import { expect, it } from "vitest"
import { TUsualGroup } from "../usualGroup/types"
import { importUsualGroupFromXML } from "../usualGroup/importFromXML"
import { TUsualGroupXML } from "../usualGroup/types"
import { xmlImport } from "~/lib"
import { ZElementType } from "../types"

it("should import usual group from XML", () => {
  const mockXml = `	<UsualGroup name="Группа" id="1">
    <Title>
      <v8:item>
        <v8:lang>ru</v8:lang>
        <v8:content>Заголовок группы</v8:content>
      </v8:item>
    </Title>
  </UsualGroup>`

  const mockResult: TUsualGroup = {
    name: "Группа",
    title: { ru: "Заголовок группы" },
    id: "1",
    childItems: [],
    elementType: ZElementType.enum.UsualGroup,
  }

  const xmlData = xmlImport<TUsualGroupXML>(mockXml)

  const input = importUsualGroupFromXML(xmlData)

  expect(input).toEqual(mockResult)
})
