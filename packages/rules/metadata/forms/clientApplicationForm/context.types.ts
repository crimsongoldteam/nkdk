import type { FormChildItemsPartialYAML, FormElementsYAML } from "../commonObjects/childItems/types"
import type { FormAttribute } from "../commonObjects/formAttribute/types"
import type { EnterpriseAttributeMapItem } from "./types"
import type { ContextElementToEnterprise } from "@nkdk/runtime/rule-kit"

declare module "../../context/types" {
  interface MetadataContextTypeMap {
    formDataPathAttribute: FormAttribute
  }

  interface EnterpriseContext {
    prefix: string
    attributes: Record<string, EnterpriseAttributeMapItem>
    elementsTree: ContextElementToEnterprise[]
    allElementsNames: string[]
  }

  interface ConfigurationContext {
    allElements?: FormElementsYAML
    enterprise?: EnterpriseContext
  }

  interface FormExportToYAMLContext {
    formAttributes?: readonly FormAttribute[]
  }

  interface FormimportFromYAMLContext {
    allElements?: FormChildItemsPartialYAML
    formAttributes?: readonly FormAttribute[]
    readonly resolveTableSourceProfile?: (dataPath: unknown) => "dynamicList" | "rowFilter" | "none"
  }
}
