export interface PromptDefinition {
  name: string
  title: string
  description: string
  text: string
}

export const promptDefinitions: PromptDefinition[] = [
  {
    name: "nkdk_config_edit_yaml",
    title: "Edit NKDK YAML",
    description: "Создать или изменить YAML-файл конфигурации по схеме NKDK.",
    text: [
      "Прочитай resource `nkdk://guides/config-edit-yaml`.",
      "Если пользователь просит переименовать metadata-цель, не правь YAML руками: вызови `nkdk.rename_item`. Если пользователь хочет проверить удаление или найти ссылки на metadata-цель, вызови `nkdk.find_references` и передай `metadataRef` строкой через точку, например `Справочник.Товары.Реквизит.Артикул` или `Документ.Заказ.ТабличнаяЧасть.Товары.Реквизит.Количество`.",
      "Используй `nkdk.get_schema` с `structurePath` или `metadataRef`, чтобы получить схему целевого YAML-файла.",
      "Измени YAML файловыми инструментами агента.",
      "Проверь результат через `nkdk.validate_project`.",
    ].join("\n"),
  },
  {
    name: "nkdk_config_import_from_xml",
    title: "Import XML to YAML",
    description: "Импортировать XML-выгрузку 1С в YAML-проект.",
    text: [
      "Прочитай resource `nkdk://guides/config-import-from-xml`.",
      "Проверь XML-каталог одного компонента и корень NKDK-проекта с каталогом cf; не определяй и не создавай cfe, core вернёт componentPath и конфликты.",
      "Вызови `nkdk.import_from_xml` только после явного решения писать файлы с `allowWrite: true`.",
    ].join("\n"),
  },
  {
    name: "nkdk_config_sync_to_xml",
    title: "Sync YAML to XML",
    description: "Синхронизировать YAML-проект в XML-выгрузку.",
    text: [
      "Прочитай resource `nkdk://guides/config-sync-to-xml`.",
      "Проверь корень NKDK-проекта, выбранный компонент, файл индекса конфигурации и заданный XML-каталог записи.",
      "Вызови `nkdk.sync_to_xml` только после явного решения писать файлы с `allowWrite: true`.",
    ].join("\n"),
  },
  {
    name: "nkdk_config_validate_yaml",
    title: "Validate NKDK YAML",
    description: "Проверить YAML-проект NKDK.",
    text: [
      "Прочитай resource `nkdk://guides/config-validate-yaml`.",
      "Вызови `nkdk.validate_project` для корня NKDK-проекта; сейчас инструмент валидирует компонент `cf`.",
      "Сообщи diagnostics по путям, строкам, severity и сообщениям.",
    ].join("\n"),
  },
]
