import { expect, it } from "vitest"
import { xmlImport } from "~/lib"
import { mockcontext } from "~/lib/tests/mockContext"
import { FormElementType } from "../../../metadataFactory/types"
import { importPictureDecorationFromXML } from "./importFromXML"
import { PictureDecoration, PictureDecorationXML } from "./types"

it("should import name from XML", () => {
  const mockXml = `<PictureDecoration name="ПереданВАрхивИлиУничтоженКартинка" id="1">
					<Picture>
						<xr:Ref>CommonPicture.ИнформацияБЭД</xr:Ref>
						<xr:LoadTransparent>false</xr:LoadTransparent>
					</Picture>
				</PictureDecoration>`

  const expectedResult: PictureDecoration = {
    name: "ПереданВАрхивИлиУничтоженКартинка",
    elementType: FormElementType.PictureDecoration,
    picture: {
      ref: "ИнформацияБЭД",
      type: "CommonPicture",
      loadTransparent: false,
    },
    id: "1",
  }

  const xml = xmlImport<{ PictureDecoration: PictureDecorationXML }>(mockXml)

  const input = importPictureDecorationFromXML(mockcontext, xml.PictureDecoration)

  expect(input).toEqual(expectedResult)
})
