# Архитектура

## Операции

<table style="border-collapse: collapse; table-layout: fixed; width: 5940px; min-width: 5940px;">
  <thead>
    <tr>
      <th style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box;">Операция</th>
      <th style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box;">Поиск файлов проекта</th>
      <th style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box;">Классификация файлов проекта</th>
      <th style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box;">Поиск XML-файлов выгрузки</th>
      <th style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box;">Классификация XML-файлов выгрузки</th>
      <th style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box;">Чтение YAML</th>
      <th style="background-color: rgba(59, 130, 246, 0.14); border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box;">Парсинг YAML</th>
      <th style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box;">Чтение XML</th>
      <th style="background-color: rgba(59, 130, 246, 0.14); border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box;">Парсинг XML</th>
      <th style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box;">Чтение внешнего файла проекта</th>
      <th style="background-color: rgba(59, 130, 246, 0.14); border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box;">Проверка по схеме</th>
      <th style="background-color: rgba(59, 130, 246, 0.14); border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box;">Построение модели</th>
      <th style="background-color: rgba(59, 130, 246, 0.14); border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box;">Сбор объявлений</th>
      <th style="background-color: rgba(59, 130, 246, 0.14); border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box;">Сбор использований</th>
      <th style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box;">Построение индекса объявлений</th>
      <th style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box;">Распределение использований</th>
      <th style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box;">Передача данных в worker</th>
      <th style="background-color: rgba(59, 130, 246, 0.14); border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box;">Проверка использований</th>
      <th style="background-color: rgba(59, 130, 246, 0.14); border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box;">Построение XML</th>
      <th style="background-color: rgba(59, 130, 246, 0.14); border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box;">Сериализация XML</th>
      <th style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box;">Запись XML</th>
      <th style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box;">Учёт XML-файлов</th>
      <th style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box;">Удаление устаревших XML-файлов</th>
      <th style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box;">Запись YAML</th>
      <th style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box;">Запись прочих файлов</th>
      <th style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box;">Переименование путей</th>
      <th style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box;">Удаление путей</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th rowspan="4" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; border-top: 3px solid rgba(200, 200, 200, 0.8); border-bottom: 3px solid rgba(200, 200, 200, 0.8); border-left: 3px solid rgba(200, 200, 200, 0.8);">Импорт из XML</th>
      <td colspan="2" rowspan="4" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; background-color: rgba(127, 127, 127, 0.18); border-top: 3px solid rgba(200, 200, 200, 0.8); border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-top: 3px solid rgba(200, 200, 200, 0.8);"><span style="font-family: monospace; overflow-wrap: anywhere;">Корень XML-выгрузки</span></td>
      <td colspan="4" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-top: 3px solid rgba(200, 200, 200, 0.8);"><span style="font-family: monospace; overflow-wrap: anywhere;">Описание XML-файла выгрузки</span></td>
      <td colspan="4" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-top: 3px solid rgba(200, 200, 200, 0.8);"><span style="font-family: monospace; overflow-wrap: anywhere;">XML-данные</span></td>
      <td colspan="11" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; background-color: rgba(127, 127, 127, 0.18); border-top: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
      <td colspan="2" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-top: 3px solid rgba(200, 200, 200, 0.8);"><span style="font-family: monospace; overflow-wrap: anywhere;">Целевой путь</span></td>
      <td colspan="2" rowspan="4" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; background-color: rgba(127, 127, 127, 0.18); border-top: 3px solid rgba(200, 200, 200, 0.8); border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
    </tr>
    <tr>
      <td colspan="21" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; "><span style="font-family: monospace; overflow-wrap: anywhere;">rules.ts</span></td>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">Содержимое внешнего файла</span></td>
    </tr>
    <tr>
      <td colspan="2" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">Список путей XML-файлов выгрузки</span></td>
      <td colspan="2" rowspan="2" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; background-color: rgba(127, 127, 127, 0.18); border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
      <td colspan="2" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; "><span style="font-family: monospace; overflow-wrap: anywhere;">XML-текст</span></td>
      <td colspan="2" rowspan="2" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; background-color: rgba(127, 127, 127, 0.18); border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
      <td colspan="13" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; "><span style="font-family: monospace; overflow-wrap: anywhere;">Metadata-модель</span></td>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">Прочий файл</span></td>
    </tr>
    <tr>
      <td colspan="2" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
      <td colspan="2" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; background: linear-gradient(to right, transparent 0%, transparent 50%, transparent 50%, transparent 100%); border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
      <td colspan="12" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; background: linear-gradient(to right, transparent 0%, transparent 8.3333%, rgba(127, 127, 127, 0.18) 8.3333%, rgba(127, 127, 127, 0.18) 16.6667%, rgba(127, 127, 127, 0.18) 16.6667%, rgba(127, 127, 127, 0.18) 25%, rgba(127, 127, 127, 0.18) 25%, rgba(127, 127, 127, 0.18) 33.3333%, rgba(127, 127, 127, 0.18) 33.3333%, rgba(127, 127, 127, 0.18) 41.6667%, rgba(127, 127, 127, 0.18) 41.6667%, rgba(127, 127, 127, 0.18) 50%, rgba(127, 127, 127, 0.18) 50%, rgba(127, 127, 127, 0.18) 58.3333%, rgba(127, 127, 127, 0.18) 58.3333%, rgba(127, 127, 127, 0.18) 66.6667%, rgba(127, 127, 127, 0.18) 66.6667%, rgba(127, 127, 127, 0.18) 75%, rgba(127, 127, 127, 0.18) 75%, rgba(127, 127, 127, 0.18) 83.3333%, rgba(127, 127, 127, 0.18) 83.3333%, rgba(127, 127, 127, 0.18) 91.6667%, rgba(127, 127, 127, 0.18) 91.6667%, rgba(127, 127, 127, 0.18) 100%); border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-bottom: 3px solid rgba(200, 200, 200, 0.8);"><span style="font-family: monospace; overflow-wrap: anywhere;">YAML-файл</span></td>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
    </tr>
    <tr>
      <th rowspan="7" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; border-top: 3px solid rgba(200, 200, 200, 0.8); border-bottom: 3px solid rgba(200, 200, 200, 0.8); border-left: 3px solid rgba(200, 200, 200, 0.8);">Синхронизация в XML</th>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-top: 3px solid rgba(200, 200, 200, 0.8);"><span style="font-family: monospace; overflow-wrap: anywhere;">Корень проекта</span></td>
      <td colspan="4" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-top: 3px solid rgba(200, 200, 200, 0.8);"><span style="font-family: monospace; overflow-wrap: anywhere;">Описание YAML-файла проекта</span></td>
      <td colspan="6" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-top: 3px solid rgba(200, 200, 200, 0.8);"><span style="font-family: monospace; overflow-wrap: anywhere;">YAML-данные</span></td>
      <td colspan="8" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; background: linear-gradient(to right, rgba(127, 127, 127, 0.18) 0%, rgba(127, 127, 127, 0.18) 12.5%, rgba(127, 127, 127, 0.18) 12.5%, rgba(127, 127, 127, 0.18) 25%, rgba(127, 127, 127, 0.18) 25%, rgba(127, 127, 127, 0.18) 37.5%, rgba(127, 127, 127, 0.18) 37.5%, rgba(127, 127, 127, 0.18) 50%, rgba(127, 127, 127, 0.18) 50%, rgba(127, 127, 127, 0.18) 62.5%, rgba(127, 127, 127, 0.18) 62.5%, rgba(127, 127, 127, 0.18) 75%, transparent 75%, transparent 87.5%, transparent 87.5%, transparent 100%); border-top: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
      <td colspan="5" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-top: 3px solid rgba(200, 200, 200, 0.8);"><span style="font-family: monospace; overflow-wrap: anywhere;">Целевой путь</span></td>
      <td colspan="2" rowspan="7" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; background-color: rgba(127, 127, 127, 0.18); border-top: 3px solid rgba(200, 200, 200, 0.8); border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
    </tr>
    <tr>
      <td colspan="2" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">Правила структуры проекта</span></td>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">Корень XML-выгрузки</span></td>
      <td colspan="4" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; "><span style="font-family: monospace; overflow-wrap: anywhere;">Описание XML-файла выгрузки</span></td>
      <td colspan="12" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; "><span style="font-family: monospace; overflow-wrap: anywhere;">XML-данные</span></td>
      <td colspan="2" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">XML-файл</span></td>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">XML-каталог</span></td>
      <td rowspan="4" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; background-color: rgba(127, 127, 127, 0.18);">&nbsp;</td>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">Прочий файл</span></td>
    </tr>
    <tr>
      <td colspan="2" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">Список путей файлов проекта</span></td>
      <td colspan="16" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; "><span style="font-family: monospace; overflow-wrap: anywhere;">rules.ts</span></td>
      <td colspan="2" rowspan="2" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; background: linear-gradient(to right, transparent 0%, transparent 50%, transparent 50%, transparent 100%);">&nbsp;</td>
      <td colspan="2" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">XML-манифест</span></td>
      <td rowspan="3" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;">&nbsp;</td>
    </tr>
    <tr>
      <td rowspan="4" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
      <td colspan="8" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; "><span style="font-family: monospace; overflow-wrap: anywhere;">Описание внешнего файла проекта</span></td>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; background-color: rgba(127, 127, 127, 0.18);">&nbsp;</td>
      <td colspan="8" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; "><span style="font-family: monospace; overflow-wrap: anywhere;">Metadata-модель</span></td>
      <td colspan="2" rowspan="2" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;">&nbsp;</td>
    </tr>
    <tr>
      <td rowspan="3" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
      <td colspan="2" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">Список путей XML-файлов выгрузки</span></td>
      <td colspan="2" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; "><span style="font-family: monospace; overflow-wrap: anywhere;">YAML-текст</span></td>
      <td colspan="14" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; "><span style="font-family: monospace; overflow-wrap: anywhere;">XML-текст</span></td>
    </tr>
    <tr>
      <td colspan="3" rowspan="2" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; "><span style="font-family: monospace; overflow-wrap: anywhere;">Позиции YAML</span></td>
      <td colspan="2" rowspan="2" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; background: linear-gradient(to right, transparent 0%, transparent 50%, transparent 50%, transparent 100%); border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
      <td colspan="16" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; "><span style="font-family: monospace; overflow-wrap: anywhere;">Содержимое внешнего файла</span></td>
    </tr>
    <tr>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-bottom: 3px solid rgba(200, 200, 200, 0.8);"><span style="font-family: monospace; overflow-wrap: anywhere;">Синтаксические диагностики YAML</span></td>
      <td colspan="2" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; background: linear-gradient(to right, transparent 0%, transparent 50%, rgba(127, 127, 127, 0.18) 50%, rgba(127, 127, 127, 0.18) 100%); border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
      <td colspan="8" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-bottom: 3px solid rgba(200, 200, 200, 0.8);"><span style="font-family: monospace; overflow-wrap: anywhere;">Исходная metadata-модель из XML</span></td>
      <td colspan="6" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; background: linear-gradient(to right, transparent 0%, transparent 16.6667%, transparent 16.6667%, transparent 33.3333%, transparent 33.3333%, transparent 50%, transparent 50%, transparent 66.6667%, rgba(127, 127, 127, 0.18) 66.6667%, rgba(127, 127, 127, 0.18) 83.3333%, transparent 83.3333%, transparent 100%); border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
    </tr>
    <tr>
      <th rowspan="6" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; border-top: 3px solid rgba(200, 200, 200, 0.8); border-bottom: 3px solid rgba(200, 200, 200, 0.8); border-left: 3px solid rgba(200, 200, 200, 0.8);">Валидация</th>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-top: 3px solid rgba(200, 200, 200, 0.8);"><span style="font-family: monospace; overflow-wrap: anywhere;">Корень проекта</span></td>
      <td colspan="4" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-top: 3px solid rgba(200, 200, 200, 0.8);"><span style="font-family: monospace; overflow-wrap: anywhere;">Описание YAML-файла проекта</span></td>
      <td colspan="8" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-top: 3px solid rgba(200, 200, 200, 0.8);"><span style="font-family: monospace; overflow-wrap: anywhere;">YAML-данные</span></td>
      <td colspan="3" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-top: 3px solid rgba(200, 200, 200, 0.8);"><span style="font-family: monospace; overflow-wrap: anywhere;">Индекс объявлений метаданных</span></td>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-top: 3px solid rgba(200, 200, 200, 0.8);"><span style="font-family: monospace; overflow-wrap: anywhere;">Диагностики использований метаданных</span></td>
      <td colspan="9" rowspan="6" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; background-color: rgba(127, 127, 127, 0.18); border-top: 3px solid rgba(200, 200, 200, 0.8); border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
    </tr>
    <tr>
      <td colspan="2" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">Правила структуры проекта</span></td>
      <td colspan="2" rowspan="5" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; background-color: rgba(127, 127, 127, 0.18); border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
      <td colspan="2" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; "><span style="font-family: monospace; overflow-wrap: anywhere;">YAML-текст</span></td>
      <td colspan="3" rowspan="5" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; background-color: rgba(127, 127, 127, 0.18); border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; "><span style="font-family: monospace; overflow-wrap: anywhere;">JSON Schema</span></td>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; "><span style="font-family: monospace; overflow-wrap: anywhere;">rules.ts</span></td>
      <td colspan="3" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; "><span style="font-family: monospace; overflow-wrap: anywhere;">Объявления метаданных</span></td>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">Список worker</span></td>
      <td colspan="2" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; "><span style="font-family: monospace; overflow-wrap: anywhere;">Задание проверки использований</span></td>
    </tr>
    <tr>
      <td colspan="2" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">Список путей файлов проекта</span></td>
      <td rowspan="4" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; "><span style="font-family: monospace; overflow-wrap: anywhere;">Позиции YAML</span></td>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; "><span style="font-family: monospace; overflow-wrap: anywhere;">Диагностики структуры YAML</span></td>
      <td colspan="3" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; "><span style="font-family: monospace; overflow-wrap: anywhere;">Metadata-модель</span></td>
      <td colspan="3" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">Владельцы объявлений метаданных</span></td>
      <td rowspan="4" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
    </tr>
    <tr>
      <td colspan="2" rowspan="3" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; "><span style="font-family: monospace; overflow-wrap: anywhere;">Синтаксические диагностики YAML</span></td>
      <td colspan="3" rowspan="3" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
      <td colspan="3" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; "><span style="font-family: monospace; overflow-wrap: anywhere;">Использования метаданных</span></td>
      <td rowspan="2" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;">&nbsp;</td>
    </tr>
    <tr>
      <td rowspan="2" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
      <td colspan="3" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; "><span style="font-family: monospace; overflow-wrap: anywhere;">Проверки DataPath</span></td>
    </tr>
    <tr>
      <td colspan="2" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; background: linear-gradient(to right, transparent 0%, transparent 50%, transparent 50%, transparent 100%); border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
      <td colspan="2" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-bottom: 3px solid rgba(200, 200, 200, 0.8);"><span style="font-family: monospace; overflow-wrap: anywhere;">Часть использований метаданных</span></td>
    </tr>
    <tr>
      <th rowspan="3" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; border-top: 3px solid rgba(200, 200, 200, 0.8); border-bottom: 3px solid rgba(200, 200, 200, 0.8); border-left: 3px solid rgba(200, 200, 200, 0.8);">Подсказка схем</th>
      <td rowspan="3" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; background-color: rgba(127, 127, 127, 0.18); border-top: 3px solid rgba(200, 200, 200, 0.8); border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-top: 3px solid rgba(200, 200, 200, 0.8);"><span style="font-family: monospace; overflow-wrap: anywhere;">Список путей файлов проекта</span></td>
      <td colspan="24" rowspan="3" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; background-color: rgba(127, 127, 127, 0.18); border-top: 3px solid rgba(200, 200, 200, 0.8); border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
    </tr>
    <tr>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">Правила структуры проекта</span></td>
    </tr>
    <tr>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-bottom: 3px solid rgba(200, 200, 200, 0.8);"><span style="font-family: monospace; overflow-wrap: anywhere;">Описание YAML-файла проекта</span></td>
    </tr>
    <tr>
      <th rowspan="7" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; border-top: 3px solid rgba(200, 200, 200, 0.8); border-bottom: 3px solid rgba(200, 200, 200, 0.8); border-left: 3px solid rgba(200, 200, 200, 0.8);">Переименование</th>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-top: 3px solid rgba(200, 200, 200, 0.8);"><span style="font-family: monospace; overflow-wrap: anywhere;">Корень проекта</span></td>
      <td colspan="4" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-top: 3px solid rgba(200, 200, 200, 0.8);"><span style="font-family: monospace; overflow-wrap: anywhere;">Описание YAML-файла проекта</span></td>
      <td colspan="8" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-top: 3px solid rgba(200, 200, 200, 0.8);"><span style="font-family: monospace; overflow-wrap: anywhere;">YAML-данные</span></td>
      <td colspan="4" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-top: 3px solid rgba(200, 200, 200, 0.8);"><span style="font-family: monospace; overflow-wrap: anywhere;">Индекс объявлений метаданных</span></td>
      <td colspan="5" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; background-color: rgba(127, 127, 127, 0.18); border-top: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
      <td colspan="3" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-top: 3px solid rgba(200, 200, 200, 0.8);"><span style="font-family: monospace; overflow-wrap: anywhere;">Целевой путь</span></td>
      <td rowspan="7" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; background-color: rgba(127, 127, 127, 0.18); border-top: 3px solid rgba(200, 200, 200, 0.8); border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
    </tr>
    <tr>
      <td colspan="2" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">Правила структуры проекта</span></td>
      <td colspan="2" rowspan="6" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; background-color: rgba(127, 127, 127, 0.18); border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
      <td colspan="2" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; "><span style="font-family: monospace; overflow-wrap: anywhere;">YAML-текст</span></td>
      <td colspan="3" rowspan="6" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; background-color: rgba(127, 127, 127, 0.18); border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; "><span style="font-family: monospace; overflow-wrap: anywhere;">JSON Schema</span></td>
      <td colspan="13" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; "><span style="font-family: monospace; overflow-wrap: anywhere;">rules.ts</span></td>
      <td rowspan="6" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; background-color: rgba(127, 127, 127, 0.18); border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">Исходный путь</span></td>
    </tr>
    <tr>
      <td colspan="2" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">Список путей файлов проекта</span></td>
      <td rowspan="5" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; "><span style="font-family: monospace; overflow-wrap: anywhere;">Позиции YAML</span></td>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; "><span style="font-family: monospace; overflow-wrap: anywhere;">Диагностики структуры YAML</span></td>
      <td colspan="13" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; "><span style="font-family: monospace; overflow-wrap: anywhere;">Metadata-модель</span></td>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">Переименованный путь</span></td>
    </tr>
    <tr>
      <td colspan="2" rowspan="4" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; "><span style="font-family: monospace; overflow-wrap: anywhere;">Синтаксические диагностики YAML</span></td>
      <td colspan="2" rowspan="4" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
      <td colspan="3" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; "><span style="font-family: monospace; overflow-wrap: anywhere;">Объявления метаданных</span></td>
      <td colspan="2" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; background-color: rgba(127, 127, 127, 0.18);">&nbsp;</td>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; "><span style="font-family: monospace; overflow-wrap: anywhere;">Диагностики использований метаданных</span></td>
      <td colspan="5" rowspan="4" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; background-color: rgba(127, 127, 127, 0.18); border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">YAML-файл</span></td>
      <td rowspan="4" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
    </tr>
    <tr>
      <td rowspan="3" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
      <td rowspan="3" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
      <td colspan="5" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; "><span style="font-family: monospace; overflow-wrap: anywhere;">Использования метаданных</span></td>
      <td rowspan="3" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
    </tr>
    <tr>
      <td colspan="5" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; "><span style="font-family: monospace; overflow-wrap: anywhere;">Проверки DataPath</span></td>
    </tr>
    <tr>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
      <td colspan="4" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-bottom: 3px solid rgba(200, 200, 200, 0.8);"><span style="font-family: monospace; overflow-wrap: anywhere;">Владельцы объявлений метаданных</span></td>
    </tr>
    <tr>
      <th rowspan="7" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; border-top: 3px solid rgba(200, 200, 200, 0.8); border-bottom: 3px solid rgba(200, 200, 200, 0.8); border-left: 3px solid rgba(200, 200, 200, 0.8);">Удаление</th>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-top: 3px solid rgba(200, 200, 200, 0.8);"><span style="font-family: monospace; overflow-wrap: anywhere;">Корень проекта</span></td>
      <td colspan="4" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-top: 3px solid rgba(200, 200, 200, 0.8);"><span style="font-family: monospace; overflow-wrap: anywhere;">Описание YAML-файла проекта</span></td>
      <td colspan="8" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-top: 3px solid rgba(200, 200, 200, 0.8);"><span style="font-family: monospace; overflow-wrap: anywhere;">YAML-данные</span></td>
      <td colspan="4" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-top: 3px solid rgba(200, 200, 200, 0.8);"><span style="font-family: monospace; overflow-wrap: anywhere;">Индекс объявлений метаданных</span></td>
      <td colspan="5" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; background-color: rgba(127, 127, 127, 0.18); border-top: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-top: 3px solid rgba(200, 200, 200, 0.8);"><span style="font-family: monospace; overflow-wrap: anywhere;">Целевой путь</span></td>
      <td colspan="2" rowspan="7" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; background-color: rgba(127, 127, 127, 0.18); border-top: 3px solid rgba(200, 200, 200, 0.8); border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-top: 3px solid rgba(200, 200, 200, 0.8);"><span style="font-family: monospace; overflow-wrap: anywhere;">Удаляемый путь</span></td>
    </tr>
    <tr>
      <td colspan="2" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">Правила структуры проекта</span></td>
      <td colspan="2" rowspan="6" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; background-color: rgba(127, 127, 127, 0.18); border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
      <td colspan="2" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; "><span style="font-family: monospace; overflow-wrap: anywhere;">YAML-текст</span></td>
      <td colspan="3" rowspan="6" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; background-color: rgba(127, 127, 127, 0.18); border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; "><span style="font-family: monospace; overflow-wrap: anywhere;">JSON Schema</span></td>
      <td colspan="13" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; "><span style="font-family: monospace; overflow-wrap: anywhere;">rules.ts</span></td>
      <td rowspan="6" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
    </tr>
    <tr>
      <td colspan="2" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">Список путей файлов проекта</span></td>
      <td rowspan="5" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; "><span style="font-family: monospace; overflow-wrap: anywhere;">Позиции YAML</span></td>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; "><span style="font-family: monospace; overflow-wrap: anywhere;">Диагностики структуры YAML</span></td>
      <td colspan="13" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; "><span style="font-family: monospace; overflow-wrap: anywhere;">Metadata-модель</span></td>
    </tr>
    <tr>
      <td colspan="2" rowspan="4" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; "><span style="font-family: monospace; overflow-wrap: anywhere;">Синтаксические диагностики YAML</span></td>
      <td colspan="2" rowspan="4" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
      <td colspan="3" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; "><span style="font-family: monospace; overflow-wrap: anywhere;">Объявления метаданных</span></td>
      <td colspan="2" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; background-color: rgba(127, 127, 127, 0.18);">&nbsp;</td>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; "><span style="font-family: monospace; overflow-wrap: anywhere;">Диагностики использований метаданных</span></td>
      <td colspan="5" rowspan="4" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; background-color: rgba(127, 127, 127, 0.18); border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">YAML-файл</span></td>
    </tr>
    <tr>
      <td rowspan="3" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
      <td rowspan="3" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
      <td colspan="5" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; "><span style="font-family: monospace; overflow-wrap: anywhere;">Использования метаданных</span></td>
      <td rowspan="3" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
    </tr>
    <tr>
      <td colspan="5" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; "><span style="font-family: monospace; overflow-wrap: anywhere;">Проверки DataPath</span></td>
    </tr>
    <tr>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
      <td colspan="4" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-bottom: 3px solid rgba(200, 200, 200, 0.8);"><span style="font-family: monospace; overflow-wrap: anywhere;">Владельцы объявлений метаданных</span></td>
    </tr>
  </tbody>
</table>

<p>Каждый прямоугольник показывает жизнь результата от первого до последнего использующего его шага. Результат, живущий один шаг, занимает одну колонку. <span style="background-color: rgba(59, 130, 246, 0.14);">Синий фон заголовка</span> означает, что шаг выполняется в worker. <span style="background-color: rgba(127, 127, 127, 0.18);">Серый фон пустой области</span> означает, что шаг не участвует в операции. После правой границы владелец операции должен удалить результат из памяти. Общие регистрации, схемы и другие данные, которыми операция не владеет, перестают учитываться операцией, но не удаляются ею.</p>

## Именование данных

- Материализованная коллекция явно называется списком; независимо обрабатываемые элементы называются в единственном числе.
- Создающий и потребляющий шаги используют одно и то же точное название.
- Каждое название записывается отдельно и выделяется как код.

## Артефакты

| Артефакт | Описание |
|---|---|
| `Корень проекта` | Каталог, относительно которого выполняется операция. |
| `Правила структуры проекта` | Правила обнаружения, классификации и размещения YAML и внешних файлов проекта. |
| `Список путей файлов проекта` | Пути YAML и внешних файлов проекта, выбранных для текущей операции. |
| `Описание YAML-файла проекта` | Путь YAML-файла, его роль и правила соответствующего объекта метаданных. |
| `Описание внешнего файла проекта` | Путь внешнего файла, его роль и правила соответствующего свойства метаданных. |
| `Корень XML-выгрузки` | Каталог исходной XML-выгрузки конфигурации. |
| `Список путей XML-файлов выгрузки` | Пути XML-файлов, найденных в исходной XML-выгрузке. |
| `Описание XML-файла выгрузки` | Путь XML-файла, его роль и правила соответствующего объекта метаданных. |
| `YAML-текст` | Исходное текстовое содержимое YAML-файла. |
| `YAML-данные` | Разобранные структурированные данные YAML-файла. |
| `Позиции YAML` | Координаты элементов YAML для привязки диагностик. |
| `Синтаксические диагностики YAML` | Ошибки, обнаруженные при разборе YAML. |
| `XML-текст` | Исходное или подготовленное текстовое содержимое XML-файла. |
| `XML-данные` | Разобранные структурированные данные XML-файла. |
| `Содержимое внешнего файла` | Текстовое или бинарное содержимое внешнего файла метаданных. |
| `JSON Schema` | Схема допустимой структуры YAML-данных. |
| `Диагностики структуры YAML` | Нарушения структуры YAML-данных относительно JSON Schema. |
| `rules.ts` | Декларативные правила преобразования metadata-модели. |
| `Metadata-модель` | Внутреннее представление объекта метаданных. |
| `Объявления метаданных` | Метаданные, реквизиты и значения, объявленные в файле. |
| `Использования метаданных` | Ссылки на метаданные, найденные в файле. |
| `Проверки DataPath` | Отложенные проверки путей к данным. |
| `Индекс объявлений метаданных` | Общий индекс объявленных метаданных проекта. |
| `Владельцы объявлений метаданных` | Связи объявлений с содержащими их объектами. |
| `Список worker` | Доступные worker для распределения вычислений. |
| `Часть использований метаданных` | Часть использований метаданных, назначенная одному worker. |
| `Задание проверки использований` | Индекс, владельцы объявлений и использования для второго прохода worker. |
| `Диагностики использований метаданных` | Ошибки ссылок на метаданные и путей к данным. |
| `Исходная metadata-модель из XML` | Metadata-модель из исходной XML-выгрузки, используемая для сохранения XML-данных. |
| `Целевой путь` | Путь, по которому должен быть записан или перемещён файл. |
| `XML-файл` | XML-файл, записанный на диск. |
| `XML-манифест` | Перечень XML-файлов, созданных текущей синхронизацией. |
| `XML-каталог` | Каталог с XML-файлами результата синхронизации. |
| `YAML-файл` | YAML-файл, записанный на диск. |
| `Прочий файл` | Модуль, бинарный или другой внешний файл, записанный на диск. |
| `Исходный путь` | Текущий путь переименовываемого файла или каталога. |
| `Переименованный путь` | Новый путь переименованного файла или каталога. |
| `Удаляемый путь` | Путь файла или каталога, который должен быть удалён. |

## Шаги

| Шаг | Описание | Потребляет | Создаёт | Worker |
|---|---|---|---|---:|
| Поиск файлов проекта | Находит YAML и внешние файлы проекта, которые могут участвовать в текущей операции. | `Корень проекта`<br>`Правила структуры проекта` | `Список путей файлов проекта` |  |
| Классификация файлов проекта | Разделяет найденные файлы проекта по роли и применимым правилам. | `Список путей файлов проекта`<br>`Правила структуры проекта` | `Описание YAML-файла проекта`<br>`Описание внешнего файла проекта` |  |
| Поиск XML-файлов выгрузки | Находит XML-файлы объектов метаданных в исходной XML-выгрузке. | `Корень XML-выгрузки`<br>`rules.ts` | `Список путей XML-файлов выгрузки` |  |
| Классификация XML-файлов выгрузки | Определяет роль XML-файла и правила соответствующего объекта метаданных. | `Список путей XML-файлов выгрузки`<br>`rules.ts` | `Описание XML-файла выгрузки` |  |
| Чтение YAML | Читает текст YAML-файла проекта с диска. | `Описание YAML-файла проекта` | `YAML-текст` |  |
| Парсинг YAML | Преобразует YAML-текст в данные и координаты элементов. | `YAML-текст` | `YAML-данные`<br>`Позиции YAML`<br>`Синтаксические диагностики YAML` | ✓ |
| Чтение XML | Читает текст XML-файла из исходной выгрузки. | `Описание XML-файла выгрузки` | `XML-текст` |  |
| Парсинг XML | Преобразует XML-текст в структурированные XML-данные. | `XML-текст` | `XML-данные` | ✓ |
| Чтение внешнего файла проекта | Читает содержимое модуля, бинарного или другого внешнего файла проекта. | `Описание внешнего файла проекта` | `Содержимое внешнего файла` |  |
| Проверка по схеме | Проверяет разобранные YAML-данные по JSON Schema файла. | `YAML-данные`<br>`JSON Schema` | `Диагностики структуры YAML` | ✓ |
| Построение модели | Преобразует разобранные данные в metadata-модель по rules.ts. | `YAML-данные`<br>`XML-данные`<br>`Содержимое внешнего файла`<br>`rules.ts` | `Metadata-модель` | ✓ |
| Сбор объявлений | Извлекает объекты, реквизиты и значения, объявленные в файле. | `Metadata-модель`<br>`YAML-данные` | `Объявления метаданных` | ✓ |
| Сбор использований | Извлекает ссылки на метаданные и проверки DataPath из файла. | `Metadata-модель`<br>`YAML-данные` | `Использования метаданных`<br>`Проверки DataPath` | ✓ |
| Построение индекса объявлений | Объединяет объявления всех файлов в общий индекс проекта. | `Объявления метаданных` | `Индекс объявлений метаданных`<br>`Владельцы объявлений метаданных` |  |
| Распределение использований | Разбивает использования и проверки DataPath на части для второго прохода worker. | `Использования метаданных`<br>`Проверки DataPath`<br>`Список worker` | `Часть использований метаданных` |  |
| Передача данных в worker | Передаёт worker индекс объявлений, владельцев объявлений и назначенные использования. | `Индекс объявлений метаданных`<br>`Владельцы объявлений метаданных`<br>`Часть использований метаданных` | `Задание проверки использований` |  |
| Проверка использований | Проверяет ссылки и DataPath по общему индексу и владельцам объявлений. | `Задание проверки использований` | `Диагностики использований метаданных` | ✓ |
| Построение XML | Преобразует metadata-модель в структурированные XML-данные. | `Metadata-модель`<br>`rules.ts`<br>`Исходная metadata-модель из XML` | `XML-данные` | ✓ |
| Сериализация XML | Преобразует структурированные XML-данные в текст XML. | `XML-данные` | `XML-текст` | ✓ |
| Запись XML | Записывает XML-текст в целевой файл. | `XML-текст`<br>`Целевой путь` | `XML-файл` |  |
| Учёт XML-файлов | Добавляет записанный XML-файл в манифест синхронизации. | `XML-файл`<br>`XML-манифест` | `XML-манифест` |  |
| Удаление устаревших XML-файлов | Удаляет из целевого XML-каталога файлы, отсутствующие в манифесте текущей синхронизации. | `XML-каталог`<br>`XML-манифест` | `XML-каталог` |  |
| Запись YAML | Сериализует и записывает metadata-модель в YAML-файл. | `Metadata-модель`<br>`rules.ts`<br>`Целевой путь` | `YAML-файл` |  |
| Запись прочих файлов | Записывает модули, бинарные данные и другие внешние файлы. | `Содержимое внешнего файла`<br>`Целевой путь` | `Прочий файл` |  |
| Переименование путей | Переименовывает файл или каталог согласно плану операции. | `Исходный путь`<br>`Целевой путь` | `Переименованный путь` |  |
| Удаление путей | Удаляет файл или каталог согласно плану операции. | `Удаляемый путь` | — |  |
