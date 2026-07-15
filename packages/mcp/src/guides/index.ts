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
      "Цель передавай строкой `path`: русские сегменты через точку. Примеры: `Справочник.Товары`, `Справочник.Товары.Реквизит.Артикул`, `Документ.Заказ.ТабличнаяЧасть.Товары.Реквизит.Количество`, `Справочник.Товары.Форма.ФормаЭлемента`, `Справочник.Товары.Макет.Печать`.",
      "",
      "Не используй старые /skills/**: источником правды являются MCP guides и prompts из `packages/mcp`.",
      "",
      "Порядок работы:",
      "1. Определи корень YAML-проекта и относительный путь YAML-файла.",
      "2. Вызови `nkdk.get_schema` для будущего или существующего файла.",
      "3. Для сложных полей сначала используй `keys`, `required`, `search` и `exact`.",
      "4. Найди 1-2 соседних YAML-файла того же типа и повтори локальную структуру каталогов.",
      "5. Внеси минимальное изменение файловыми инструментами агента.",
      "6. Вызови `nkdk.validate_project` для всего проекта или изменённого файла.",
    ].join("\n"),
  },
  {
    uri: "nkdk://guides/config-import-from-xml",
    name: "config-import-from-xml",
    description: "Безопасный импорт XML-выгрузки 1С в YAML-проект.",
    text: [
      "# Импорт XML в YAML",
      "",
      "Перед вызовом `nkdk.import_from_xml` проверь, что XML-каталог существует и похож на XML-выгрузку 1С.",
      "Если YAML-каталог существует и не пустой, сначала покажи пользователю, что будет обновлено.",
      "Tool пишет файлы только при `allowWrite: true`.",
    ].join("\n"),
  },
  {
    uri: "nkdk://guides/config-sync-to-xml",
    name: "config-sync-to-xml",
    description: "Безопасная синхронизация YAML-проекта в XML-выгрузку.",
    text: [
      "# Синхронизация YAML в XML",
      "",
      "Перед вызовом `nkdk.sync_to_xml` проверь YAML-проект, XML-каталог записи и optional reference-каталог.",
      "Не используй исходную XML-выгрузку как проверочный каталог без явного согласия пользователя.",
      "Tool пишет файлы только при `allowWrite: true`.",
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
      "Для DataPath и ссылок предпочтительна проверка всего проекта, а не только одного файла.",
      "Верни пользователю diagnostics с `filePath`, `line`, `col`, `severity` и `message`.",
    ].join("\n"),
  },
]
