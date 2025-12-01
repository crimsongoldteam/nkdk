import { Form, Radio } from "antd"
import type React from "react"
import type { TRadioButtonField } from "~/lib/metadata/forms/elements/radioButtonField/types"

export function RadioButtonFieldComponent(props: Readonly<TRadioButtonField>): React.ReactNode {
  const options = props.choiceList?.items.map((item) => ({
    label: item.presentation?.items.ru,
    value: item.value,
  }))
  return (
    <Form.Item>
      <Radio.Group id={`radioButton_${props.name}`} options={options}></Radio.Group>
    </Form.Item>
  )
}
