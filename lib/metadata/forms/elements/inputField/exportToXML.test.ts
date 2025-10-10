// import { expect, it } from "vitest"
// import { TInputField, TInputFieldXML } from "./types"
// import exportInputFieldToXML from "./exportToXML"
// import xmlExport from "~/lib/xml/export/exporter"

// const mockElement: TInputField = {
//   id: "16",
//   name: "ИмяПоля",
//   title: { ru: "Поле" },
// }

// const mockXml: TInputFieldXML = {
//   InputField: {
//     _name: "ИмяПоля",
//     _id: "16",
//     Title: [{ "v8:item": { "v8:lang": "ru", "v8:content": "Поле" } }],
//   },
// }

// const mockXmlString = `<InputField name="ИмяПоля" id="16">
//   <Title>
//     <v8:item>
//       <v8:lang>ru</v8:lang>
//       <v8:content>Поле</v8:content>
//     </v8:item>
//   </Title>
// </InputField>`

// it("should export to XML-structure", () => {
//   const input = exportInputFieldToXML(mockElement)

//   expect(input).toEqual(mockXml)
// })

// it("should export to XML-string", () => {
//   const xml = xmlExport<TInputFieldXML>(mockXml, false)

//   expect(xml).toEqual(mockXmlString)
// })
