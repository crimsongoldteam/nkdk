import * as NKDK from "nkdk-language"
import { ConfigurationContext } from "~/metadata/context/types"
import { importChildItemsFromNKDK } from "../commonObjects/childItems/fromNKDK"
import { GroupChildItems } from "../commonObjects/childItems/types"
import { importAutoCommandBarFromNKDK } from "../elements/autoCommandBar/fromNKDK"
import { ClientApplicationForm } from "./types"

export const importClientApplicationFromFromNKDK = (params: {
  context: ConfigurationContext
  value: NKDK.Form
}): ClientApplicationForm | undefined => {
  const { context, value: value } = params

  const childItems = importChildItemsFromNKDK({ context, value: value.childItems })

  const autoCommandBar = importAutoCommandBarFromNKDK({ context, source: value.autoCommandBar })

  const result: ClientApplicationForm = {
    itemType: "ClientApplicationForm",
    childItems: childItems as GroupChildItems,
    commands: [],
  }

  if (autoCommandBar) result.autoCommandBar = autoCommandBar

  return result
}
