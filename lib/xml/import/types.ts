import { TBaseElement } from "~/lib/metadata/forms/elements/baseElement/types"

export type ImportFunction<T extends TBaseElement> = (value: any) => T
