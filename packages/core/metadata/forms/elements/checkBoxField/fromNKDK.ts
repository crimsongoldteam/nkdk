import * as NKDK from "nkdk-language"
import { importI8nTextFromString } from "~/metadata/commonObjects/i8nText/helper"
import { ConfigurationContext } from "~/metadata/context/types"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { CheckBoxField } from "./types"

export const importCheckBoxFieldFromNKDK = (params: {
  context: ConfigurationContext
  source: NKDK.CheckBoxField
}): CheckBoxField => {
  const { context, source } = params
  const result: CheckBoxField = {
    itemType: CollectionFormElementType.CheckBoxField,
    name: source.name,
    title: importI8nTextFromString({ context, value: source.title }),
  }

  return result
}

export const importCheckBoxFieldSwitchFromNKDK = (params: {
  context: ConfigurationContext
  source: NKDK.CheckBoxFieldSwitch
}): CheckBoxField => {
  const { context, source } = params
  return {
    itemType: CollectionFormElementType.CheckBoxField,
    name: source.name,
    title: importI8nTextFromString({ context, value: source.title }),
  }
}

export const importCheckBoxFieldTumblerFromNKDK = (params: {
  context: ConfigurationContext
  source: NKDK.CheckBoxFieldTumbler
}): CheckBoxField => {
  const { context, source } = params
  return {
    itemType: CollectionFormElementType.CheckBoxField,
    name: source.name,
    title: importI8nTextFromString({ context, value: source.title }),
  }
}

export const importTableCheckboxFromNKDK = (params: {
  context: ConfigurationContext
  source: NKDK.TableCheckbox
}): CheckBoxField =>
  importCheckBoxFieldFromNKDK({
    context: params.context,
    source: { name: params.source.name, title: params.source.title } as NKDK.CheckBoxField,
  })
