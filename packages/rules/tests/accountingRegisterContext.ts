import type { ConfigurationContextWithExportToXML } from "@nkdk/runtime"
import { createDirectRoundTripContexts } from "./directConversion"
import { mockContextToXML } from "./mockContext"

const LOGICAL_ADDRESS = "РегистрБухгалтерии.Тест"

export function accountingRegisterContext(
  variant: "full" | "adopted",
): ConfigurationContextWithExportToXML {
  const contexts = createDirectRoundTripContexts({ logicalAddress: LOGICAL_ADDRESS })
  const context = contexts.exportContext(mockContextToXML())
  return {
    ...context,
    exportToXML: {
      ...context.exportToXML,
      itemsTree: [{
        itemType: "MetadataAccountingRegister",
        name: "Тест",
        path: "MetadataAccountingRegister.Тест",
      }],
      ...(variant === "adopted"
        ? { xmlDefaultVariantByLogicalAddress: { [LOGICAL_ADDRESS]: "adopted" as const } }
        : {}),
    },
  }
}
