import * as z from "zod"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZI8nText, ZI8nTextXML } from "~/lib/metadata/commonObjects/i8nText/types"
import { ZColor, ZColorXML } from "~/lib/metadata/commonObjects/color/types"
import { ZFormGroup, ZFormGroupXML } from "../formGroup/types"
import { ZTable, ZTableXML } from "../table/types"

export const ZUsualGroup = ZFormGroup.extend({
  get associatedTable() {
    return ZTable.optional()
  },
  backColor: ZColor.optional(),
  behavior: SE.ZUsualGroupBehavior.optional(),
  childItemsHorizontalAlign: SE.ZItemHorizontalLocation.optional(),
  childItemsVerticalAlign: SE.ZItemVerticalAlign.optional(),
  collapsedRepresentationTitle: z.string().optional(),
  controlRepresentation: SE.ZUsualGroupControlRepresentation.optional(),
  currentRowUse: SE.ZCurrentRowUse.optional(),
  displayImportance: SE.ZDisplayImportance.optional(),
  format: ZI8nText.optional(),
  group: SE.ZChildFormItemsGroup.optional(),
  hiddenRepresentationTitleBackColor: ZColor.optional(),
  horizontalSpacing: SE.ZFormItemSpacing.optional(),
  itemsAndTitlesAlign: SE.ZItemsAndTitlesAlignVariant.optional(),
  representation: SE.ZUsualGroupRepresentation.optional(),
  showLeftMargin: z.boolean().optional(),
  showTitle: z.boolean().optional(),
  slaveItemsWidth: SE.ZChildFormItemsWidth.optional(),
  throughAlign: SE.ZThroughAlign.optional(),
  titleDataPath: z.string().optional(),
  united: z.boolean().optional(),
  verticalAlign: SE.ZItemVerticalAlign.optional(),
  verticalSpacing: SE.ZFormItemSpacing.optional(),
})

export const ZUsualGroupXML = ZFormGroupXML.extend({
  get AssociatedTable() {
    return ZTableXML.optional()
  },
  BackColor: ZColorXML.optional(),
  Behavior: SE.ZUsualGroupBehavior.optional(),
  ChildItemsHorizontalAlign: SE.ZItemHorizontalLocation.optional(),
  ChildItemsVerticalAlign: SE.ZItemVerticalAlign.optional(),
  CollapsedRepresentationTitle: z.string().optional(),
  ControlRepresentation: SE.ZUsualGroupControlRepresentation.optional(),
  CurrentRowUse: SE.ZCurrentRowUse.optional(),
  DisplayImportance: SE.ZDisplayImportance.optional(),
  Format: ZI8nTextXML.optional(),
  Group: SE.ZChildFormItemsGroup.optional(),
  HiddenRepresentationTitleBackColor: ZColorXML.optional(),
  HorizontalSpacing: SE.ZFormItemSpacing.optional(),
  ItemsAndTitlesAlign: SE.ZItemsAndTitlesAlignVariant.optional(),
  Representation: SE.ZUsualGroupRepresentation.optional(),
  ShowLeftMargin: z.boolean().optional(),
  ShowTitle: z.boolean().optional(),
  SlaveItemsWidth: SE.ZChildFormItemsWidth.optional(),
  ThroughAlign: SE.ZThroughAlign.optional(),
  TitleDataPath: z.string().optional(),
  United: z.boolean().optional(),
  VerticalAlign: SE.ZItemVerticalAlign.optional(),
  VerticalSpacing: SE.ZFormItemSpacing.optional(),
})

export type TUsualGroup = z.infer<typeof ZUsualGroup>

export type TUsualGroupXML = z.infer<typeof ZUsualGroupXML>