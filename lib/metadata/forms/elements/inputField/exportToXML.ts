import { TI8nTextXML } from "~/lib/metadata/i8nText/types"
import { TInputField, TInputFieldXML } from "./types"
import exportI8nXmlTextToXML from "~/lib/metadata/i8nText/exportI8nTextToXML"

export default function exportInputFieldToXML(element: TInputField): TInputFieldXML {
  let title: TI8nTextXML | undefined
  if (element.title?.ru && element.title?.ru !== element.name) {
    title = exportI8nXmlTextToXML(element.title)
  } else {
    title = undefined
  }

  const result: TInputFieldXML = {
    InputField: {
      _name: element.name,
      _id: element.id ?? "",

      // <DataPath>Фамилия</DataPath>
      // <ExtendedEditMultipleValues>true</ExtendedEditMultipleValues>
      // <ContextMenu name="ФамилияКонтекстноеМеню" id="2"/>
      // <ExtendedTooltip name="ФамилияРасширеннаяПодсказка" id="3"/>

      DataPath: element.name,
      // ExtendedEditMultipleValues: true,
      // ContextMenu: {
      //   _name: element.contextMenu?.name ?? "",
      //   _id: element.contextMenu?.id ?? "",
      // },
      // ExtendedTooltip: {
      //   _name: element.extendedTooltip?.name ?? "",
      //   _id: element.extendedTooltip?.id ?? "",
      // },
      Title: title,
    },
  }
  return result
}
