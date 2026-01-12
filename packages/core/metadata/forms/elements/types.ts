import { ConfigurationContext } from "~/metadata/context/types"
import { BaseElement, BaseElementPropsEnterprise } from "./baseElement/types"

export type ImportFromEnterpriseReturn<
  From extends BaseElementPropsEnterprise | undefined,
  To extends BaseElement | undefined,
  Name extends string | undefined,
> = From extends undefined ? undefined : Name extends undefined ? Partial<To> : To

export type ImportExportReturn<From, To> = From extends undefined ? undefined : To

export type ImportPropsFromEnterpriseReturn<
  From extends BaseElementPropsEnterprise | undefined,
  To extends BaseElement | undefined,
> = From extends undefined ? undefined : Partial<To>

export interface ImportPropsFromEnterpriseFn<From extends Object, To extends BaseElement> {
  (context: ConfigurationContext, data: From): From extends undefined ? undefined : Partial<To> | undefined
}
