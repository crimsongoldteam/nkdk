import * as z from "zod"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZI8nText, ZI8nTextXML } from "~/lib/metadata/commonObjects/i8nText/types"
import { ZChildItems, ZChildItemsXML } from "../childItems/types"
import { ZFormGroup, ZFormGroupXML } from "../formGroup/types"
import { ZUse, ZUseXML } from "~/lib/metadata/commonObjects/use/types"
import { ZTypeDescription, ZTypeDescriptionXML } from "~/lib/metadata/commonObjects/typeDescription/types"
import { ZElementType } from "../types"

export const ZAutoCommandBar = z.object({
  name: z.string(),
  id: z.string(),
})

export const ZAttribute = z.object({
  name: z.string(),
  id: z.string(),
  title: ZI8nText.optional(),
  type: ZTypeDescription.optional(),
  mainAttribute: z.boolean().optional(),
  storedData: z.boolean().optional(),
  use: ZUse.optional(),
})

// export const ZAttributeEnterprise = z.union([
//   z.object({
//     Заголовок: z.string().optional(),
//     Тип: z.string().optional(),
//     ОсновнойАтрибут: ZBoolEnterprise.optional(),
//     СохраняемыеДанные: ZBoolEnterprise.optional(),
//   }),
//   ZUseEnterprise,
// ])

export const ZClientApplicationForm = z.object({
  elementType: ZElementType.enum.ClientApplicationForm,
  attributes: z.array(ZAttribute).optional(),
  autoCommandBar: ZAutoCommandBar.optional(),
  autoTitle: z.boolean().optional(),
  autoSaveDataInSettings: SE.ZAutoSaveFormDataInSettings.optional(),
  autoURL: z.boolean().optional(),
  verticalScroll: SE.ZVerticalFormScroll.optional(),
  childItemsVerticalAlign: SE.ZItemVerticalAlign.optional(),
  verticalSpacing: SE.ZFormItemSpacing.optional(),
  itemsAndTitlesAlign: SE.ZItemsAndTitlesAlignVariant.optional(),
  height: z.number().optional(),
  childItemsHorizontalAlign: SE.ZItemHorizontalLocation.optional(),
  horizontalSpacing: SE.ZFormItemSpacing.optional(),
  group: SE.ZChildFormItemsGroup.optional(),
  enabled: z.boolean().optional(),
  title: ZI8nText.optional(),
  closeOnChoice: z.boolean().optional(),
  closeOnOwnerClose: z.boolean().optional(),
  formName: z.string().optional(),
  usedFormServer: SE.ZUsedServer.optional(),
  purposeUseKey: z.string().optional(),
  windowOptionsKey: z.string().optional(),
  commandBar: ZFormGroup.optional(),
  scale: z.number().optional(),
  modalMode: z.boolean().optional(),
  modified: z.boolean().optional(),
  uRL: z.string().optional(),
  showTitle: z.boolean().optional(),
  showCloseButton: z.boolean().optional(),
  conversationsRepresentation: SE.ZFormConversationsRepresentation.optional(),
  enterKeyBehavior: SE.ZEnterKeyBehaviorType.optional(),
  childItems: ZChildItems,
  commandBarLocation: SE.ZFormCommandBarLabelLocation.optional(),
  autoFillCheck: z.boolean().optional(),
  formWindowOpeningMode: SE.ZFormWindowOpeningMode.optional(),
  collapseItemsByImportance: SE.ZCollapseFormItemsByImportance.optional(),
  saveDataInSettings: SE.ZSaveFormDataInSettings.optional(),
  savedInSettingsDataModified: z.boolean().optional(),
  readOnly: z.boolean().optional(),
  uUID: z.uuid().optional(),
  width: z.number().optional(),
  slaveItemsWidth: SE.ZChildFormItemsWidth.optional(),
})

export const ZAutoCommandBarXML = z.object({
  _name: z.string(),
  _id: z.string(),
})

export const ZConditionalAppearanceXML = z.object({
  ConditionalAppearance: z.object(),
})

export const ZAttributeXML = z.object({
  Attribute: z.object({
    _name: z.string(),
    _id: z.string(),
    Title: ZI8nTextXML.optional(),
    Type: ZTypeDescriptionXML.optional(),
    MainAttribute: z.boolean().optional(),
    StoredData: z.boolean().optional(),
    Use: ZUseXML.optional(),
  }),
})

export const ZAttributesXML = z.array(z.union([ZAttributeXML, ZConditionalAppearanceXML]))

export const ZClientApplicationFormXML = z.object({
  _xmlns: z.string().optional(),
  "_xmlns:app": z.string().optional(),
  "_xmlns:cfg": z.string().optional(),
  "_xmlns:dcscor": z.string().optional(),
  "_xmlns:dcssch": z.string().optional(),
  "_xmlns:dcsset": z.string().optional(),
  "_xmlns:ent": z.string().optional(),
  "_xmlns:lf": z.string().optional(),
  "_xmlns:style": z.string().optional(),
  "_xmlns:sys": z.string().optional(),
  "_xmlns:v8": z.string().optional(),
  "_xmlns:v8ui": z.string().optional(),
  "_xmlns:web": z.string().optional(),
  "_xmlns:win": z.string().optional(),
  "_xmlns:xr": z.string().optional(),
  "_xmlns:xs": z.string().optional(),
  "_xmlns:xsi": z.string().optional(),
  _version: z.string().optional(),
  Attributes: ZAttributesXML.optional(),
  AutoCommandBar: ZAutoCommandBarXML.optional(),
  AutoTitle: z.boolean().optional(),
  AutoSaveDataInSettings: SE.ZAutoSaveFormDataInSettings.optional(),
  AutoURL: z.boolean().optional(),
  VerticalScroll: SE.ZVerticalFormScroll.optional(),
  ChildItemsVerticalAlign: SE.ZItemVerticalAlign.optional(),
  VerticalSpacing: SE.ZFormItemSpacing.optional(),
  ItemsAndTitlesAlign: SE.ZItemsAndTitlesAlignVariant.optional(),
  Height: z.number().optional(),
  ChildItemsHorizontalAlign: SE.ZItemHorizontalLocation.optional(),
  HorizontalSpacing: SE.ZFormItemSpacing.optional(),
  Group: SE.ZChildFormItemsGroup.optional(),
  Enabled: z.boolean().optional(),
  Title: ZI8nTextXML.optional(),
  CloseOnChoice: z.boolean().optional(),
  CloseOnOwnerClose: z.boolean().optional(),
  FormName: z.string().optional(),
  UsedFormServer: SE.ZUsedServer.optional(),
  PurposeUseKey: z.string().optional(),
  WindowOptionsKey: z.string().optional(),
  CommandBar: ZFormGroupXML.optional(),
  // Commands: ZКомандыФормыXML.optional(),
  Scale: z.number().optional(),
  ModalMode: z.boolean().optional(),
  Modified: z.boolean().optional(),
  URL: z.string().optional(),
  ShowTitle: z.boolean().optional(),
  ShowCloseButton: z.boolean().optional(),
  ConversationsRepresentation: SE.ZFormConversationsRepresentation.optional(),
  EnterKeyBehavior: SE.ZEnterKeyBehaviorType.optional(),
  ChildItems: ZChildItemsXML.optional(),
  CommandBarLocation: SE.ZFormCommandBarLabelLocation.optional(),
  AutoFillCheck: z.boolean().optional(),
  FormWindowOpeningMode: SE.ZFormWindowOpeningMode.optional(),
  CollapseItemsByImportance: SE.ZCollapseFormItemsByImportance.optional(),
  SaveDataInSettings: SE.ZSaveFormDataInSettings.optional(),
  SavedInSettingsDataModified: z.boolean().optional(),
  ReadOnly: z.boolean().optional(),
  UUID: z.uuid().optional(),
  // ConditionalAppearance: ZУсловноеОформлениеКомпоновкиДанныхXML.optional(),
  Width: z.number().optional(),
  SlaveItemsWidth: SE.ZChildFormItemsWidth.optional(),
})

export type TClientApplicationForm = z.infer<typeof ZClientApplicationForm>
export type TAttribute = z.infer<typeof ZAttribute>

export type TAttributeXML = z.infer<typeof ZAttributeXML>
export type TAttributesXML = z.infer<typeof ZAttributesXML>
export type TClientApplicationFormXML = z.infer<typeof ZClientApplicationFormXML>

// export type TAttributeEnterprise = z.infer<typeof ZAttributeEnterprise>
