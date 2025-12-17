import { Form, Radio } from "antd"
import type React from "react"
import type { ChoiceListItem } from "~/lib/metadata/commonObjects/choiceList/types"
import type { RadioButtonField } from "~/lib/metadata/forms/elements/radioButtonField/types"

export function RadioButtonFieldComponent(props: Readonly<RadioButtonField>): React.ReactNode {
  const options = props.choiceList?.items.map((item: ChoiceListItem) => ({
    label: item.presentation?.items.ru,
    value: item.value,
  }))
  return (
    <Form.Item>
      <Radio.Group id={`radioButton_${props.name}`} options={options}></Radio.Group>
    </Form.Item>
  )
}
