import * as z from "zod"
import { I8nText, I8nTextXML, ZI8nTextXML } from "~/lib/metadata/commonObjects/i8nText/types"
import {
  TypeDescription,
  TypeDescriptionXML,
  TypeDescriptionXMLItem,
} from "~/lib/metadata/commonObjects/typeDescription/types"
import { UserVisible, UserVisibleXML } from "~/lib/metadata/commonObjects/userVisible/types"
import { CommandSet, CommandSetXML } from "~/lib/metadata/forms/commandSet/types"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { TChildItems, TChildItemsXML, ZChildItemsXML } from "../../forms/elements/childItems/types"
import { TCommandBar, TCommandBarXML, ZCommandBarXML } from "../../forms/elements/commandBar/types"
import { TElementType } from "../../forms/elements/types"
import { EventsXML } from "../../forms/events/types"

export interface IAttribute {
  name: string
  id: string
  title?: I8nText
  type?: TypeDescription
  mainAttribute?: boolean
  storedData?: boolean
  use?: UserVisible
}

// export interface IAttributeEnterprise = z.union([
//   z.object({
//     Заголовок: z.string().optional(),
//     Тип: z.string().optional(),
//     ОсновнойАтрибут: ZBoolEnterprise.optional(),
//     СохраняемыеДанные: ZBoolEnterprise.optional(),
//   }),
//   ZUseEnterprise,
// ])

export interface IClientApplicationFormEvents {
  collaborationSystemUsersAutoComplete?: string
  externalEvent?: string
  activationProcessing?: string
  choiceProcessing?: string
  newWriteProcessing?: string
  uRLProcessing?: string
  notificationProcessing?: string
  navigationProcessing?: string
  uRLGetProcessing?: string
  uRLListGetProcessing?: string
  collaborationSystemUsersChoiceFormGetProcessing?: string
  fillCheckProcessingAtServer?: string
  addInDetachmentOnError?: string
  beforeLoadDataFromSettingsAtServer?: string
  beforeClose?: string
  beforeReopenFromOtherServer?: string
  onPasteFromClipboard?: string
  onLoadDataFromSettingsAtServer?: string
  onClose?: string
  onMainServerAvailabilityChange?: string
  onChangeDisplaySettings?: string
  onOpen?: string
  onReopenFromOtherServer?: string
  onReopen?: string
  onCreateAtServer?: string
  onSaveDataInSettingsAtServer?: string
}

export interface IClientApplicationForm {
  commandSet?: CommandSet
  elementType: TElementType
  attributes?: IAttribute[]
  autoCommandBar?: TCommandBar
  autoTitle?: boolean
  autoSaveDataInSettings?: SE.TAutoSaveFormDataInSettings
  autoURL?: boolean
  verticalScroll?: SE.TVerticalFormScroll
  childItemsVerticalAlign?: SE.TItemVerticalAlign
  verticalSpacing?: SE.TFormItemSpacing
  itemsAndTitlesAlign?: SE.TItemsAndTitlesAlignVariant
  height?: number
  childItemsHorizontalAlign?: SE.TItemHorizontalLocation
  horizontalSpacing?: SE.TFormItemSpacing
  group?: SE.TChildFormItemsGroup
  enabled?: boolean
  title?: I8nText
  closeOnChoice?: boolean
  closeOnOwnerClose?: boolean
  formName?: string
  usedFormServer?: SE.TUsedServer
  purposeUseKey?: string
  windowOptionsKey?: string
  commandBar?: TCommandBar
  scale?: number
  modalMode?: boolean
  modified?: boolean
  uRL?: string
  showTitle?: boolean
  showCloseButton?: boolean
  conversationsRepresentation?: SE.TFormConversationsRepresentation
  enterKeyBehavior?: SE.TEnterKeyBehaviorType
  childItems?: TChildItems
  commandBarLocation?: SE.TFormCommandBarLabelLocation
  autoFillCheck?: boolean
  formWindowOpeningMode?: SE.TFormWindowOpeningMode
  collapseItemsByImportance?: SE.TCollapseFormItemsByImportance
  saveDataInSettings?: SE.TSaveFormDataInSettings
  savedInSettingsDataModified?: boolean
  readOnly?: boolean
  uUID?: string
  width?: number
  slaveItemsWidth?: SE.TChildFormItemsWidth
  useForFoldersAndItems?: SE.TFoldersAndItemsUse
  events?: IClientApplicationFormEvents
}

export interface IAutoCommandBarXML {
  _name: string
  _id: string
}

export interface IConditionalAppearanceXML {
  ConditionalAppearance: Record<string, unknown>
}

export interface IAttributeXMLItem {
  _name: string
  _id: string
  Title?: I8nTextXML
  Type?: TypeDescriptionXML | TypeDescriptionXMLItem
  MainAttribute?: boolean
  StoredData?: boolean
  Use?: UserVisibleXML
}

export interface IAttributeXML {
  Attribute: IAttributeXMLItem
}

export type IAttributesXML = (IAttributeXML | IConditionalAppearanceXML)[]

export interface IClientApplicationFormXML {
  _xmlns?: string
  "_xmlns:app"?: string
  "_xmlns:cfg"?: string
  "_xmlns:dcscor"?: string
  "_xmlns:dcssch"?: string
  "_xmlns:dcsset"?: string
  "_xmlns:ent"?: string
  "_xmlns:lf"?: string
  "_xmlns:style"?: string
  "_xmlns:sys"?: string
  "_xmlns:v8"?: string
  "_xmlns:v8ui"?: string
  "_xmlns:web"?: string
  "_xmlns:win"?: string
  "_xmlns:xr"?: string
  "_xmlns:xs"?: string
  "_xmlns:xsi"?: string
  _version?: string
  AutoFillCheck?: boolean
  AutoSaveDataInSettings?: SE.TAutoSaveFormDataInSettings
  AutoTitle?: boolean
  AutoURL?: boolean
  ChildItemsVerticalAlign?: SE.TItemVerticalAlign
  CloseOnChoice?: boolean
  CloseOnOwnerClose?: boolean
  CollapseItemsByImportance?: SE.TCollapseFormItemsByImportance
  CommandBar?: TCommandBarXML
  CommandBarLocation?: SE.TFormCommandBarLabelLocation
  // Commands: ZКомандыФормыXML.optional(),
  ConversationsRepresentation?: SE.TFormConversationsRepresentation
  Enabled?: boolean
  EnterKeyBehavior?: SE.TEnterKeyBehaviorType
  FormName?: string
  FormWindowOpeningMode?: SE.TFormWindowOpeningMode
  Group?: SE.TChildFormItemsGroup
  Height?: number
  HorizontalSpacing?: SE.TFormItemSpacing
  ItemsAndTitlesAlign?: SE.TItemsAndTitlesAlignVariant
  ModalMode?: boolean
  Modified?: boolean
  PurposeUseKey?: string
  ReadOnly?: boolean
  SaveDataInSettings?: SE.TSaveFormDataInSettings
  SavedInSettingsDataModified?: boolean
  Scale?: number
  ShowCloseButton?: boolean
  ShowTitle?: boolean
  SlaveItemsWidth?: SE.TChildFormItemsWidth
  Title?: I8nTextXML
  URL?: string
  UUID?: string
  UsedFormServer?: SE.TUsedServer
  VerticalScroll?: SE.TVerticalFormScroll
  VerticalSpacing?: SE.TFormItemSpacing
  Width?: number
  WindowOptionsKey?: string
  // ConditionalAppearance: ZУсловноеОформлениеКомпоновкиДанныхXML.optional(),
  CommandSet?: CommandSetXML
  UseForFoldersAndItems?: SE.TFoldersAndItemsUse
  AutoCommandBar?: TCommandBarXML
  Events?: EventsXML
  ChildItems?: TChildItemsXML
  Attributes?: IAttributesXML
}

// Zod schemas for XML validation
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

const ZTypeDescriptionXML = z.array(ZTypeDescriptionXMLItem)

const ZUserVisibleItemXML = z.object({
  _name: z.string(),
  "#text": z.boolean(),
})

const ZUserVisibleXMLItem = z.object({
  "xr:Common": z.boolean().optional(),
  "xr:Value": ZUserVisibleItemXML.optional(),
})

const ZUserVisibleXML = z.array(ZUserVisibleXMLItem)

const ZCommandSetXML = z.array(
  z.object({
    ExcludedCommand: z.string(),
  })
)

const ZEventsXML = z.array(
  z.object({
    Event: z.object({
      _name: z.string(),
      "#text": z.string().optional(),
    }),
  })
)

export const ZAttributeXMLItem = z.object({
  _name: z.string(),
  _id: z.string(),
  Title: ZI8nTextXML.optional(),
  Type: z.union([ZTypeDescriptionXML, ZTypeDescriptionXMLItem]).optional(),
  MainAttribute: z.boolean().optional(),
  StoredData: z.boolean().optional(),
  Use: ZUserVisibleXML.optional(),
})

export const ZAttributeXML = z.object({
  Attribute: ZAttributeXMLItem,
})

export const ZConditionalAppearanceXML = z.object({
  ConditionalAppearance: z.object({}).passthrough(),
})

export const ZAttributesXML = z.array(z.union([ZAttributeXML, ZConditionalAppearanceXML]))

export const ZAutoCommandBarXML = z.object({
  _name: z.string(),
  _id: z.string(),
})

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

// export type TAttributeEnterprise = z.infer<typeof ZAttributeEnterprise>
