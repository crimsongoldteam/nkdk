import { expect, it } from "vitest"
import { TUsualGroup } from "./types"
import { importUsualGroupFromXML } from "./importFromXML"
import { TUsualGroupXML } from "./types"
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

  const xmlData = xmlImport<{ UsualGroup: TUsualGroupXML }>(mockXml)
  const value = xmlData.UsualGroup

  const input = importUsualGroupFromXML(value)

  expect(input).toEqual(mockResult)
})
