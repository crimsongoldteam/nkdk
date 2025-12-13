import { expect, it } from "vitest"
import { importPictureDecorationFromXML } from "./importFromXML"
import { FormElementType } from "../types"
import { TPictureDecoration, TPictureDecorationXML } from "./types"
import { xmlImport } from "~/lib"
import z from "zod"
import { ZPictureDecorationXML } from "./types"

it("should import name from XML", () => {
  const mockXml = `<PictureDecoration name="ПереданВАрхивИлиУничтоженКартинка" id="1">
					<Picture>
						<xr:Ref>CommonPicture.ИнформацияБЭД</xr:Ref>
						<xr:LoadTransparent>false</xr:LoadTransparent>
					</Picture>
				</PictureDecoration>`

  const expectedResult: TPictureDecoration = {
    name: "ПереданВАрхивИлиУничтоженКартинка",
    elementType: FormElementType.PictureDecoration,
    picture: {
      ref: "ИнформацияБЭД",
      type: "CommonPicture",
      loadTransparent: false,
    },
    id: "1",
  }

  const xml = xmlImport<{ PictureDecoration: TPictureDecorationXML }>(
    mockXml,
    z.object({ PictureDecoration: ZPictureDecorationXML })
  )

  const input = importPictureDecorationFromXML(xml.PictureDecoration)

  expect(input).toEqual(expectedResult)
})
