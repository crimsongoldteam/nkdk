import { ClientApplicationForm, ClientApplicationFormPreview } from "./types"

export const exportToPreview = (_form: ClientApplicationForm): ClientApplicationFormPreview => {
  return {
    attributes: [],
    childItems: [],
  }
}
