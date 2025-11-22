import * as z from "zod"
import {
  ZI8nText,
  ZI8nTextXML,
} from "~/lib/metadata/commonObjects/i8nText/types"
import {
  ZTypeDescription,
  ZTypeDescriptionXML,
} from "~/lib/metadata/commonObjects/typeDescription/types"
import {
  ZUserVisible,
  ZUserVisibleXML,
} from "~/lib/metadata/commonObjects/userVisible/types"
import {
  ZCommandSet,
  ZCommandSetXML,
} from "~/lib/metadata/forms/commandSet/types"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZEventsXML } from "../../events/types"
import { ZChildItems, ZChildItemsXML } from "../childItems/types"
import { TChildItems } from "../childItems/typesExt"
import { ZCommandBar, ZCommandBarXML } from "../commandBar/types"
import { ZElementType } from "../types"

export const ZAttribute = z.object({
  name: z.string(),
  id: z.string(),
  title: ZI8nText.optional(),
  type: ZTypeDescription.optional(),
  mainAttribute: z.boolean().optional(),
  storedData: z.boolean().optional(),
  use: ZUserVisible.optional(),
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
  commandSet: ZCommandSet.optional(),
  elementType: ZElementType.enum.ClientApplicationForm,
  attributes: z.array(ZAttribute).optional(),
  get autoCommandBar() {
    return ZCommandBar.optional()
  },
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
  get commandBar() {
    return ZCommandBar.optional()
  },
  scale: z.number().optional(),
  modalMode: z.boolean().optional(),
  modified: z.boolean().optional(),
  uRL: z.string().optional(),
  showTitle: z.boolean().optional(),
  showCloseButton: z.boolean().optional(),
  conversationsRepresentation: SE.ZFormConversationsRepresentation.optional(),
  enterKeyBehavior: SE.ZEnterKeyBehaviorType.optional(),
  get childItems(): TChildItems | undefined {
    return ZChildItems
  },
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
  useForFoldersAndItems: SE.ZFoldersAndItemsUse.optional(),
  events: z
    .object({
      collaborationSystemUsersAutoComplete: z.string().optional(),
      externalEvent: z.string().optional(),
      activationProcessing: z.string().optional(),
      choiceProcessing: z.string().optional(),
      newWriteProcessing: z.string().optional(),
      uRLProcessing: z.string().optional(),
      notificationProcessing: z.string().optional(),
      navigationProcessing: z.string().optional(),
      uRLGetProcessing: z.string().optional(),
      uRLListGetProcessing: z.string().optional(),
      collaborationSystemUsersChoiceFormGetProcessing: z.string().optional(),
      fillCheckProcessingAtServer: z.string().optional(),
      addInDetachmentOnError: z.string().optional(),
      beforeLoadDataFromSettingsAtServer: z.string().optional(),
      beforeClose: z.string().optional(),
      beforeReopenFromOtherServer: z.string().optional(),
      onPasteFromClipboard: z.string().optional(),
      onLoadDataFromSettingsAtServer: z.string().optional(),
      onClose: z.string().optional(),
      onMainServerAvailabilityChange: z.string().optional(),
      onChangeDisplaySettings: z.string().optional(),
      onOpen: z.string().optional(),
      onReopenFromOtherServer: z.string().optional(),
      onReopen: z.string().optional(),
      onCreateAtServer: z.string().optional(),
      onSaveDataInSettingsAtServer: z.string().optional(),
    })
    .optional(),
})

export const ZAutoCommandBarXML = z.object({
  _name: z.string(),
  _id: z.string(),
})

export const ZConditionalAppearanceXML = z.object({
  ConditionalAppearance: z.object(),
})

const ZTypeDescriptionXMLItem = z.object({
  "v8:Type": z
    .union([
      z.string(),
      z.object({
        "_xmlns:mxl": z.literal("http://v8.1c.ru/8.2/data/spreadsheet"),
        "#text": z.literal("mxl:SpreadsheetDocument"),
      }),
      z.array(
        z.union([
          z.string(),
          z.object({
            "_xmlns:mxl": z.literal("http://v8.1c.ru/8.2/data/spreadsheet"),
            "#text": z.literal("mxl:SpreadsheetDocument"),
          }),
        ])
      ),
    ])
    .optional(),
  "v8:StringQualifiers": z
    .object({
      "v8:Length": z.number(),
      "v8:AllowedLength": z.enum(["Variable", "Fixed"]),
    })
    .optional(),
  "v8:NumberQualifiers": z
    .object({
      "v8:Digits": z.number(),
      "v8:FractionDigits": z.number(),
      "v8:AllowedSign": z.enum(["Any", "Nonnegative"]).optional(),
    })
    .optional(),
  "v8:DateQualifiers": z
    .object({
      "v8:DateFractions": z.enum(["Date", "Time", "DateTime"]).optional(),
    })
    .optional(),
})

export const ZAttributeXML = z.object({
  Attribute: z.object({
    _name: z.string(),
    _id: z.string(),
    Title: ZI8nTextXML.optional(),
    Type: z.union([ZTypeDescriptionXML, ZTypeDescriptionXMLItem]).optional(),
    MainAttribute: z.boolean().optional(),
    StoredData: z.boolean().optional(),
    Use: ZUserVisibleXML.optional(),
  }),
})

export const ZAttributesXML = z.array(
  z.union([ZAttributeXML, ZConditionalAppearanceXML])
)

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
  AutoFillCheck: z.boolean().optional(),
  AutoSaveDataInSettings: SE.ZAutoSaveFormDataInSettings.optional(),
  AutoTitle: z.boolean().optional(),
  AutoURL: z.boolean().optional(),
  ChildItemsVerticalAlign: SE.ZItemVerticalAlign.optional(),
  CloseOnChoice: z.boolean().optional(),
  CloseOnOwnerClose: z.boolean().optional(),
  CollapseItemsByImportance: SE.ZCollapseFormItemsByImportance.optional(),
  get CommandBar() {
    return ZCommandBarXML.optional()
  },
  CommandBarLocation: SE.ZFormCommandBarLabelLocation.optional(),
  // Commands: ZКомандыФормыXML.optional(),
  ConversationsRepresentation: SE.ZFormConversationsRepresentation.optional(),
  Enabled: z.boolean().optional(),
  EnterKeyBehavior: SE.ZEnterKeyBehaviorType.optional(),
  FormName: z.string().optional(),
  FormWindowOpeningMode: SE.ZFormWindowOpeningMode.optional(),
  Group: SE.ZChildFormItemsGroup.optional(),
  Height: z.number().optional(),
  HorizontalSpacing: SE.ZFormItemSpacing.optional(),
  ItemsAndTitlesAlign: SE.ZItemsAndTitlesAlignVariant.optional(),
  ModalMode: z.boolean().optional(),
  Modified: z.boolean().optional(),
  PurposeUseKey: z.string().optional(),
  ReadOnly: z.boolean().optional(),
  SaveDataInSettings: SE.ZSaveFormDataInSettings.optional(),
  SavedInSettingsDataModified: z.boolean().optional(),
  Scale: z.number().optional(),
  ShowCloseButton: z.boolean().optional(),
  ShowTitle: z.boolean().optional(),
  SlaveItemsWidth: SE.ZChildFormItemsWidth.optional(),
  Title: ZI8nTextXML.optional(),
  URL: z.string().optional(),
  UUID: z.uuid().optional(),
  UsedFormServer: SE.ZUsedServer.optional(),
  VerticalScroll: SE.ZVerticalFormScroll.optional(),
  VerticalSpacing: SE.ZFormItemSpacing.optional(),
  Width: z.number().optional(),
  WindowOptionsKey: z.string().optional(),
  // ConditionalAppearance: ZУсловноеОформлениеКомпоновкиДанныхXML.optional(),\  CommandSet: ZCommandSetXML.optional(),
  CommandSet: ZCommandSetXML.optional(),
  UseForFoldersAndItems: SE.ZFoldersAndItemsUse.optional(),
  get AutoCommandBar() {
    return ZCommandBarXML.optional()
  },
  Events: ZEventsXML.optional(),
  get ChildItems() {
    return ZChildItemsXML.optional()
  },
  Attributes: ZAttributesXML.optional(),
})

export type TClientApplicationForm = z.infer<typeof ZClientApplicationForm>
export type TAttribute = z.infer<typeof ZAttribute>

export type TAttributeXML = z.infer<typeof ZAttributeXML>
export type TAttributesXML = z.infer<typeof ZAttributesXML>
export type TClientApplicationFormXML = z.infer<
  typeof ZClientApplicationFormXML
>

// export type TAttributeEnterprise = z.infer<typeof ZAttributeEnterprise>
