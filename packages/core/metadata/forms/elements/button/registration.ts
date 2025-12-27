import { registerFormat } from "~/format/formatFactory"
import { registerIsOneLineElementCheck } from "~/format/isOneLineElementCheckFactory"
import { FormElementType } from "../../../metadataFactory/types"
import { formatButton } from "./format"
import { Button } from "./types"

registerFormat<Button>(formatButton, (element: Button) => element.elementType === FormElementType.Button)
registerIsOneLineElementCheck<Button>(FormElementType.Button, () => true)
