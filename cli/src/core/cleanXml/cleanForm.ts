import { addNamespaces } from "./addNamespaces.js"
import { buildXml } from "./buildXml.js"
import { parseXml } from "./parseXml.js"
import { removeEmptyNodes } from "./removeEmptyNodes.js"
import { setFormElementId } from "./setFormElementId.js"
import { sortData } from "./sortData.js"
import { CleanContext } from "./types.js"

const formContext: CleanContext = {
  namespaces: {
    xmlns: "http://v8.1c.ru/8.3/xcf/logform",
    "xmlns:app": "http://v8.1c.ru/8.2/managed-application/core",
    "xmlns:cfg": "http://v8.1c.ru/8.1/data/enterprise/current-config",
    "xmlns:dcscor": "http://v8.1c.ru/8.1/data-composition-system/core",
    "xmlns:dcssch": "http://v8.1c.ru/8.1/data-composition-system/schema",
    "xmlns:dcsset": "http://v8.1c.ru/8.1/data-composition-system/settings",
    "xmlns:ent": "http://v8.1c.ru/8.1/data/enterprise",
    "xmlns:lf": "http://v8.1c.ru/8.2/managed-application/logform",
    "xmlns:style": "http://v8.1c.ru/8.1/data/ui/style",
    "xmlns:sys": "http://v8.1c.ru/8.1/data/ui/fonts/system",
    "xmlns:v8": "http://v8.1c.ru/8.1/data/core",
    "xmlns:v8ui": "http://v8.1c.ru/8.1/data/ui",
    "xmlns:web": "http://v8.1c.ru/8.1/data/ui/colors/web",
    "xmlns:win": "http://v8.1c.ru/8.1/data/ui/colors/windows",
    "xmlns:xr": "http://v8.1c.ru/8.3/xcf/readable",
    "xmlns:xs": "http://www.w3.org/2001/XMLSchema",
    "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
    version: "2.20",
  },

  sortableTags: [
    "Attribute",
    "Command",
    "UsualGroup",
    "RadioButtonField",
    "Button",
    "ButtonGroup",
    "CalendarField",
    "ChartField",
    "CheckBoxField",
    "ColumnGroup",
    "CommandBar",
    "DendrogramField",
    "FormattedDocumentField",
    "Table",
    "GanttChartField",
    "GeographicalSchemaField",
    "GraphicalSchemaField",
    "HTMLDocumentField",
    "InputField",
    "LabelDecoration",
    "LabelField",
    "Page",
    "Pages",
    "PdfDocumentField",
    "PeriodField",
    "PictureDecoration",
    "PictureField",
    "PlannerField",
    "Popup",
    "ProgressBarField",
    "RadioButtonField",
    "SpreadSheetDocumentField",
    "TextDocumentField",
    "TrackBarField",
    "UsualGroup",
    "ViewStatusAddition",
    "SearchControlAddition",
    "SearchStringAddition",
  ],
}

const pipe =
  <T>(...fns: Array<(arg: T) => T>) =>
  (value: T) =>
    fns.reduce((acc, fn) => fn(acc), value)

export const cleanForm = (xmlContent: string): string => {
  const transform = pipe(
    (data) => addNamespaces(formContext, data),
    (data) => removeEmptyNodes(formContext, data),
    (data) => sortData(formContext, data, false, ""),
    (data) => setFormElementId(formContext, data)
  )

  const parsedData = parseXml(xmlContent)
  const processedData = transform(parsedData)
  return buildXml(processedData)
}
