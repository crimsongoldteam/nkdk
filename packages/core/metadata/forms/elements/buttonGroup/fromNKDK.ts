import * as NKDK from "nkdk-language"
import { ConfigurationContext } from "~/metadata/context/types"

import { importI8nTextFromNKDK, importNameFromNKDK } from "~/metadata/orchestration/formElement/fromNKDK/helpers"
import { ButtonGroup } from "./types"

export const importCommandGroupFromNKDK = (params: {
  context: ConfigurationContext
  source: NKDK.CommandGroup
}): ButtonGroup => {
  const { context, source } = params

  const result: ButtonGroup = {
    itemType: "ButtonGroup",
    name: importNameFromNKDK(source),
    title: importI8nTextFromNKDK(context, source.title ?? ""),
    childItems: [],
  }

  return result
}
