import { expect, it } from "vitest"
import importPictureDecorationFromXML from "./importFromXML"
import { ElementType } from "~/lib/metadata/systemEnumerations/types"
import { TPictureDecoration, TPictureDecorationXML } from "./types"
import { xmlImport } from "~/lib"

it("should import name from XML", () => {
  const mockXml = `<PictureDecoration name="ПереданВАрхивИлиУничтоженКартинка" id="1">
					<Picture>
						<xr:Ref>CommonPicture.ИнформацияБЭД</xr:Ref>
						<xr:LoadTransparent>false</xr:LoadTransparent>
					</Picture>
				</PictureDecoration>`

  const expectedResult: TPictureDecoration = {
    name: "ПереданВАрхивИлиУничтоженКартинка",
    type: ElementType.PictureDecoration,
    picture: {
      ref: "ИнформацияБЭД",
      type: "CommonPicture",
      loadTransparent: false,
    },
    id: "1",
  }

  const xml = xmlImport<TPictureDecorationXML>(mockXml)

  const input = importPictureDecorationFromXML(xml)

  expect(input).toEqual(expectedResult)
})
