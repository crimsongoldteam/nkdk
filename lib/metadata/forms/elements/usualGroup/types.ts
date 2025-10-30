import * as z from "zod"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZColor, ZColorXML } from "~/lib/metadata/color/types"
import { ZFormGroup, ZFormGroupXML } from "../formGroup/types"

export const ZUsualGroup = ZFormGroup.extend({
  displayImportance: SE.ZDisplayImportance.optional(),
  verticalAlign: SE.ZItemVerticalAlign.optional(),
  childItemsVerticalAlign: SE.ZItemVerticalAlign.optional(),
  verticalSpacing: SE.ZFormItemSpacing.optional(),
  itemsAndTitlesAlign: SE.ZItemsAndTitlesAlignVariant.optional(),
  childItemsHorizontalAlign: SE.ZItemHorizontalLocation.optional(),
  horizontalSpacing: SE.ZFormItemSpacing.optional(),
  group: SE.ZChildFormItemsGroup.optional(),
  collapsedRepresentationTitle: z.string().optional(),
  currentRowUse: SE.ZCurrentRowUse.optional(),
  associatedTable: ZFormTable.optional(),
  united: z.boolean().optional(),
  showTitle: z.boolean().optional(),
  showLeftMargin: z.boolean().optional(),
  representation: SE.ZUsualGroupRepresentation.optional(),
  controlRepresentation: SE.ZUsualGroupControlRepresentation.optional(),
  behavior: SE.ZUsualGroupBehavior.optional(),
  titleDataPath: z.string().optional(),
  throughAlign: SE.ZThroughAlign.optional(),
  format: z.string().optional(),
  backColor: ZColor.optional(),
  hiddenRepresentationTitleBackColor: ZColor.optional(),
  slaveItemsWidth: SE.ZChildFormItemsWidth.optional(),
})

export const ZUsualGroupXML = ZFormGroupXML.extend({
  DisplayImportance: SE.ZDisplayImportance.optional(),
  VerticalAlign: SE.ZItemVerticalAlign.optional(),
  ChildItemsVerticalAlign: SE.ZItemVerticalAlign.optional(),
  VerticalSpacing: SE.ZFormItemSpacing.optional(),
  ItemsAndTitlesAlign: SE.ZItemsAndTitlesAlignVariant.optional(),
  ChildItemsHorizontalAlign: SE.ZItemHorizontalLocation.optional(),
  HorizontalSpacing: SE.ZFormItemSpacing.optional(),
  Group: SE.ZChildFormItemsGroup.optional(),
  CollapsedRepresentationTitle: z.string().optional(),
  CurrentRowUse: SE.ZCurrentRowUse.optional(),
  AssociatedTable: ZFormTableXML.optional(),
  United: z.boolean().optional(),
  ShowTitle: z.boolean().optional(),
  ShowLeftMargin: z.boolean().optional(),
  Representation: SE.ZUsualGroupRepresentation.optional(),
  ControlRepresentation: SE.ZUsualGroupControlRepresentation.optional(),
  Behavior: SE.ZUsualGroupBehavior.optional(),
  TitleDataPath: z.string().optional(),
  ThroughAlign: SE.ZThroughAlign.optional(),
  Format: z.string().optional(),
  BackColor: ZColorXML.optional(),
  HiddenRepresentationTitleBackColor: ZColorXML.optional(),
  SlaveItemsWidth: SE.ZChildFormItemsWidth.optional(),
})

export type TUsualGroup = z.infer<typeof ZUsualGroup>

export type TUsualGroupXML = z.infer<typeof ZUsualGroupXML>