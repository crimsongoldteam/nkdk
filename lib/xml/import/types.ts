import { BaseElement } from "~/lib/metadata/forms/elements/baseElement/types"

export type ImportFunction<T extends BaseElement | undefined> = (value: any) => T
