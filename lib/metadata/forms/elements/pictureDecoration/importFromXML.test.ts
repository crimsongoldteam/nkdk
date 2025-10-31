import { expect, it } from "vitest"
import { importPictureDecorationFromXML } from "./importFromXML"
import { ZElementType } from "../types"
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
    elementType: ZElementType.enum.PictureDecoration,
    picture: {
      ref: "ИнформацияБЭД",
      type: "CommonPicture",
      loadTransparent: false,
    },
    id: "1",
  }

  const xml = xmlImport<{ PictureDecoration: TPictureDecorationXML }>(mockXml)
  const value = xml.PictureDecoration

  const input = importPictureDecorationFromXML(value)

  expect(input).toEqual(expectedResult)
})
