export interface GuideDefinition {
  uri: string
  name: string
  description: string
  text: string
}

export const guideDefinitions: GuideDefinition[] = [
  {
    uri: "nkdk://guides/config-edit-yaml",
    name: "config-edit-yaml",
    description: "Создание и изменение YAML-файлов конфигурации по схеме NKDK.",
    text: [
      "# Редактирование YAML-конфигурации",
      "",
      "Используй этот guide при создании или изменении YAML-файлов конфигурации.",
      "",
      "Если пользователь хочет переименовать metadata-объект, реквизит, табличную часть, форму или макет, не правь YAML руками: вызови `nkdk.rename_item`. Если пользователь хочет проверить удаление или найти ссылки, вызови `nkdk.find_references`: инструмент ищет внешние ссылки и не изменяет файлы.",
      "Корень NKDK-проекта передавай как `projectDir`; компонент передавай как `componentPath` (`cf`, `cfe/<Имя>`, `erf/<Имя>`, `epf/<Имя>`), если нужен не основной `cf`.",
      "Цель передавай строкой `metadataRef`: русские сегменты через точку. Примеры: `Справочник.Товары`, `Справочник.Товары.Реквизит.Артикул`, `Документ.Заказ.ТабличнаяЧасть.Товары.Реквизит.Количество`, `Справочник.Товары.Форма.ФормаЭлемента`, `Справочник.Товары.Макет.Печать`.",
      "",
      "Не используй старые /skills/**: источником правды являются MCP guides и prompts из `packages/mcp`.",
      "",
      "Порядок работы:",
      "1. Определи корень NKDK-проекта, компонент и относительный путь YAML-файла внутри компонента.",
      "2. Вызови `nkdk.get_schema` с `structurePath` для будущего или существующего файла либо с `metadataRef` для именованной схемы.",
      "3. Для сложных полей сначала используй `keys`, `required`, `search` и `exact`.",
      "4. Найди 1-2 соседних YAML-файла того же типа и повтори локальную структуру каталогов.",
      "5. Внеси минимальное изменение файловыми инструментами агента.",
      "6. Вызови `nkdk.validate_project`, затем получи результат через `nkdk.get_operation` по возвращённому `operationId`.",
    ].join("\n"),
  },
  {
    uri: "nkdk://guides/config-import-from-xml",
    name: "config-import-from-xml",
    description: "Безопасный импорт XML-выгрузки 1С в YAML-проект.",
    text: [
      "# Импорт XML в YAML",
      "",
      "Перед вызовом `nkdk.import_from_xml` проверь, что XML-каталог существует и похож на XML-выгрузку одного компонента 1С.",
      "Проверь только существующий корень NKDK-проекта с каталогом cf. `nkdk.import_from_xml` принимает `projectDir`, необязательный `componentPath` как ограничение и `xmlDir`; `xmlDir` не строится как `xmlRootDir/componentPath`.",
      "Не определяй и не создавай cfe, не проверяй его пустоту: core определит componentPath из Configuration.xml и вернёт конфликты целевого каталога и снимка.",
      "Импорт пишет результат напрямую в целевой компонент. При ошибке сначала разберись в diagnostics. Не очищай существующую цель автоматически: повтор возможен только после явного устранения пользователем конкретного конфликта. Конфликт только снимка не устраняется очисткой целевого компонента.",
      "В этой версии import не подключается к 1С и не импортирует все компоненты за один вызов: входом служит готовый каталог XML-выгрузки одного компонента.",
      "Tool пишет файлы только при `allowWrite: true`.",
      "Вызов сразу возвращает `operationId`. Запрашивай `nkdk.get_operation` с теми же `projectDir` и `operationId` до состояния `succeeded`, `failed`, `cancelled` или `interrupted`.",
    ].join("\n"),
  },
  {
    uri: "nkdk://guides/config-sync-to-xml",
    name: "config-sync-to-xml",
    description: "Безопасная синхронизация YAML-проекта в XML-выгрузку.",
    text: [
      "# Синхронизация YAML в XML",
      "",
      "Перед вызовом `nkdk.sync_to_xml` проверь корень NKDK-проекта, выбранный компонент и наличие LMDB-индекса `.nkdk/components/cf/configuration-index.lmdb`.",
      "`nkdk.sync_to_xml` выгружает один компонент `projectDir/componentPath` в заданный `xmlDir`; `xmlDir` не строится как `xmlRootDir/componentPath`.",
      "Tool пишет файлы только при `allowWrite: true`.",
      "Вызов сразу возвращает `operationId`. Следи за ним через `nkdk.get_operation`; для явной отмены используй `nkdk.cancel_operation`.",
    ].join("\n"),
  },
  {
    uri: "nkdk://guides/config-validate-yaml",
    name: "config-validate-yaml",
    description: "Проверка YAML-проекта NKDK через MCP.",
    text: [
      "# Проверка YAML-проекта",
      "",
      "Используй `nkdk.validate_project` после редактирования YAML.",
      "`nkdk.validate_project` принимает корень NKDK-проекта и проверяет все компоненты.",
      "Вызов сразу возвращает `operationId`. Запрашивай `nkdk.get_operation` до состояния `succeeded`; при `failed`, `cancelled` или `interrupted` сообщи это пользователю.",
      "Из результата верни пользователю diagnostics с `filePath`, `line`, `col`, `severity` и `message`.",
    ].join("\n"),
  },
]
