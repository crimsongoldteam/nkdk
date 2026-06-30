import type { ConfigurationContext } from "~/metadata/context/types"
import type { CommandBarChildItem } from "~/metadata/forms/commonObjects/childItems/types"
import { fullCommandBarChildItemsAllYAML } from "~/metadata/forms/elements/__fixtures__/commandBarChildItems/data"
import { mockContext } from "~/tests/mockContext"

const Button = undefined
const CheckBoxField = undefined
const CommandBar = undefined
const CommandBarButton = undefined
const InputField = undefined
const LabelDecoration = undefined
const LabelField = undefined
const Page = undefined
const Pages = undefined
const PictureDecoration = undefined
const PictureField = undefined
const Popup = undefined
const Table = undefined
const TableCheckbox = undefined
const TableInputField = undefined
const TableLabelField = undefined
const TablePictureField = undefined
import {
  commandBarButtonWithDataPath,
  commandBarButtonWithDataPathPartialYAML,
  commandBarButtonWithDataPathTypedYAML,
  commandBarButtonWithParameter,
  commandBarButtonWithParameterPartialYAML,
  commandBarButtonWithParameterTypedYAML,
  commandButtonWithTypeDescriptionParameter,
  fullCommandBarButton,
  fullCommandBarButtonEnterprise,
  fullCommandBarButtonPartialYAML,
  fullCommandBarButtonTypedYAML,
  fullCommandBarHyperlink,
  fullCommandBarHyperlinkEnterprise,
  fullCommandBarHyperlinkPartialYAML,
  fullCommandBarHyperlinkTypedYAML,
  fullHyperlink,
  fullHyperlinkEnterprise,
  fullHyperlinkPartialYAML,
  fullHyperlinkTypedYAML,
  fullUsualButton,
  fullUsualButtonEnterprise,
  fullUsualButtonPartialYAML,
  fullUsualButtonTypedYAML,
} from "../button/__fixtures__/data"
import {
  fullButtonGroup,
  fullButtonGroupEnterprise,
  fullButtonGroupPartialYAML,
  fullButtonGroupSource,
  fullButtonGroupTypedYAML,
  minimalButtonGroup,
  minimalButtonGroupTypedYAML,
} from "../buttonGroup/__fixtures__/data"
import {
  fullCalendarField,
  fullCalendarFieldEnterprise,
  fullCalendarFieldPartialYAML,
  minimalCalendarField,
} from "../calendarField/__fixtures__/data"
import {
  fullChartField,
  fullChartFieldEnterprise,
  fullChartFieldPartialYAML,
  minimalChartField,
} from "../chartField/__fixtures__/data"
import {
  fullCheckBoxField,
  fullCheckBoxFieldEnterprise,
  fullCheckBoxFieldPartialYAML,
  fullTableCheckBoxField,
  fullTableCheckBoxFieldEnterprise,
  fullTableCheckBoxFieldPartialYAML,
  fullTableCheckBoxFieldTypedYAML,
  minimalCheckBoxField,
  minimalTableCheckBoxField,
  minimalTableCheckBoxFieldTypedYAML,
} from "../checkBoxField/__fixtures__/data"
import {
  fullColumnGroup,
  fullColumnGroupEnterprise,
  fullColumnGroupPartialYAML,
  fullColumnGroupTypedYAML,
  minimalColumnGroup,
  minimalColumnGroupTypedYAML,
} from "../columnGroup/__fixtures__/data"
import {
  fullCommandBar,
  fullCommandBarEnterprise,
  fullCommandBarPartialYAML,
  fullCommandBarSource,
  minimalCommandBar,
} from "../commandBar/__fixtures__/data"
import {
  fullDendrogramField,
  fullDendrogramFieldEnterprise,
  fullDendrogramFieldPartialYAML,
  minimalDendrogramField,
} from "../dendrogramField/__fixtures__/data"
import {
  fullFormattedDocumentField,
  fullFormattedDocumentFieldEnterprise,
  fullFormattedDocumentFieldPartialYAML,
  minimalFormattedDocumentField,
} from "../formattedDocumentField/__fixtures__/data"
import {
  fullGanttChartField,
  fullGanttChartFieldEnterprise,
  fullGanttChartFieldPartialYAML,
  minimalGanttChartField,
} from "../ganttChartField/__fixtures__/data"
import {
  fullGeographicalSchemaField,
  fullGeographicalSchemaFieldEnterprise,
  fullGeographicalSchemaFieldPartialYAML,
  minimalGeographicalSchemaField,
} from "../geographicalSchemaField/__fixtures__/data"
import {
  fullGraphicalSchemaField,
  fullGraphicalSchemaFieldEnterprise,
  fullGraphicalSchemaFieldPartialYAML,
  minimalGraphicalSchemaField,
} from "../graphicalSchemaField/__fixtures__/data"
import {
  fullHtmlDocumentField,
  fullHtmlDocumentFieldEnterprise,
  fullHtmlDocumentFieldPartialYAML,
  minimalHtmlDocumentField,
} from "../htmlDocumentField/__fixtures__/data"
import {
  fullInputField,
  fullInputFieldEnterprise,
  fullInputFieldPartialYAML,
  fullTableInputField,
  fullTableInputFieldEnterprise,
  fullTableInputFieldPartialYAML,
  fullTableInputFieldTypedYAML,
  minMaxStringTypeInputField,
  minimalInputField,
  minimalInputFieldEnterprise,
  minimalTableInputField,
  minimalTableInputFieldTypedYAML,
} from "../inputField/__fixtures__/data"
import { autoCellHeightInputField } from "../inputField/__fixtures__/autoCellHeight"
import {
  fullLabelDecoration,
  fullLabelDecorationEnterprise,
  fullLabelDecorationPartialYAML,
  minimalLabelDecoration,
} from "../labelDecoration/__fixtures__/data"
import {
  fullLabelField,
  fullLabelFieldEnterprise,
  fullLabelFieldPartialYAML,
  fullTableLabelField,
  fullTableLabelFieldEnterprise,
  fullTableLabelFieldPartialYAML,
  fullTableLabelFieldTypedYAML,
  minimalLabelField,
  minimalTableLabelField,
  minimalTableLabelFieldTypedYAML,
} from "../labelField/__fixtures__/data"
import { autoCellHeightLabelField } from "../labelField/__fixtures__/autoCellHeight"
import { fullPage, fullPageEnterprise, fullPagePartialYAML, minimalPage } from "../page/__fixtures__/data"
import {
  fullPages,
  fullPagesEnterprise,
  fullPagesPartialYAML,
  minimalPages,
  minimalPagesTypedYAML,
} from "../pages/__fixtures__/data"
import {
  fullPDFDocumentField,
  fullPDFDocumentFieldEnterprise,
  fullPDFDocumentFieldPartialYAML,
  minimalPDFDocumentField,
} from "../pdfDocumentField/__fixtures__/data"
import {
  fullPeriodField,
  fullPeriodFieldEnterprise,
  fullPeriodFieldPartialYAML,
  minimalPeriodField,
} from "../periodField/__fixtures__/data"
import {
  fullPictureDecoration,
  fullPictureDecorationEnterprise,
  fullPictureDecorationPartialYAML,
  minimalPictureDecoration,
  sourcePictureDecoration,
} from "../pictureDecoration/__fixtures__/data"
import {
  fullPictureField,
  fullPictureFieldEnterprise,
  fullPictureFieldPartialYAML,
  fullTablePictureField,
  fullTablePictureFieldEnterprise,
  fullTablePictureFieldPartialYAML,
  fullTablePictureFieldTypedYAML,
  minimalPictureField,
  minimalTablePictureField,
  minimalTablePictureFieldTypedYAML,
} from "../pictureField/__fixtures__/data"
import {
  dragPlannerField,
  dragPlannerFieldEnterprise,
  dragPlannerFieldPartialYAML,
  fullPlannerField,
  fullPlannerFieldEnterprise,
  fullPlannerFieldPartialYAML,
  minimalPlannerField,
} from "../plannerField/__fixtures__/data"
import {
  fullPopup,
  fullPopupEnterprise,
  fullPopupPartialYAML,
  fullPopupTypedYAML,
  minimalPopup,
  minimalPopupTypedYAML,
  sourcePopup,
} from "../popup/__fixtures__/data"
import {
  fullProgressBarField,
  fullProgressBarFieldEnterprise,
  fullProgressBarFieldPartialYAML,
  minimalProgressBarField,
} from "../progressBarField/__fixtures__/data"
import {
  fullRadioButtonField,
  fullRadioButtonFieldEnterprise,
  fullRadioButtonFieldPartialYAML,
  minimalRadioButtonField,
} from "../radioButtonField/__fixtures__/data"
import {
  fullSearchControlAddition,
  fullSearchControlAdditionFromCompactYAML,
  fullSearchControlAdditionYAML,
  minimalSearchControlAddition,
  sourceSearchControlAddition,
} from "../searchControlAddition/__fixtures__/data"
import {
  fullSearchStringAddition,
  fullSearchStringAdditionFromCompactYAML,
  fullSearchStringAdditionYAML,
  minimalSearchStringAddition,
  sourceSearchStringAddition,
} from "../searchStringAddition/__fixtures__/data"
import {
  fullViewStatusAddition,
  fullViewStatusAdditionYAML,
  nonCanonicalViewStatusAddition,
  visibleFalseViewStatusAddition,
  visibleFalseViewStatusAdditionYAML,
} from "../viewStatusAddition/__fixtures__/data"
import {
  fullSpreadSheetDocumentField,
  fullSpreadSheetDocumentFieldEnterprise,
  fullSpreadSheetDocumentFieldPartialYAML,
  minimalSpreadSheetDocumentField,
} from "../spreadSheetDocumentField/__fixtures__/data"
import { dynamicList, dynamicListYAML } from "../table/__fixtures__/dynamicList"
import { dcsComposerFilter, dcsComposerFilterYAML } from "../table/__fixtures__/dcsComposerFilter"
import { dcsComposerSettings, dcsComposerSettingsYAML } from "../table/__fixtures__/dcsComposerSettings"
import {
  fullTable,
  fullTableEnterprise,
  fullTableYAML,
  fullTree,
  fullTreeYAML,
  minimalTable,
} from "../table/__fixtures__/data"
import {
  fullTextDocumentField,
  fullTextDocumentFieldEnterprise,
  fullTextDocumentFieldPartialYAML,
  minimalTextDocumentField,
} from "../textDocumentField/__fixtures__/data"
import {
  fullTrackBarField,
  fullTrackBarFieldEnterprise,
  fullTrackBarFieldPartialYAML,
  minimalTrackBarField,
} from "../trackBarField/__fixtures__/data"
import {
  fullUsualGroup,
  fullUsualGroupEnterprise,
  fullUsualGroupPartialYAML,
  minimalUsualGroup,
} from "../usualGroup/__fixtures__/data"

export const commandBarYAMLContext: ConfigurationContext = {
  ...mockContext,
  allElements: fullCommandBarChildItemsAllYAML,
}

const fullPagePartialYAMLForExport = {
  ...fullPagePartialYAML,
  Элементы: {
    Группа1: {
      Вид: "Группа",
    },
  },
}

export type ElementFixture = {
  group: string
  name: string
  element: object | undefined
  xml: string
  xmlFolder: string | undefined
  model: object
  yamlModel?: object
  typedYAMLModel?: object
  source?: object
  yamlForImport?: object
  yaml: object | undefined
  typedYAML?: object
  enterprise?: object
  context?: ConfigurationContext
}

const { enableContentChange: _buttonGroupEnableContentChange, ...fullButtonGroupFromYAML } = fullButtonGroup
const { enableContentChange: _columnGroupEnableContentChange, ...fullColumnGroupFromYAML } = fullColumnGroup
const { enableContentChange: _popupEnableContentChange, ...fullPopupFromYAML } = fullPopup
const { fixingInTable: _tableInputFieldFixingInTable, ...fullTableInputFieldFromYAML } = fullTableInputField
const { fixingInTable: _tableCheckBoxFieldFixingInTable, ...fullTableCheckBoxFieldFromYAML } = fullTableCheckBoxField
const {
  autoMaxHeight: _tableLabelFieldAutoMaxHeight,
  autoMaxWidth: _tableLabelFieldAutoMaxWidth,
  fixingInTable: _tableLabelFieldFixingInTable,
  ...fullTableLabelFieldFromYAML
} = fullTableLabelField
const { fixingInTable: _tablePictureFieldFixingInTable, ...fullTablePictureFieldFromYAML } = fullTablePictureField
const {
  picture: { transparentPixel: _usualButtonTransparentPixel, ...fullUsualButtonPictureFromYAML },
  ...fullUsualButtonFromYAMLRest
} = fullUsualButton
const fullUsualButtonFromYAML = {
  ...fullUsualButtonFromYAMLRest,
  picture: fullUsualButtonPictureFromYAML,
}
const commandButtonWithTypeDescriptionParameterFromYAML = {
  ...commandButtonWithTypeDescriptionParameter,
  type: "UsualButton" as const,
}
type WithOptionalChildItems = { childItems?: readonly Record<string, unknown>[] }

const requiredChildItems = <T extends WithOptionalChildItems>(
  item: T,
  name: string
): readonly Record<string, unknown>[] => {
  if (item.childItems === undefined) throw new Error(`${name} childItems fixture is missing`)
  return item.childItems
}

const commandBarNestedChildItems = (item: CommandBarChildItem, name: string): readonly Record<string, unknown>[] => {
  if (!("childItems" in item) || item.childItems === undefined) throw new Error(`${name} childItems fixture is missing`)
  return item.childItems
}

const withoutCheckBoxTypeInChildItems = <T extends WithOptionalChildItems>(table: T, names: string[]): T => {
  const childItems = requiredChildItems(table, "form element")

  return {
    ...table,
    childItems: childItems.map((childItem) => {
      if (typeof childItem.name !== "string" || !names.includes(childItem.name)) return childItem

      const { checkBoxType: _checkBoxType, ...childItemWithoutCheckBoxType } = childItem
      return childItemWithoutCheckBoxType
    }),
  } as T
}
const fullTableFromYAML = withoutCheckBoxTypeInChildItems(fullTable, ["ТаблицаФлажок123"])
const fullTreeFromYAML = withoutCheckBoxTypeInChildItems(fullTree, ["ДеревоФлажок"])
const dynamicListFromYAML = withoutCheckBoxTypeInChildItems(dynamicList, ["ДинамическийСписокФлажок"])
const dcsComposerFilterFromYAML = withoutCheckBoxTypeInChildItems(dcsComposerFilter, [
  "КомпоновщикНастроекКомпоновкиДанныхНастройкиОтборИспользование",
])
const dcsComposerSettingsFromYAML = withoutCheckBoxTypeInChildItems(dcsComposerSettings, [
  "КомпоновщикНастроекКомпоновкиДанныхНастройкиИспользование",
])
const fullCommandBarFromYAML = {
  ...fullCommandBar,
  childItems: [
    {
      ...fullCommandBar.childItems[0],
      type: "UsualButton" as const,
    },
    {
      ...fullCommandBar.childItems[1],
      childItems: [
        {
          ...commandBarNestedChildItems(fullCommandBar.childItems[1], "fullCommandBar.childItems[1]")[0],
          type: "UsualButton" as const,
        },
      ],
    },
    {
      ...fullCommandBar.childItems[2],
      childItems: [
        {
          ...commandBarNestedChildItems(fullCommandBar.childItems[2], "fullCommandBar.childItems[2]")[0],
          type: "UsualButton" as const,
        },
      ],
    },
  ],
}

export const ElementFixtures: ElementFixture[] = [
  //#region InputField
  {
    group: "InputField",
    name: "all fields",
    element: InputField,
    xml: "full.xml",
    xmlFolder: undefined,
    model: fullInputField,
    yaml: fullInputFieldPartialYAML,
    enterprise: fullInputFieldEnterprise,
  },
  {
    group: "InputField",
    name: "minimal fields",
    element: InputField,
    xml: "minimal.xml",
    xmlFolder: undefined,
    model: minimalInputField,
    yaml: undefined,
    enterprise: minimalInputFieldEnterprise,
  },
  {
    group: "InputField",
    name: "autoCellHeight InputField",
    element: InputField,
    xml: "autoCellHeight.xml",
    xmlFolder: undefined,
    model: autoCellHeightInputField,
    source: {
      itemType: "InputField",
      name: "ПолеАвтоВысотаЯчейки",
    },
    yamlForImport: {
      АвтоВысотаЯчейки: "Истина",
    },
    yaml: undefined,
    enterprise: undefined,
  },
  {
    group: "InputField",
    name: "minMaxStringType InputField",
    element: InputField,
    xml: "minMaxStringType.xml",
    xmlFolder: undefined,
    model: minMaxStringTypeInputField,
    yaml: {
      МинимальноеЗначение: 1,
      МаксимальноеЗначение: 99.99,
      ПутьКДанным: "Объект.Количество",
    },
    enterprise: undefined,
  },
  //#endregion
  //#region TableInputField
  {
    group: "TableInputField",
    name: "all fields (table)",
    element: TableInputField,
    xml: "fullTable.xml",
    xmlFolder: "inputField",
    model: fullTableInputField,
    yaml: fullTableInputFieldPartialYAML,
    typedYAMLModel: fullTableInputFieldFromYAML,
    typedYAML: fullTableInputFieldTypedYAML,
    enterprise: fullTableInputFieldEnterprise,
  },
  {
    group: "TableInputField",
    name: "minimal fields (table)",
    element: TableInputField,
    xml: "minimalTable.xml",
    xmlFolder: "inputField",
    model: minimalTableInputField,
    yaml: undefined,
    typedYAML: minimalTableInputFieldTypedYAML,
    enterprise: undefined,
  },
  //#endregion
  //#region Button
  {
    group: "Button",
    name: "usual button",
    element: Button,
    xml: "button.xml",
    xmlFolder: undefined,
    model: fullUsualButton,
    yaml: fullUsualButtonPartialYAML,
    typedYAMLModel: fullUsualButtonFromYAML,
    typedYAML: fullUsualButtonTypedYAML,
    enterprise: fullUsualButtonEnterprise,
  },
  {
    group: "Button",
    name: "hyperlink",
    element: Button,
    xml: "hyperlink.xml",
    xmlFolder: undefined,
    model: fullHyperlink,
    yaml: fullHyperlinkPartialYAML,
    typedYAML: fullHyperlinkTypedYAML,
    enterprise: fullHyperlinkEnterprise,
  },
  //#endregion
  //#region CommandBarButton
  {
    group: "CommandBarButton",
    name: "command bar button",
    element: CommandBarButton,
    xml: "commandBarButton.xml",
    xmlFolder: "button",
    model: fullCommandBarButton,
    yaml: fullCommandBarButtonPartialYAML,
    typedYAML: fullCommandBarButtonTypedYAML,
    enterprise: fullCommandBarButtonEnterprise,
  },
  {
    group: "CommandBarButton",
    name: "with data path",
    element: CommandBarButton,
    xml: "withDataPath.xml",
    xmlFolder: "button",
    model: commandBarButtonWithDataPath,
    yaml: commandBarButtonWithDataPathPartialYAML,
    typedYAML: commandBarButtonWithDataPathTypedYAML,
    enterprise: undefined,
  },
  {
    group: "CommandBarButton",
    name: "with Parameter",
    element: CommandBarButton,
    xml: "parameterCommandBarButton.xml",
    xmlFolder: "button",
    model: commandBarButtonWithParameter,
    yaml: commandBarButtonWithParameterPartialYAML,
    typedYAML: commandBarButtonWithParameterTypedYAML,
    enterprise: undefined,
  },
  {
    group: "Button",
    name: "with TypeDescription Parameter",
    element: Button,
    xml: "parameterTypeDescription.xml",
    xmlFolder: "button",
    model: commandButtonWithTypeDescriptionParameter,
    yamlModel: commandButtonWithTypeDescriptionParameterFromYAML,
    yaml: {
      ИмяКоманды: "Form.Item.Список.StandardCommand.CreateByParameter",
    },
    typedYAML: undefined,
    enterprise: undefined,
  },
  {
    group: "CommandBarButton",
    name: "command bar hyperlink",
    element: CommandBarButton,
    xml: "commandBarHyperlink.xml",
    xmlFolder: "button",
    model: fullCommandBarHyperlink,
    yaml: fullCommandBarHyperlinkPartialYAML,
    typedYAML: fullCommandBarHyperlinkTypedYAML,
    enterprise: fullCommandBarHyperlinkEnterprise,
  },
  //#endregion
  //#region ButtonGroup
  {
    group: "ButtonGroup",
    name: "all fields",
    element: undefined,
    xml: "full.xml",
    xmlFolder: undefined,
    model: fullButtonGroup,
    yamlModel: fullButtonGroupFromYAML,
    source: fullButtonGroupSource,
    yaml: fullButtonGroupPartialYAML,
    typedYAML: fullButtonGroupTypedYAML,
    enterprise: fullButtonGroupEnterprise,
  },
  {
    group: "ButtonGroup",
    name: "minimal fields",
    element: undefined,
    xml: "minimal.xml",
    xmlFolder: undefined,
    model: minimalButtonGroup,
    yaml: undefined,
    typedYAML: minimalButtonGroupTypedYAML,
    enterprise: undefined,
  },
  //#endregion
  //#region CalendarField
  {
    group: "CalendarField",
    name: "all fields",
    element: undefined,
    xml: "full.xml",
    xmlFolder: undefined,
    model: fullCalendarField,
    yaml: fullCalendarFieldPartialYAML,
    enterprise: fullCalendarFieldEnterprise,
  },
  {
    group: "CalendarField",
    name: "minimal fields",
    element: undefined,
    xml: "minimal.xml",
    xmlFolder: undefined,
    model: minimalCalendarField,
    yaml: undefined,
    enterprise: undefined,
  },
  //#endregion
  //#region ChartField
  {
    group: "ChartField",
    name: "all fields",
    element: undefined,
    xml: "full.xml",
    xmlFolder: undefined,
    model: fullChartField,
    yaml: fullChartFieldPartialYAML,
    enterprise: fullChartFieldEnterprise,
  },
  {
    group: "ChartField",
    name: "minimal fields",
    element: undefined,
    xml: "minimal.xml",
    xmlFolder: undefined,
    model: minimalChartField,
    yaml: undefined,
    enterprise: undefined,
  },
  //#endregion
  //#region CheckBoxField
  {
    group: "CheckBoxField",
    name: "all fields",
    element: CheckBoxField,
    xml: "full.xml",
    xmlFolder: undefined,
    model: fullCheckBoxField,
    yaml: fullCheckBoxFieldPartialYAML,
    enterprise: fullCheckBoxFieldEnterprise,
  },
  {
    group: "CheckBoxField",
    name: "minimal fields",
    element: CheckBoxField,
    xml: "minimal.xml",
    xmlFolder: undefined,
    model: minimalCheckBoxField,
    yamlModel: minimalCheckBoxField,
    yaml: undefined,
    enterprise: undefined,
  },
  //#endregion
  //#region TableCheckBoxField
  {
    group: "TableCheckBoxField",
    name: "all fields (table)",
    element: TableCheckbox,
    xml: "fullTable.xml",
    xmlFolder: "checkBoxField",
    model: fullTableCheckBoxField,
    yaml: fullTableCheckBoxFieldPartialYAML,
    typedYAMLModel: fullTableCheckBoxFieldFromYAML,
    typedYAML: fullTableCheckBoxFieldTypedYAML,
    enterprise: fullTableCheckBoxFieldEnterprise,
  },
  {
    group: "TableCheckBoxField",
    name: "minimal fields (table)",
    element: TableCheckbox,
    xml: "minimalTable.xml",
    xmlFolder: "checkBoxField",
    model: minimalTableCheckBoxField,
    yamlModel: minimalTableCheckBoxField,
    typedYAMLModel: minimalTableCheckBoxField,
    yaml: undefined,
    typedYAML: minimalTableCheckBoxFieldTypedYAML,
    enterprise: undefined,
  },
  //#endregion
  //#region ColumnGroup
  {
    group: "ColumnGroup",
    name: "all fields",
    element: undefined,
    xml: "full.xml",
    xmlFolder: undefined,
    model: fullColumnGroup,
    yaml: fullColumnGroupPartialYAML,
    typedYAMLModel: fullColumnGroupFromYAML,
    typedYAML: fullColumnGroupTypedYAML,
    enterprise: fullColumnGroupEnterprise,
  },
  {
    group: "ColumnGroup",
    name: "minimal fields",
    element: undefined,
    xml: "minimal.xml",
    xmlFolder: undefined,
    model: minimalColumnGroup,
    yaml: undefined,
    typedYAML: minimalColumnGroupTypedYAML,
    enterprise: undefined,
  },
  //#endregion
  //#region CommandBar
  {
    group: "CommandBar",
    name: "all fields",
    element: CommandBar,
    xml: "full.xml",
    xmlFolder: undefined,
    model: fullCommandBar,
    yamlModel: fullCommandBarFromYAML,
    source: fullCommandBarSource,
    yaml: fullCommandBarPartialYAML,
    enterprise: fullCommandBarEnterprise,
    context: commandBarYAMLContext,
  },
  {
    group: "CommandBar",
    name: "minimal fields",
    element: CommandBar,
    xml: "minimal.xml",
    xmlFolder: undefined,
    model: minimalCommandBar,
    yaml: undefined,
    enterprise: undefined,
    context: commandBarYAMLContext,
  },
  //#endregion
  //#region DendrogramField
  {
    group: "DendrogramField",
    name: "all fields",
    element: undefined,
    xml: "full.xml",
    xmlFolder: undefined,
    model: fullDendrogramField,
    yaml: fullDendrogramFieldPartialYAML,
    enterprise: fullDendrogramFieldEnterprise,
  },
  {
    group: "DendrogramField",
    name: "minimal fields",
    element: undefined,
    xml: "minimal.xml",
    xmlFolder: undefined,
    model: minimalDendrogramField,
    yaml: undefined,
    enterprise: undefined,
  },
  //#endregion
  //#region FormattedDocumentField
  {
    group: "FormattedDocumentField",
    name: "all fields",
    element: undefined,
    xml: "full.xml",
    xmlFolder: undefined,
    model: fullFormattedDocumentField,
    yaml: fullFormattedDocumentFieldPartialYAML,
    enterprise: fullFormattedDocumentFieldEnterprise,
  },
  {
    group: "FormattedDocumentField",
    name: "minimal fields",
    element: undefined,
    xml: "minimal.xml",
    xmlFolder: undefined,
    model: minimalFormattedDocumentField,
    yaml: undefined,
    enterprise: undefined,
  },
  //#endregion
  //#region GanttChartField
  {
    group: "GanttChartField",
    name: "all fields",
    element: undefined,
    xml: "full.xml",
    xmlFolder: undefined,
    model: fullGanttChartField,
    yaml: fullGanttChartFieldPartialYAML,
    enterprise: fullGanttChartFieldEnterprise,
  },
  {
    group: "GanttChartField",
    name: "minimal fields",
    element: undefined,
    xml: "minimal.xml",
    xmlFolder: undefined,
    model: minimalGanttChartField,
    yaml: undefined,
    enterprise: undefined,
  },
  //#endregion
  //#region GeographicalSchemaField
  {
    group: "GeographicalSchemaField",
    name: "all fields",
    element: undefined,
    xml: "full.xml",
    xmlFolder: undefined,
    model: fullGeographicalSchemaField,
    yaml: fullGeographicalSchemaFieldPartialYAML,
    enterprise: fullGeographicalSchemaFieldEnterprise,
  },
  {
    group: "GeographicalSchemaField",
    name: "minimal fields",
    element: undefined,
    xml: "minimal.xml",
    xmlFolder: undefined,
    model: minimalGeographicalSchemaField,
    yaml: undefined,
    enterprise: undefined,
  },
  //#endregion
  //#region GraphicalSchemaField
  {
    group: "GraphicalSchemaField",
    name: "all fields",
    element: undefined,
    xml: "full.xml",
    xmlFolder: undefined,
    model: fullGraphicalSchemaField,
    yaml: fullGraphicalSchemaFieldPartialYAML,
    enterprise: fullGraphicalSchemaFieldEnterprise,
  },
  {
    group: "GraphicalSchemaField",
    name: "minimal fields",
    element: undefined,
    xml: "minimal.xml",
    xmlFolder: undefined,
    model: minimalGraphicalSchemaField,
    yaml: undefined,
    enterprise: undefined,
  },
  //#endregion
  //#region HTMLDocumentField
  {
    group: "HTMLDocumentField",
    name: "all fields",
    element: undefined,
    xml: "full.xml",
    xmlFolder: "htmlDocumentField",
    model: fullHtmlDocumentField,
    yaml: fullHtmlDocumentFieldPartialYAML,
    enterprise: fullHtmlDocumentFieldEnterprise,
  },
  {
    group: "HTMLDocumentField",
    name: "minimal fields",
    element: undefined,
    xml: "minimal.xml",
    xmlFolder: "htmlDocumentField",
    model: minimalHtmlDocumentField,
    yaml: undefined,
    enterprise: undefined,
  },
  //#endregion
  //#region LabelDecoration
  {
    group: "LabelDecoration",
    name: "all fields",
    element: LabelDecoration,
    xml: "full.xml",
    xmlFolder: undefined,
    model: fullLabelDecoration,
    yaml: fullLabelDecorationPartialYAML,
    enterprise: fullLabelDecorationEnterprise,
  },
  {
    group: "LabelDecoration",
    name: "minimal fields",
    element: LabelDecoration,
    xml: "minimal.xml",
    xmlFolder: undefined,
    model: minimalLabelDecoration,
    yaml: undefined,
    enterprise: undefined,
  },
  //#endregion
  //#region LabelField
  {
    group: "LabelField",
    name: "all fields",
    element: LabelField,
    xml: "full.xml",
    xmlFolder: undefined,
    model: fullLabelField,
    yaml: fullLabelFieldPartialYAML,
    enterprise: fullLabelFieldEnterprise,
  },
  {
    group: "LabelField",
    name: "minimal fields",
    element: LabelField,
    xml: "minimal.xml",
    xmlFolder: undefined,
    model: minimalLabelField,
    yaml: undefined,
    enterprise: undefined,
  },
  {
    group: "LabelField",
    name: "autoCellHeight LabelField",
    element: LabelField,
    xml: "autoCellHeight.xml",
    xmlFolder: undefined,
    model: autoCellHeightLabelField,
    source: {
      itemType: "LabelField",
      name: "НадписьАвтоВысотаЯчейки",
    },
    yamlForImport: {
      АвтоВысотаЯчейки: "Истина",
    },
    yaml: undefined,
    enterprise: undefined,
  },
  //#endregion
  //#region TableLabelField
  {
    group: "TableLabelField",
    name: "all fields (table)",
    element: TableLabelField,
    xml: "fullTable.xml",
    xmlFolder: "labelField",
    model: fullTableLabelField,
    yaml: fullTableLabelFieldPartialYAML,
    typedYAMLModel: fullTableLabelFieldFromYAML,
    typedYAML: fullTableLabelFieldTypedYAML,
    enterprise: fullTableLabelFieldEnterprise,
  },
  {
    group: "TableLabelField",
    name: "minimal fields (table)",
    element: TableLabelField,
    xml: "minimalTable.xml",
    xmlFolder: "labelField",
    model: minimalTableLabelField,
    yaml: undefined,
    typedYAML: minimalTableLabelFieldTypedYAML,
    enterprise: undefined,
  },
  //#endregion
  //#region Page
  {
    group: "Page",
    name: "all fields",
    element: Page,
    xml: "full.xml",
    xmlFolder: undefined,
    model: fullPage,
    yaml: fullPagePartialYAMLForExport,
    enterprise: fullPageEnterprise,
  },
  {
    group: "Page",
    name: "minimal fields",
    element: Page,
    xml: "minimal.xml",
    xmlFolder: undefined,
    model: minimalPage,
    yaml: undefined,
    enterprise: undefined,
  },
  //#endregion
  //#region Pages
  {
    group: "Pages",
    name: "all fields",
    element: Pages,
    xml: "full.xml",
    xmlFolder: undefined,
    model: fullPages,
    yaml: fullPagesPartialYAML,
    enterprise: fullPagesEnterprise,
  },
  {
    group: "Pages",
    name: "minimal fields",
    element: Pages,
    xml: "minimal.xml",
    xmlFolder: undefined,
    model: minimalPages,
    yaml: undefined,
    typedYAML: minimalPagesTypedYAML,
    enterprise: undefined,
  },
  //#endregion
  //#region PDFDocumentField
  {
    group: "PDFDocumentField",
    name: "all fields",
    element: undefined,
    xml: "full.xml",
    xmlFolder: "pdfDocumentField",
    model: fullPDFDocumentField,
    yaml: fullPDFDocumentFieldPartialYAML,
    enterprise: fullPDFDocumentFieldEnterprise,
  },
  {
    group: "PDFDocumentField",
    name: "minimal fields",
    element: undefined,
    xml: "minimal.xml",
    xmlFolder: "pdfDocumentField",
    model: minimalPDFDocumentField,
    yaml: undefined,
    enterprise: undefined,
  },
  //#endregion
  //#region PeriodField
  {
    group: "PeriodField",
    name: "all fields",
    element: undefined,
    xml: "full.xml",
    xmlFolder: undefined,
    model: fullPeriodField,
    yaml: fullPeriodFieldPartialYAML,
    enterprise: fullPeriodFieldEnterprise,
  },
  {
    group: "PeriodField",
    name: "minimal fields",
    element: undefined,
    xml: "minimal.xml",
    xmlFolder: undefined,
    model: minimalPeriodField,
    yaml: undefined,
    enterprise: undefined,
  },
  //#endregion
  //#region PictureDecoration
  {
    group: "PictureDecoration",
    name: "all fields",
    element: PictureDecoration,
    xml: "full.xml",
    xmlFolder: undefined,
    model: fullPictureDecoration,
    source: sourcePictureDecoration,
    yaml: fullPictureDecorationPartialYAML,
    enterprise: fullPictureDecorationEnterprise,
  },
  {
    group: "PictureDecoration",
    name: "minimal fields",
    element: PictureDecoration,
    xml: "minimal.xml",
    xmlFolder: undefined,
    model: minimalPictureDecoration,
    yaml: undefined,
    enterprise: undefined,
  },
  //#endregion
  //#region PictureField
  {
    group: "PictureField",
    name: "all fields",
    element: PictureField,
    xml: "full.xml",
    xmlFolder: undefined,
    model: fullPictureField,
    yaml: fullPictureFieldPartialYAML,
    enterprise: fullPictureFieldEnterprise,
  },
  {
    group: "PictureField",
    name: "minimal fields",
    element: PictureField,
    xml: "minimal.xml",
    xmlFolder: undefined,
    model: minimalPictureField,
    yaml: undefined,
    enterprise: undefined,
  },
  //#endregion
  //#region TablePictureField
  {
    group: "TablePictureField",
    name: "all fields (table)",
    element: TablePictureField,
    xml: "fullTable.xml",
    xmlFolder: "pictureField",
    model: fullTablePictureField,
    yaml: fullTablePictureFieldPartialYAML,
    typedYAMLModel: fullTablePictureFieldFromYAML,
    typedYAML: fullTablePictureFieldTypedYAML,
    enterprise: fullTablePictureFieldEnterprise,
  },
  {
    group: "TablePictureField",
    name: "minimal fields (table)",
    element: TablePictureField,
    xml: "minimalTable.xml",
    xmlFolder: "pictureField",
    model: minimalTablePictureField,
    yaml: undefined,
    typedYAML: minimalTablePictureFieldTypedYAML,
    enterprise: undefined,
  },
  //#endregion
  //#region PlannerField
  {
    group: "PlannerField",
    name: "all fields",
    element: undefined,
    xml: "full.xml",
    xmlFolder: undefined,
    model: fullPlannerField,
    yaml: fullPlannerFieldPartialYAML,
    enterprise: fullPlannerFieldEnterprise,
  },
  {
    group: "PlannerField",
    name: "minimal fields",
    element: undefined,
    xml: "minimal.xml",
    xmlFolder: undefined,
    model: minimalPlannerField,
    yaml: undefined,
    enterprise: undefined,
  },
  {
    group: "PlannerField",
    name: "drag properties",
    element: undefined,
    xml: "drag.xml",
    xmlFolder: undefined,
    model: dragPlannerField,
    yaml: dragPlannerFieldPartialYAML,
    enterprise: dragPlannerFieldEnterprise,
  },
  //#endregion
  //#region Popup
  {
    group: "Popup",
    name: "all fields",
    element: Popup,
    xml: "full.xml",
    xmlFolder: undefined,
    model: fullPopup,
    yamlModel: fullPopupFromYAML,
    source: sourcePopup,
    yaml: fullPopupPartialYAML,
    typedYAML: fullPopupTypedYAML,
    enterprise: fullPopupEnterprise,
  },
  {
    group: "Popup",
    name: "minimal fields",
    element: Popup,
    xml: "minimal.xml",
    xmlFolder: undefined,
    model: minimalPopup,
    yaml: undefined,
    typedYAML: minimalPopupTypedYAML,
    enterprise: undefined,
  },
  //#endregion
  //#region ProgressBarField
  {
    group: "ProgressBarField",
    name: "all fields",
    element: undefined,
    xml: "full.xml",
    xmlFolder: undefined,
    model: fullProgressBarField,
    yaml: fullProgressBarFieldPartialYAML,
    enterprise: fullProgressBarFieldEnterprise,
  },
  {
    group: "ProgressBarField",
    name: "minimal fields",
    element: undefined,
    xml: "minimal.xml",
    xmlFolder: undefined,
    model: minimalProgressBarField,
    yaml: undefined,
    enterprise: undefined,
  },
  //#endregion
  //#region RadioButtonField
  {
    group: "RadioButtonField",
    name: "all fields",
    element: undefined,
    xml: "full.xml",
    xmlFolder: undefined,
    model: fullRadioButtonField,
    yaml: fullRadioButtonFieldPartialYAML,
    enterprise: fullRadioButtonFieldEnterprise,
  },
  {
    group: "RadioButtonField",
    name: "minimal fields",
    element: undefined,
    xml: "minimal.xml",
    xmlFolder: undefined,
    model: minimalRadioButtonField,
    yaml: undefined,
    enterprise: undefined,
  },
  //#endregion
  //#region SearchStringAddition
  {
    group: "SearchStringAddition",
    name: "all fields",
    element: undefined,
    xml: "full.xml",
    xmlFolder: undefined,
    model: fullSearchStringAddition,
    yamlModel: fullSearchStringAdditionFromCompactYAML,
    source: sourceSearchStringAddition,
    yaml: fullSearchStringAdditionYAML,
    enterprise: undefined,
  },
  {
    group: "SearchStringAddition",
    name: "minimal fields",
    element: undefined,
    xml: "minimal.xml",
    xmlFolder: undefined,
    model: minimalSearchStringAddition,
    source: sourceSearchStringAddition,
    yaml: undefined,
    enterprise: undefined,
  },
  //#endregion
  //#region SearchControlAddition
  {
    group: "SearchControlAddition",
    name: "all fields",
    element: undefined,
    xml: "full.xml",
    xmlFolder: undefined,
    model: fullSearchControlAddition,
    yamlModel: fullSearchControlAdditionFromCompactYAML,
    source: sourceSearchControlAddition,
    yaml: fullSearchControlAdditionYAML,
    enterprise: undefined,
  },
  {
    group: "SearchControlAddition",
    name: "minimal fields",
    element: undefined,
    xml: "minimal.xml",
    xmlFolder: undefined,
    model: minimalSearchControlAddition,
    source: sourceSearchControlAddition,
    yaml: undefined,
    enterprise: undefined,
  },
  //#endregion
  //#region ViewStatusAddition
  {
    group: "ViewStatusAddition",
    name: "all fields",
    element: undefined,
    xml: "full.xml",
    xmlFolder: undefined,
    model: fullViewStatusAddition,
    yaml: fullViewStatusAdditionYAML,
    enterprise: undefined,
  },
  {
    group: "ViewStatusAddition",
    name: "non-canonical source",
    element: undefined,
    xml: "nonCanonical.xml",
    xmlFolder: undefined,
    model: nonCanonicalViewStatusAddition,
    yaml: { Источник: "Подписи" },
    enterprise: undefined,
  },
  {
    group: "ViewStatusAddition",
    name: "visible false",
    element: undefined,
    xml: "visibleFalse.xml",
    xmlFolder: undefined,
    model: visibleFalseViewStatusAddition,
    yaml: visibleFalseViewStatusAdditionYAML,
    enterprise: undefined,
  },
  //#endregion
  //#region SpreadSheetDocumentField
  {
    group: "SpreadSheetDocumentField",
    name: "all fields",
    element: undefined,
    xml: "full.xml",
    xmlFolder: undefined,
    model: fullSpreadSheetDocumentField,
    yaml: fullSpreadSheetDocumentFieldPartialYAML,
    enterprise: fullSpreadSheetDocumentFieldEnterprise,
  },
  {
    group: "SpreadSheetDocumentField",
    name: "minimal fields",
    element: undefined,
    xml: "minimal.xml",
    xmlFolder: undefined,
    model: minimalSpreadSheetDocumentField,
    yaml: undefined,
    enterprise: undefined,
  },
  //#endregion
  //#region Table
  {
    group: "Table",
    name: "all fields",
    element: Table,
    xml: "full.xml",
    xmlFolder: undefined,
    model: fullTable,
    yamlModel: fullTableFromYAML,
    yaml: fullTableYAML,
    enterprise: fullTableEnterprise,
  },
  {
    group: "Table",
    name: "minimal fields",
    element: Table,
    xml: "minimal.xml",
    xmlFolder: undefined,
    model: minimalTable,
    yaml: undefined,
    enterprise: undefined,
  },
  {
    group: "Table",
    name: "dynamicList",
    element: Table,
    xml: "dynamicList.xml",
    xmlFolder: undefined,
    model: dynamicList,
    yamlModel: dynamicListFromYAML,
    yaml: dynamicListYAML,
    enterprise: undefined,
  },
  {
    group: "Table",
    name: "full tree",
    element: Table,
    xml: "fullTree.xml",
    xmlFolder: undefined,
    model: fullTree,
    yamlModel: fullTreeFromYAML,
    yaml: fullTreeYAML,
    enterprise: undefined,
  },
  {
    group: "Table",
    name: "dcsComposerFilter",
    element: Table,
    xml: "dcsComposerFilter.xml",
    xmlFolder: undefined,
    model: dcsComposerFilter,
    yamlModel: dcsComposerFilterFromYAML,
    yaml: dcsComposerFilterYAML,
    enterprise: undefined,
  },
  {
    group: "Table",
    name: "dcsComposerSettings",
    element: Table,
    xml: "dcsComposerSettings.xml",
    xmlFolder: undefined,
    model: dcsComposerSettings,
    yamlModel: dcsComposerSettingsFromYAML,
    yaml: dcsComposerSettingsYAML,
    enterprise: undefined,
  },
  //#endregion
  //#region TextDocumentField
  {
    group: "TextDocumentField",
    name: "all fields",
    element: undefined,
    xml: "full.xml",
    xmlFolder: undefined,
    model: fullTextDocumentField,
    yaml: fullTextDocumentFieldPartialYAML,
    enterprise: fullTextDocumentFieldEnterprise,
  },
  {
    group: "TextDocumentField",
    name: "minimal fields",
    element: undefined,
    xml: "minimal.xml",
    xmlFolder: undefined,
    model: minimalTextDocumentField,
    yaml: undefined,
    enterprise: undefined,
  },
  //#endregion
  //#region TrackBarField
  {
    group: "TrackBarField",
    name: "all fields",
    element: undefined,
    xml: "full.xml",
    xmlFolder: undefined,
    model: fullTrackBarField,
    yaml: fullTrackBarFieldPartialYAML,
    enterprise: fullTrackBarFieldEnterprise,
  },
  {
    group: "TrackBarField",
    name: "minimal fields",
    element: undefined,
    xml: "minimal.xml",
    xmlFolder: undefined,
    model: minimalTrackBarField,
    yaml: undefined,
    enterprise: undefined,
  },
  //#endregion
  //#region UsualGroup
  {
    group: "UsualGroup",
    name: "all fields",
    element: undefined,
    xml: "full.xml",
    xmlFolder: undefined,
    model: fullUsualGroup,
    yaml: fullUsualGroupPartialYAML,
    enterprise: fullUsualGroupEnterprise,
  },
  {
    group: "UsualGroup",
    name: "minimal fields",
    element: undefined,
    xml: "minimal.xml",
    xmlFolder: undefined,
    model: minimalUsualGroup,
    yaml: undefined,
    enterprise: undefined,
  },
  //#endregion
]

export const groupedFixtures = ElementFixtures.reduce(
  (acc, fixture) => {
    acc[fixture.group] = [...(acc[fixture.group] || []), fixture]
    return acc
  },
  {} as Record<string, ElementFixture[]>
)

export const typedElementFixtures = ElementFixtures.filter((f) => f.typedYAML !== undefined)

export const groupedTypedFixtures = typedElementFixtures.reduce(
  (acc, fixture) => {
    acc[fixture.group] = [...(acc[fixture.group] || []), fixture]
    return acc
  },
  {} as Record<string, ElementFixture[]>
)
