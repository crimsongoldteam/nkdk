// import exportInputFieldToXML from "../inputField/exportToXML"
// import { TAttributeXML, TClientApplicationForm, TClientApplicationFormXML } from "./types"

// export default function exportClientApplicationFormToXML(element: TClientApplicationForm): TClientApplicationFormXML {
//   let attributes: TAttributeXML[] = [
//     {
//       Attribute: {
//         _name: "Объект",
//         _id: "1",
//         Type: {
//           "v8:Type": ["cfg:DataProcessorObject.ТестоваяОбработка"],
//         },
//         MainAttribute: true,
//       },
//     },
//   ]
//   let index = 2
//   element.items.forEach((item) => {
//     if (item.id) {
//       attributes.push({
//         Attribute: {
//           _name: item.name,
//           _id: index.toString(),
//           Title: [
//             {
//               "v8:item": {
//                 "v8:lang": "ru",
//                 "v8:content": item.name,
//               },
//             },
//           ],
//           Type: {
//             "v8:Type": ["xs:string"],
//             "v8:StringQualifiers": {
//               "v8:Length": 0,
//               "v8:AllowedLength": "Variable",
//             },
//           },
//         },
//       })
//       index++
//     }
//   })

//   const result: TClientApplicationFormXML = {
//     Form: {
//       _xmlns: "http://v8.1c.ru/8.3/xcf/logform",
//       "_xmlns:app": "http://v8.1c.ru/8.2/managed-application/core",
//       "_xmlns:cfg": "http://v8.1c.ru/8.1/data/enterprise/current-config",
//       "_xmlns:dcscor": "http://v8.1c.ru/8.1/data-composition-system/core",
//       "_xmlns:dcssch": "http://v8.1c.ru/8.1/data-composition-system/schema",
//       "_xmlns:dcsset": "http://v8.1c.ru/8.1/data-composition-system/settings",
//       "_xmlns:ent": "http://v8.1c.ru/8.1/data/enterprise",
//       "_xmlns:lf": "http://v8.1c.ru/8.2/managed-application/logform",
//       "_xmlns:style": "http://v8.1c.ru/8.1/data/ui/style",
//       "_xmlns:sys": "http://v8.1c.ru/8.1/data/ui/fonts/system",
//       "_xmlns:v8": "http://v8.1c.ru/8.1/data/core",
//       "_xmlns:v8ui": "http://v8.1c.ru/8.1/data/ui",
//       "_xmlns:web": "http://v8.1c.ru/8.1/data/ui/colors/web",
//       "_xmlns:win": "http://v8.1c.ru/8.1/data/ui/colors/windows",
//       "_xmlns:xr": "http://v8.1c.ru/8.3/xcf/readable",
//       "_xmlns:xs": "http://www.w3.org/2001/XMLSchema",
//       "_xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
//       _version: "2.20",
//       AutoCommandBar: {
//         _name: "ФормаКоманднаяПанель",
//         _id: "-1",
//       },
//       ChildItems: element.items.map((item) => exportInputFieldToXML(item)),

//       Attributes: attributes,
//     },
//   }
//   return result
// }
