import * as NKDK from "nkdk-language"
import { ConfigurationContext } from "~/metadata/context/types"
import { GroupChildItems } from "../commonObjects/childItems/types"
import { importChildItemsFromNKDK } from "../commonObjects/childItems/fromNKDK"
import { ClientApplicationForm } from "./types"

export const importClientApplicationFromFromNKDK = (params: {
  context: ConfigurationContext
  value: NKDK.Form
}): ClientApplicationForm | undefined => {
  const { context, value: value } = params

  const childItems = importChildItemsFromNKDK({ context, value: value.childItems })

  const result: ClientApplicationForm = {
    itemType: "ClientApplicationForm",
    childItems: childItems as GroupChildItems,
    commands: [],
  }

  return result
}
