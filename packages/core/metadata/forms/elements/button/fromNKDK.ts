import * as NKDK from "nkdk-language"
import { ConfigurationContext } from "~/metadata/context/types"

import { importI8nTextFromNKDK, importNameFromNKDK } from "~/metadata/orchestration/formElement/fromNKDK/helpers"
import { Button, CommandBarButton } from "./types"

export const importButtonFromNKDK = (params: { context: ConfigurationContext; source: NKDK.Button }): Button => {
  const { context, source } = params
  const result: Button = {
    itemType: "Button",
    name: importNameFromNKDK(source),
    title: importI8nTextFromNKDK(context, source.title),
  }

  return result
}

export const importCommandBarButtonFromNKDK = (params: {
  context: ConfigurationContext
  source: NKDK.CommandBarButton
}): CommandBarButton => {
  const { context, source } = params
  return {
    itemType: "CommandBarButton",
    name: importNameFromNKDK(source),
    title: importI8nTextFromNKDK(context, source.title),
  }
}
