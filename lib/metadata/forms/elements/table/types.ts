import * as z from "zod"
import { ZColor, ZColorXML } from "~/lib/metadata/commonObjects/color/types"
import { ZFont, ZFontXML } from "~/lib/metadata/commonObjects/font/types"
import {
  ZI8nText,
  ZI8nTextXML,
} from "~/lib/metadata/commonObjects/i8nText/types"
import {
  ZUserVisible,
  ZUserVisibleXML,
} from "~/lib/metadata/commonObjects/userVisible/types"
import {
  ZCommandSet,
  ZCommandSetXML,
} from "~/lib/metadata/forms/commandSet/types"
import {
  ZSearchControlAddition,
  ZSearchControlAdditionXML,
} from "~/lib/metadata/forms/elements/searchControlAddition/types"
import {
  ZSearchStringAddition,
  ZSearchStringAdditionXML,
} from "~/lib/metadata/forms/elements/searchStringAddition/types"
import { ZElementType } from "~/lib/metadata/forms/elements/types"
import {
  ZViewStatusAddition,
  ZViewStatusAdditionXML,
} from "~/lib/metadata/forms/elements/viewStatusAddition/types"
import { ZEventsXML } from "~/lib/metadata/forms/events/types"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZChildItems, ZChildItemsXML } from "../childItems/types"
import { TChildItems } from "../childItems/typesExt"
import { ZCommandBar, ZCommandBarXML } from "../commandBar/types"
import { ZFormDecoration, ZFormDecorationXML } from "../formDecoration/types"
import {
  ZFormItemAddition,
  ZFormItemAdditionXML,
} from "../formItemAddition/types"

export const ZTable = z.object({
  elementType: ZElementType,
  name: z.string(),
  id: z.string().optional(),
  autoAddIncomplete: z.boolean().optional(),
  get autoCommandBar() {
    return ZCommandBar.optional()
  },
  autoInsertNewRow: z.boolean().optional(),
  autoMarkIncomplete: z.boolean().optional(),
  autoMaxHeight: z.boolean().optional(),
  autoMaxHeightInTableRows: z.boolean().optional(),
  autoMaxWidth: z.boolean().optional(),
  backColor: ZColor.optional(),
  behaviorOnHorizontalCompression:
    SE.ZTableBehaviorOnHorizontalCompression.optional(),
  borderColor: ZColor.optional(),
  changeRowOrder: z.boolean().optional(),
  changeRowSet: z.boolean().optional(),
  choiceMode: z.boolean().optional(),
  get commandBar() {
    return ZCommandBar.optional()
  },
  commandBarLocation: SE.ZFormItemCommandBarLabelLocation.optional(),
  commandSet: ZCommandSet.optional(),
  get contextMenu() {
    return ZCommandBar.optional()
  },
  currentRowUse: SE.ZTableCurrentRowUse.optional(),
  dataPath: z.string().optional(),
  defaultItem: z.boolean().optional(),
  displayImportance: SE.ZDisplayImportance.optional(),
  enabled: z.boolean().optional(),
  enableDrag: z.boolean().optional(),
  enableStartDrag: z.boolean().optional(),
  get extendedTooltip() {
    return ZFormDecoration.optional()
  },
  fileDragMode: SE.ZFileDragMode.optional(),
  font: ZFont.optional(),
  footer: z.boolean().optional(),
  footerHeight: z.number().optional(),
  header: z.boolean().optional(),
  headerHeight: z.number().optional(),
  height: z.number().optional(),
  heightControlVariant: SE.ZTableHeightControlVariant.optional(),
  heightInTableRows: z.number().optional(),
  horizontalAlignInGroup: SE.ZItemHorizontalLocation.optional(),
  horizontalLines: z.boolean().optional(),
  horizontalScrollBar: SE.ZScrollBarUse.optional(),
  horizontalStretch: z.boolean().optional(),
  initialListView: SE.ZInitialListView.optional(),
  initialTreeView: SE.ZInitialTreeView.optional(),
  markIncomplete: z.boolean().optional(),
  maxHeight: z.number().optional(),
  maxHeightInTableRows: z.number().optional(),
  maxWidth: z.number().optional(),
  multipleChoice: z.boolean().optional(),
  output: SE.ZUseOutput.optional(),
  readOnly: z.boolean().optional(),
  refreshRequest: SE.ZRefreshRequestMethod.optional(),
  representation: SE.ZTableRepresentation.optional(),
  rowInputMode: SE.ZTableRowInputMode.optional(),
  rowPictureDataPath: z.string().optional(),
  rowSelectionMode: SE.ZTableRowSelectionMode.optional(),
  rowsPicture: z.boolean().optional(),
  searchControl: ZFormItemAddition.optional(),
  get searchControlAddition() {
    return ZSearchControlAddition.optional()
  },
  searchControlLocation: SE.ZSearchControlLocation.optional(),
  searchOnInput: SE.ZSearchInTableOnInput.optional(),
  get searchStringAddition() {
    return ZSearchStringAddition.optional()
  },
  searchStringLocation: SE.ZSearchStringLocation.optional(),
  searchStringRepresentation: ZFormItemAddition.optional(),
  selectionMode: SE.ZTableSelectionMode.optional(),
  shortcut: z.string().optional(),
  skipOnInput: z.boolean().optional(),
  textColor: ZColor.optional(),
  title: ZI8nText.optional(),
  titleFont: ZFont.optional(),
  titleHeight: z.number().optional(),
  titleLocation: SE.ZFormItemTitleLocation.optional(),
  titleTextColor: ZColor.optional(),
  toolTip: ZI8nText.optional(),
  toolTipRepresentation: SE.ZToolTipRepresentation.optional(),
  useAlternationRowColor: z.boolean().optional(),
  userVisible: ZUserVisible.optional(),
  verticalAlignInGroup: SE.ZItemVerticalAlign.optional(),
  verticalLines: z.boolean().optional(),
  verticalScrollBar: SE.ZScrollBarUse.optional(),
  verticalStretch: z.boolean().optional(),
  get viewStatusAddition() {
    return ZViewStatusAddition.optional()
  },
  viewStatusLocation: SE.ZViewStatusLocation.optional(),
  viewStatusRepresentation: ZFormItemAddition.optional(),
  visible: z.boolean().optional(),
  width: z.number().optional(),
  get childItems(): TChildItems {
    return ZChildItems
  },
  events: z
    .object({
      selection: z.string().optional(),
      valueChoice: z.string().optional(),
      dragStart: z.string().optional(),
      choiceProcessing: z.string().optional(),
      newWriteProcessing: z.string().optional(),
      refreshRequestProcessing: z.string().optional(),
      dragEnd: z.string().optional(),
      beforeAddRow: z.string().optional(),
      beforeRowChange: z.string().optional(),
      beforeEditEnd: z.string().optional(),
      beforeExpand: z.string().optional(),
      beforeCollapse: z.string().optional(),
      beforeDeleteRow: z.string().optional(),
      drag: z.string().optional(),
      afterDeleteRow: z.string().optional(),
      onActivateField: z.string().optional(),
      onActivateRow: z.string().optional(),
      onActivateCell: z.string().optional(),
      onChange: z.string().optional(),
      onStartEdit: z.string().optional(),
      onEditEnd: z.string().optional(),
      onCurrentParentChange: z.string().optional(),
      dragCheck: z.string().optional(),
    })
    .optional(),
})

export const ZTableXML = z.object({
  _name: z.string(),
  _id: z.string(),
  _DisplayImportance: SE.ZDisplayImportance.optional(),
  UserVisible: ZUserVisibleXML.optional(),
  TitleLocation: SE.ZFormItemTitleLocation.optional(),
  TitleHeight: z.number().optional(),
  Representation: SE.ZTableRepresentation.optional(),
  CommandBarLocation: SE.ZFormItemCommandBarLabelLocation.optional(),
  Enabled: z.boolean().optional(),
  ReadOnly: z.boolean().optional(),
  SkipOnInput: z.boolean().optional(),
  DefaultItem: z.boolean().optional(),
  ChangeRowSet: z.boolean().optional(),
  ChangeRowOrder: z.boolean().optional(),
  Width: z.number().optional(),
  AutoMaxWidth: z.boolean().optional(),
  MaxWidth: z.number().optional(),
  Height: z.number().optional(),
  AutoMaxHeight: z.boolean().optional(),
  MaxHeight: z.number().optional(),
  HeightInTableRows: z.number().optional(),
  HeightControlVariant: SE.ZTableHeightControlVariant.optional(),
  ChoiceMode: z.boolean().optional(),
  MultipleChoice: z.boolean().optional(),
  RowInputMode: SE.ZTableRowInputMode.optional(),
  SelectionMode: SE.ZTableSelectionMode.optional(),
  RowSelectionMode: SE.ZTableRowSelectionMode.optional(),
  EnableStartDrag: z.boolean().optional(),
  EnableDrag: z.boolean().optional(),
  Header: z.boolean().optional(),
  HeaderHeight: z.number().optional(),
  Footer: z.boolean().optional(),
  FooterHeight: z.number().optional(),
  HorizontalScrollBar: SE.ZScrollBarUse.optional(),
  VerticalScrollBar: SE.ZScrollBarUse.optional(),
  HorizontalLines: z.boolean().optional(),
  VerticalLines: z.boolean().optional(),
  AutoInsertNewRow: z.boolean().optional(),
  UseAlternationRowColor: z.boolean().optional(),
  AutoAddIncomplete: z.boolean().optional(),
  AutoMarkIncomplete: z.boolean().optional(),
  SearchOnInput: SE.ZSearchInTableOnInput.optional(),
  InitialListView: SE.ZInitialListView.optional(),
  InitialTreeView: SE.ZInitialTreeView.optional(),
  Output: SE.ZUseOutput.optional(),
  HorizontalStretch: z.boolean().optional(),
  VerticalStretch: z.boolean().optional(),
  FileDragMode: SE.ZFileDragMode.optional(),
  DataPath: z.string().optional(),
  CommandSet: ZCommandSetXML.optional(),
  RowPictureDataPath: z.string().optional(),
  RowsPicture: z.boolean().optional(),
  TextColor: ZColorXML.optional(),
  BackColor: ZColorXML.optional(),
  BorderColor: ZColorXML.optional(),
  Font: ZFontXML.optional(),
  Title: ZI8nTextXML.optional(),
  TitleTextColor: ZColorXML.optional(),
  TitleFont: ZFontXML.optional(),
  Shortcut: z.string().optional(),
  ToolTip: ZI8nTextXML.optional(),
  ToolTipRepresentation: SE.ZToolTipRepresentation.optional(),
  SearchStringLocation: SE.ZSearchStringLocation.optional(),
  ViewStatusLocation: SE.ZViewStatusLocation.optional(),
  SearchControlLocation: SE.ZSearchControlLocation.optional(),
  RefreshRequest: SE.ZRefreshRequestMethod.optional(),
  CurrentRowUse: SE.ZTableCurrentRowUse.optional(),
  BehaviorOnHorizontalCompression:
    SE.ZTableBehaviorOnHorizontalCompression.optional(),
  get ContextMenu() {
    return ZCommandBarXML.optional()
  },
  get AutoCommandBar() {
    return ZCommandBarXML.optional()
  },
  get ExtendedTooltip() {
    return ZFormDecorationXML.optional()
  },
  SearchStringAddition: ZSearchStringAdditionXML.optional(),
  ViewStatusAddition: ZViewStatusAdditionXML.optional(),
  SearchControlAddition: ZSearchControlAdditionXML.optional(),
  AutoMaxHeightInTableRows: z.boolean().optional(),
  get CommandBar() {
    return ZCommandBarXML.optional()
  },
  HorizontalAlignInGroup: SE.ZItemHorizontalLocation.optional(),
  MarkIncomplete: z.boolean().optional(),
  MaxHeightInTableRows: z.number().optional(),
  SearchControl: ZFormItemAdditionXML.optional(),
  SearchStringRepresentation: ZFormItemAdditionXML.optional(),
  VerticalAlignInGroup: SE.ZItemVerticalAlign.optional(),
  ViewStatusRepresentation: ZFormItemAdditionXML.optional(),
  Visible: z.boolean().optional(),
  get ChildItems() {
    return ZChildItemsXML.optional()
  },
  Events: ZEventsXML.optional(),
})

export type TTable = z.infer<typeof ZTable>

export type TTableXML = z.infer<typeof ZTableXML>
