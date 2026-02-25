import * as NKDK from "nkdk-language"
import { ConfigurationContext } from "~/metadata/context/types"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import {
  importDataPathFromNKDK,
  importI8nTextFromNKDK,
  importNameFromNKDK,
} from "~/metadata/metadataFactory/elements/fromNKDKFactory/helpers"
import * as SE from "~/metadata/systemEnumerations/types"
import { CheckBoxField } from "./types"

export const importCheckBoxFieldFromNKDK = (params: {
  context: ConfigurationContext
  source: NKDK.CheckBoxField
}): CheckBoxField => {
  return importFromNKDK({
    context: params.context,
    source: params.source,
  })
}

export const importCheckBoxFieldRightTitledFromNKDK = (params: {
  context: ConfigurationContext
  source: NKDK.CheckBoxFieldRightTitled
}): CheckBoxField => {
  return importFromNKDK({
    context: params.context,
    source: params.source,
    titleLocation: "Right",
  })
}
export const importCheckBoxFieldSwitchFromNKDK = (params: {
  context: ConfigurationContext
  source: NKDK.CheckBoxFieldSwitch
}): CheckBoxField => {
  return importFromNKDK({
    context: params.context,
    source: params.source,
    type: "Switch",
  })
}

export const importCheckBoxFieldSwitchRightTitledFromNKDK = (params: {
  context: ConfigurationContext
  source: NKDK.CheckBoxFieldSwitchRightTitled
}): CheckBoxField => {
  return importFromNKDK({
    context: params.context,
    source: params.source,
    type: "Switch",
    titleLocation: "Right",
  })
}

export const importCheckBoxFieldTumblerFromNKDK = (params: {
  context: ConfigurationContext
  source: NKDK.CheckBoxFieldTumbler
}): CheckBoxField => {
  return importFromNKDK({
    context: params.context,
    source: params.source,
    type: "Tumbler",
  })
}

export const importCheckBoxFieldTumblerRightTitledFromNKDK = (params: {
  context: ConfigurationContext
  source: NKDK.CheckBoxFieldTumblerRightTitled
}): CheckBoxField => {
  return importFromNKDK({
    context: params.context,
    source: params.source,
    type: "Tumbler",
    titleLocation: "Right",
  })
}

export const importTableCheckboxFromNKDK = (params: {
  context: ConfigurationContext
  source: NKDK.TableCheckbox
}): CheckBoxField =>
  importFromNKDK({
    context: params.context,
    source: params.source,
  })

const importFromNKDK = (params: {
  context: ConfigurationContext
  source:
    | NKDK.CheckBoxField
    | NKDK.CheckBoxFieldRightTitled
    | NKDK.CheckBoxFieldSwitch
    | NKDK.CheckBoxFieldSwitchRightTitled
    | NKDK.CheckBoxFieldTumbler
    | NKDK.CheckBoxFieldTumblerRightTitled
    | NKDK.TableCheckbox
  type?: SE.CheckBoxType
  titleLocation?: SE.FormItemTitleLocation
}): CheckBoxField => {
  const { context, source, type, titleLocation } = params

  const title = importI8nTextFromNKDK(context, source.title)

  const result: CheckBoxField = {
    itemType: CollectionFormElementType.CheckBoxField,
    name: importNameFromNKDK(source),
  }

  if (title !== undefined) {
    result.title = title
  }

  if (titleLocation) {
    result.titleLocation = titleLocation
  }
  if (type) {
    result.checkBoxType = type
  }

  const dataPath = importDataPathFromNKDK(source)
  if (dataPath) {
    result.dataPath = dataPath
  }

  return result
}
