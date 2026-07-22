import "./scrollBarUse/fromXML"
import "./scrollBarUse/fromYAML"
import "./scrollBarUse/toEnterprise"
import "./scrollBarUse/toJSONSchema"
import "./scrollBarUse/toXML"
import "./scrollBarUse/toYAML"
import "./tableAdditionalSource/fromXML"
import "./tableAdditionalSource/toJSONSchema"
import "./tableAdditionalSource/toXML"

import "./commandSet/fromXML"
import "./commandSet/fromYAML"
import "./commandSet/toJSONSchema"
import "./commandSet/toXML"
import "./commandSet/toYAML"

import "./commandInterface/fromXML"
import "./commandInterface/fromYAML"
import "./commandInterface/toJSONSchema"
import "./commandInterface/toXML"
import "./commandInterface/toYAML"

import "./formCommand/toJSONSchema"
import "./formCommand/types"

import "./formParameter/fromXML"
import "./formParameter/fromYAML"
import "./formParameter/toJSONSchema"
import "./formParameter/toXML"
import "./formParameter/toYAML"

import "./formAttribute/fromXMLToYAML"
import "./formAttribute/toJSONSchema"

import "./childItems/fromXMLToYAML"
import "./childItems/toEnterprise"
import "./childItems/toJSONSchema"
import { registerDirectFormElementCollections } from "../elements/orchestration/fromYAMLToXML"

registerDirectFormElementCollections()

import "./dataPath/toEnterprise"

import "./commandName/toEnterprise"
import "./commandName/toJSONSchema"

import "./event/fromXML"
import "./event/fromYAML"
import "./event/toJSONSchema"
import "./event/toXML"
import "./event/toYAML"

import "./dynamicList/types"
import "./chart/types"
import "./flowchartContext/types"
import "./ganttChartFieldTable/types"
import "./spreadsheetDocument/types"

import "./elementId/toXML"
