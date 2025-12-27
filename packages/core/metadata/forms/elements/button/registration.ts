import { registerFormat } from "~/packages/core/format/formatFactory"
import { registerIsOneLineElementCheck } from "~/packages/core/format/isOneLineElementCheckFactory"
import { FormElementType } from "../../../metadataFactory/types"
import { formatButton } from "./format"
import { Button } from "./types"

registerFormat<Button>(formatButton, (element: Button) => element.elementType === FormElementType.Button)
registerIsOneLineElementCheck<Button>(FormElementType.Button, () => true)
