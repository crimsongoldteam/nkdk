import { importUserVisibleFromXML } from "~/packages/core/metadata/commonObjects/userVisible/importFromXML"
import { Context } from "~/packages/core/metadata/context/types"
import { CommandBar, CommandBarXML } from "~/packages/core/metadata/forms/elements/commandBar/types"
import { importFormGroupFromXML } from "~/packages/core/metadata/forms/elements/formGroup/importFromXML"
import { compactObject } from "~/packages/core/metadata/helpers/compactObject"
import { registerMetadata } from "~/packages/core/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/packages/core/metadata/metadataFactory/types"

export const importCommandBarFromXML = (context: Context, xml: CommandBarXML | undefined): CommandBar | undefined => {
  if (!xml) return undefined

  return compactObject({
    ...importFormGroupFromXML(context, xml)!,
    elementType: FormElementType.CommandBar,

    autofill: xml.Autofill,
    displayImportance: xml._DisplayImportance,
    horizontalAlign: xml.HorizontalAlign,
    userVisible: importUserVisibleFromXML(context, xml.UserVisible),
  })
}

registerMetadata<CommandBarXML>("ImportFromXML", "CommandBar", importCommandBarFromXML)
