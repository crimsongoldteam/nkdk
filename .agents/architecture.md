# Архитектура

## Операции

<table style="border-collapse: collapse; table-layout: fixed; width: 4180px; min-width: 4180px;">
  <thead>
    <tr>
      <th style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box;">Операция</th>
      <th style="background-color: rgba(59, 130, 246, 0.14); border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box;">Подготовка YAML-проекта</th>
      <th style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box;">Поиск XML-файлов выгрузки</th>
      <th style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box;">Классификация XML-файлов выгрузки</th>
      <th style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box;">Чтение XML</th>
      <th style="background-color: rgba(59, 130, 246, 0.14); border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box;">Парсинг XML</th>
      <th style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box;">Чтение внешнего файла проекта</th>
      <th style="background-color: rgba(59, 130, 246, 0.14); border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box;">Проверка по схеме</th>
      <th style="background-color: rgba(59, 130, 246, 0.14); border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box;">Построение модели</th>
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
      <td rowspan="4" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; background-color: rgba(127, 127, 127, 0.18); border-top: 3px solid rgba(200, 200, 200, 0.8); border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-top: 3px solid rgba(200, 200, 200, 0.8);"><span style="font-family: monospace; overflow-wrap: anywhere;">Корень XML-выгрузки</span></td>
      <td colspan="2" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-top: 3px solid rgba(200, 200, 200, 0.8);"><span style="font-family: monospace; overflow-wrap: anywhere;">Описание XML-файла выгрузки</span></td>
      <td colspan="4" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-top: 3px solid rgba(200, 200, 200, 0.8);"><span style="font-family: monospace; overflow-wrap: anywhere;">XML-данные</span></td>
      <td colspan="6" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; background-color: rgba(127, 127, 127, 0.18); border-top: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
      <td colspan="2" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-top: 3px solid rgba(200, 200, 200, 0.8);"><span style="font-family: monospace; overflow-wrap: anywhere;">Целевой путь</span></td>
      <td colspan="2" rowspan="4" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; background-color: rgba(127, 127, 127, 0.18); border-top: 3px solid rgba(200, 200, 200, 0.8); border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
    </tr>
    <tr>
      <td colspan="14" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">rules.ts</span></td>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">Содержимое внешнего файла</span></td>
    </tr>
    <tr>
      <td colspan="2" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">Список путей XML-файлов выгрузки</span></td>
      <td colspan="2" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">XML-текст</span></td>
      <td colspan="2" rowspan="2" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; background-color: rgba(127, 127, 127, 0.18); border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
      <td colspan="8" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">Metadata-модель</span></td>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">Прочий файл</span></td>
    </tr>
    <tr>
      <td colspan="4" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
      <td colspan="7" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; background: linear-gradient(to right, transparent 0%, transparent 14.2857%, rgba(127, 127, 127, 0.18) 14.2857%, rgba(127, 127, 127, 0.18) 28.5714%, rgba(127, 127, 127, 0.18) 28.5714%, rgba(127, 127, 127, 0.18) 42.8571%, rgba(127, 127, 127, 0.18) 42.8571%, rgba(127, 127, 127, 0.18) 57.1429%, rgba(127, 127, 127, 0.18) 57.1429%, rgba(127, 127, 127, 0.18) 71.4286%, rgba(127, 127, 127, 0.18) 71.4286%, rgba(127, 127, 127, 0.18) 85.7143%, rgba(127, 127, 127, 0.18) 85.7143%, rgba(127, 127, 127, 0.18) 100%); border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-bottom: 3px solid rgba(200, 200, 200, 0.8);"><span style="font-family: monospace; overflow-wrap: anywhere;">YAML-файл</span></td>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
    </tr>
    <tr>
      <th rowspan="9" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; border-top: 3px solid rgba(200, 200, 200, 0.8); border-bottom: 3px solid rgba(200, 200, 200, 0.8); border-left: 3px solid rgba(200, 200, 200, 0.8);">Синхронизация в XML</th>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-top: 3px solid rgba(200, 200, 200, 0.8);"><span style="font-family: monospace; overflow-wrap: anywhere;">Корень проекта</span></td>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-top: 3px solid rgba(200, 200, 200, 0.8);"><span style="font-family: monospace; overflow-wrap: anywhere;">Корень XML-выгрузки</span></td>
      <td colspan="2" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-top: 3px solid rgba(200, 200, 200, 0.8);"><span style="font-family: monospace; overflow-wrap: anywhere;">Описание XML-файла выгрузки</span></td>
      <td colspan="7" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-top: 3px solid rgba(200, 200, 200, 0.8);"><span style="font-family: monospace; overflow-wrap: anywhere;">XML-данные</span></td>
      <td colspan="5" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-top: 3px solid rgba(200, 200, 200, 0.8);"><span style="font-family: monospace; overflow-wrap: anywhere;">Целевой путь</span></td>
      <td colspan="2" rowspan="9" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; background-color: rgba(127, 127, 127, 0.18); border-top: 3px solid rgba(200, 200, 200, 0.8); border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
    </tr>
    <tr>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">Правила структуры проекта</span></td>
      <td colspan="9" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">rules.ts</span></td>
      <td rowspan="2" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;">&nbsp;</td>
      <td colspan="2" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">XML-файл</span></td>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">XML-каталог</span></td>
      <td rowspan="2" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; background-color: rgba(127, 127, 127, 0.18);">&nbsp;</td>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">Прочий файл</span></td>
    </tr>
    <tr>
      <td colspan="8" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">Разобранные YAML-файлы worker</span></td>
      <td colspan="2" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; background: linear-gradient(to right, rgba(127, 127, 127, 0.18) 0%, rgba(127, 127, 127, 0.18) 50%, transparent 50%, transparent 100%);">&nbsp;</td>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;">&nbsp;</td>
      <td colspan="2" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">XML-манифест</span></td>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;">&nbsp;</td>
    </tr>
    <tr>
      <td colspan="16" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">Общий индекс объявлений метаданных</span></td>
    </tr>
    <tr>
      <td colspan="16" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">Часть индекса использований метаданных</span></td>
    </tr>
    <tr>
      <td colspan="6" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">Описание внешнего файла проекта</span></td>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; background-color: rgba(127, 127, 127, 0.18);">&nbsp;</td>
      <td colspan="3" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">Metadata-модель</span></td>
      <td colspan="6" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; background: linear-gradient(to right, transparent 0%, transparent 16.6667%, transparent 16.6667%, transparent 33.3333%, transparent 33.3333%, transparent 50%, transparent 50%, transparent 66.6667%, rgba(127, 127, 127, 0.18) 66.6667%, rgba(127, 127, 127, 0.18) 83.3333%, transparent 83.3333%, transparent 100%);">&nbsp;</td>
    </tr>
    <tr>
      <td rowspan="3" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
      <td colspan="2" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">Список путей XML-файлов выгрузки</span></td>
      <td colspan="9" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">XML-текст</span></td>
      <td colspan="4" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; background: linear-gradient(to right, transparent 0%, transparent 25%, transparent 25%, transparent 50%, rgba(127, 127, 127, 0.18) 50%, rgba(127, 127, 127, 0.18) 75%, transparent 75%, transparent 100%);">&nbsp;</td>
    </tr>
    <tr>
      <td colspan="4" rowspan="2" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
      <td colspan="11" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">Содержимое внешнего файла</span></td>
    </tr>
    <tr>
      <td colspan="2" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; background: linear-gradient(to right, transparent 0%, transparent 50%, rgba(127, 127, 127, 0.18) 50%, rgba(127, 127, 127, 0.18) 100%); border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
      <td colspan="3" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-bottom: 3px solid rgba(200, 200, 200, 0.8);"><span style="font-family: monospace; overflow-wrap: anywhere;">Исходная metadata-модель из XML</span></td>
      <td colspan="6" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; background: linear-gradient(to right, transparent 0%, transparent 16.6667%, transparent 16.6667%, transparent 33.3333%, transparent 33.3333%, transparent 50%, transparent 50%, transparent 66.6667%, rgba(127, 127, 127, 0.18) 66.6667%, rgba(127, 127, 127, 0.18) 83.3333%, transparent 83.3333%, transparent 100%); border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
    </tr>
    <tr>
      <th rowspan="5" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; border-top: 3px solid rgba(200, 200, 200, 0.8); border-bottom: 3px solid rgba(200, 200, 200, 0.8); border-left: 3px solid rgba(200, 200, 200, 0.8);">Валидация</th>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-top: 3px solid rgba(200, 200, 200, 0.8);"><span style="font-family: monospace; overflow-wrap: anywhere;">Корень проекта</span></td>
      <td colspan="5" rowspan="2" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; background-color: rgba(127, 127, 127, 0.18); border-top: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-top: 3px solid rgba(200, 200, 200, 0.8);"><span style="font-family: monospace; overflow-wrap: anywhere;">JSON Schema</span></td>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-top: 3px solid rgba(200, 200, 200, 0.8);"><span style="font-family: monospace; overflow-wrap: anywhere;">rules.ts</span></td>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-top: 3px solid rgba(200, 200, 200, 0.8);"><span style="font-family: monospace; overflow-wrap: anywhere;">Диагностики использований метаданных</span></td>
      <td colspan="9" rowspan="5" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; background-color: rgba(127, 127, 127, 0.18); border-top: 3px solid rgba(200, 200, 200, 0.8); border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
    </tr>
    <tr>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">Правила структуры проекта</span></td>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">Диагностики структуры YAML</span></td>
      <td colspan="2" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">Metadata-модель</span></td>
    </tr>
    <tr>
      <td colspan="9" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">Разобранные YAML-файлы worker</span></td>
    </tr>
    <tr>
      <td colspan="9" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">Общий индекс объявлений метаданных</span></td>
    </tr>
    <tr>
      <td colspan="9" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-bottom: 3px solid rgba(200, 200, 200, 0.8);"><span style="font-family: monospace; overflow-wrap: anywhere;">Часть индекса использований метаданных</span></td>
    </tr>
    <tr>
      <th rowspan="5" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; border-top: 3px solid rgba(200, 200, 200, 0.8); border-bottom: 3px solid rgba(200, 200, 200, 0.8); border-left: 3px solid rgba(200, 200, 200, 0.8);">Подсказка схем</th>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-top: 3px solid rgba(200, 200, 200, 0.8);"><span style="font-family: monospace; overflow-wrap: anywhere;">Корень проекта</span></td>
      <td colspan="17" rowspan="5" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; background-color: rgba(127, 127, 127, 0.18); border-top: 3px solid rgba(200, 200, 200, 0.8); border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
    </tr>
    <tr>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">Правила структуры проекта</span></td>
    </tr>
    <tr>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">Разобранные YAML-файлы worker</span></td>
    </tr>
    <tr>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">Общий индекс объявлений метаданных</span></td>
    </tr>
    <tr>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-bottom: 3px solid rgba(200, 200, 200, 0.8);"><span style="font-family: monospace; overflow-wrap: anywhere;">Часть индекса использований метаданных</span></td>
    </tr>
    <tr>
      <th rowspan="6" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; border-top: 3px solid rgba(200, 200, 200, 0.8); border-bottom: 3px solid rgba(200, 200, 200, 0.8); border-left: 3px solid rgba(200, 200, 200, 0.8);">Переименование</th>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-top: 3px solid rgba(200, 200, 200, 0.8);"><span style="font-family: monospace; overflow-wrap: anywhere;">Корень проекта</span></td>
      <td colspan="5" rowspan="2" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; background-color: rgba(127, 127, 127, 0.18); border-top: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-top: 3px solid rgba(200, 200, 200, 0.8);"><span style="font-family: monospace; overflow-wrap: anywhere;">JSON Schema</span></td>
      <td colspan="8" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-top: 3px solid rgba(200, 200, 200, 0.8);"><span style="font-family: monospace; overflow-wrap: anywhere;">rules.ts</span></td>
      <td rowspan="2" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; background-color: rgba(127, 127, 127, 0.18); border-top: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-top: 3px solid rgba(200, 200, 200, 0.8);"><span style="font-family: monospace; overflow-wrap: anywhere;">Исходный путь</span></td>
      <td rowspan="6" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; background-color: rgba(127, 127, 127, 0.18); border-top: 3px solid rgba(200, 200, 200, 0.8); border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
    </tr>
    <tr>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">Правила структуры проекта</span></td>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">Диагностики структуры YAML</span></td>
      <td colspan="8" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">Metadata-модель</span></td>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">Переименованный путь</span></td>
    </tr>
    <tr>
      <td colspan="9" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">Разобранные YAML-файлы worker</span></td>
      <td colspan="5" rowspan="4" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; background-color: rgba(127, 127, 127, 0.18); border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
      <td colspan="3" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">Целевой путь</span></td>
    </tr>
    <tr>
      <td colspan="9" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">Общий индекс объявлений метаданных</span></td>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">YAML-файл</span></td>
      <td colspan="2" rowspan="3" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; background: linear-gradient(to right, rgba(127, 127, 127, 0.18) 0%, rgba(127, 127, 127, 0.18) 50%, transparent 50%, transparent 100%); border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
    </tr>
    <tr>
      <td colspan="9" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">Часть индекса использований метаданных</span></td>
      <td rowspan="2" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
    </tr>
    <tr>
      <td colspan="8" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; background: linear-gradient(to right, transparent 0%, transparent 12.5%, rgba(127, 127, 127, 0.18) 12.5%, rgba(127, 127, 127, 0.18) 25%, rgba(127, 127, 127, 0.18) 25%, rgba(127, 127, 127, 0.18) 37.5%, rgba(127, 127, 127, 0.18) 37.5%, rgba(127, 127, 127, 0.18) 50%, rgba(127, 127, 127, 0.18) 50%, rgba(127, 127, 127, 0.18) 62.5%, rgba(127, 127, 127, 0.18) 62.5%, rgba(127, 127, 127, 0.18) 75%, transparent 75%, transparent 87.5%, transparent 87.5%, transparent 100%); border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-bottom: 3px solid rgba(200, 200, 200, 0.8);"><span style="font-family: monospace; overflow-wrap: anywhere;">Диагностики использований метаданных</span></td>
    </tr>
    <tr>
      <th rowspan="6" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; border-top: 3px solid rgba(200, 200, 200, 0.8); border-bottom: 3px solid rgba(200, 200, 200, 0.8); border-left: 3px solid rgba(200, 200, 200, 0.8);">Удаление</th>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-top: 3px solid rgba(200, 200, 200, 0.8);"><span style="font-family: monospace; overflow-wrap: anywhere;">Корень проекта</span></td>
      <td colspan="5" rowspan="2" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; background-color: rgba(127, 127, 127, 0.18); border-top: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-top: 3px solid rgba(200, 200, 200, 0.8);"><span style="font-family: monospace; overflow-wrap: anywhere;">JSON Schema</span></td>
      <td colspan="8" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-top: 3px solid rgba(200, 200, 200, 0.8);"><span style="font-family: monospace; overflow-wrap: anywhere;">rules.ts</span></td>
      <td colspan="2" rowspan="6" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; background-color: rgba(127, 127, 127, 0.18); border-top: 3px solid rgba(200, 200, 200, 0.8); border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-top: 3px solid rgba(200, 200, 200, 0.8);"><span style="font-family: monospace; overflow-wrap: anywhere;">Удаляемый путь</span></td>
    </tr>
    <tr>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">Правила структуры проекта</span></td>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">Диагностики структуры YAML</span></td>
      <td colspan="8" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">Metadata-модель</span></td>
      <td rowspan="5" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
    </tr>
    <tr>
      <td colspan="9" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">Разобранные YAML-файлы worker</span></td>
      <td colspan="5" rowspan="4" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; background-color: rgba(127, 127, 127, 0.18); border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">Целевой путь</span></td>
    </tr>
    <tr>
      <td colspan="9" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">Общий индекс объявлений метаданных</span></td>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">YAML-файл</span></td>
    </tr>
    <tr>
      <td colspan="9" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top;"><span style="font-family: monospace; overflow-wrap: anywhere;">Часть индекса использований метаданных</span></td>
      <td rowspan="2" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
    </tr>
    <tr>
      <td colspan="8" style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; background: linear-gradient(to right, transparent 0%, transparent 12.5%, rgba(127, 127, 127, 0.18) 12.5%, rgba(127, 127, 127, 0.18) 25%, rgba(127, 127, 127, 0.18) 25%, rgba(127, 127, 127, 0.18) 37.5%, rgba(127, 127, 127, 0.18) 37.5%, rgba(127, 127, 127, 0.18) 50%, rgba(127, 127, 127, 0.18) 50%, rgba(127, 127, 127, 0.18) 62.5%, rgba(127, 127, 127, 0.18) 62.5%, rgba(127, 127, 127, 0.18) 75%, transparent 75%, transparent 87.5%, transparent 87.5%, transparent 100%); border-bottom: 3px solid rgba(200, 200, 200, 0.8);">&nbsp;</td>
      <td style="border: 1px solid rgba(127, 127, 127, 0.5); box-sizing: border-box; vertical-align: top; border-bottom: 3px solid rgba(200, 200, 200, 0.8);"><span style="font-family: monospace; overflow-wrap: anywhere;">Диагностики использований метаданных</span></td>
    </tr>
  </tbody>
</table>

<p>Каждый прямоугольник показывает жизнь результата от первого до последнего использующего его этапа. Результат, живущий один этап, занимает одну колонку. <span style="background-color: rgba(59, 130, 246, 0.14);">Синий фон заголовка</span> означает, что часть этапа выполняется в worker. <span style="background-color: rgba(127, 127, 127, 0.18);">Серый фон пустой области</span> означает, что этап не участвует в операции. После правой границы владелец операции должен удалить результат из памяти. Общие регистрации, схемы и другие данные, которыми операция не владеет, перестают учитываться операцией, но не удаляются ею.</p>

## Подготовка YAML-проекта

Этап подготавливает YAML-проект для синхронизации, валидации, подсказки схем, переименования и удаления. Проверка по схеме, построение metadata-модели и проверка использований выполняются позднее.

| Фаза | Координатор | Worker | Результат |
|---|---|---|---|
| Распределение файлов | Находит и классифицирует YAML и внешние файлы проекта, затем делит YAML-файлы между worker. | Получает назначенный список YAML-файлов. | `Список файлов проекта`<br>`Часть списка YAML-файлов worker`<br>`Описание внешнего файла проекта` |
| Локальная обработка | Ожидает результаты всех worker. | Читает и разбирает назначенные YAML, сохраняет их и извлекает локальные объявления и использования. | `Разобранные YAML-файлы worker`<br>`Локальные объявления метаданных`<br>`Локальные использования метаданных` |
| Обобщение индексов | Объединяет локальные объявления в общий индекс объявлений, а локальные использования — во временный общий индекс использований. | Сохраняет разобранные YAML-файлы. | `Общий индекс объявлений метаданных`<br>`Общий индекс использований метаданных` |
| Распределение индекса использований | Делит общий индекс использований между worker и передаёт каждому worker общий индекс объявлений и назначенную часть индекса использований. | Сохраняет полученные индексы рядом со своими разобранными YAML-файлами. | `Часть индекса использований метаданных` |

После обобщения worker удаляет `Локальные объявления метаданных` и `Локальные использования метаданных`. После распределения координатор удаляет `Общий индекс использований метаданных`. Каждый worker продолжает хранить `Разобранные YAML-файлы worker`, `Общий индекс объявлений метаданных` и свою `Часть индекса использований метаданных`.

## Именование данных

- Материализованная коллекция явно называется списком; независимо обрабатываемые элементы называются в единственном числе.
- Создающий и потребляющий шаги используют одно и то же точное название.
- Каждое название записывается отдельно и выделяется как код.

## Артефакты

| Артефакт | Описание |
|---|---|
| `Корень проекта` | Каталог, относительно которого выполняется операция. |
| `Правила структуры проекта` | Правила обнаружения, классификации и размещения YAML и внешних файлов проекта. |
| `Список файлов проекта` | Найденные YAML и внешние файлы проекта с их ролями и правилами. |
| `Часть списка YAML-файлов worker` | YAML-файлы, назначенные одному worker для локальной обработки. |
| `Разобранные YAML-файлы worker` | Назначенные worker YAML-файлы вместе с текстом, разобранными данными, позициями и синтаксическими диагностиками. |
| `Локальные объявления метаданных` | Объявления, извлечённые worker из назначенных ему YAML-файлов. |
| `Локальные использования метаданных` | Ссылки и проверки DataPath, извлечённые worker из назначенных ему YAML-файлов. |
| `Общий индекс объявлений метаданных` | Объединённый индекс объявлений всех YAML-файлов проекта, переданный каждому worker. |
| `Общий индекс использований метаданных` | Временный объединённый индекс использований всех YAML-файлов до распределения между worker. |
| `Часть индекса использований метаданных` | Часть общего индекса использований, назначенная одному worker. |
| `Описание внешнего файла проекта` | Путь внешнего файла, его роль и правила соответствующего свойства метаданных. |
| `Корень XML-выгрузки` | Каталог исходной XML-выгрузки конфигурации. |
| `Список путей XML-файлов выгрузки` | Пути XML-файлов, найденных в исходной XML-выгрузке. |
| `Описание XML-файла выгрузки` | Путь XML-файла, его роль и правила соответствующего объекта метаданных. |
| `XML-текст` | Исходное или подготовленное текстовое содержимое XML-файла. |
| `XML-данные` | Разобранные структурированные данные XML-файла. |
| `Содержимое внешнего файла` | Текстовое или бинарное содержимое внешнего файла метаданных. |
| `JSON Schema` | Схема допустимой структуры разобранного YAML-файла. |
| `Диагностики структуры YAML` | Нарушения структуры разобранного YAML-файла относительно JSON Schema. |
| `rules.ts` | Декларативные правила преобразования metadata-модели. |
| `Metadata-модель` | Внутреннее представление объекта метаданных. |
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
| Подготовка YAML-проекта | Находит, распределяет и разбирает YAML-файлы, затем подготавливает общий индекс объявлений и части индекса использований. | `Корень проекта`<br>`Правила структуры проекта` | `Разобранные YAML-файлы worker`<br>`Общий индекс объявлений метаданных`<br>`Часть индекса использований метаданных`<br>`Описание внешнего файла проекта` | частично |
| Поиск XML-файлов выгрузки | Находит XML-файлы объектов метаданных в исходной XML-выгрузке. | `Корень XML-выгрузки`<br>`rules.ts` | `Список путей XML-файлов выгрузки` |  |
| Классификация XML-файлов выгрузки | Определяет роль XML-файла и правила соответствующего объекта метаданных. | `Список путей XML-файлов выгрузки`<br>`rules.ts` | `Описание XML-файла выгрузки` |  |
| Чтение XML | Читает текст XML-файла из исходной выгрузки. | `Описание XML-файла выгрузки` | `XML-текст` |  |
| Парсинг XML | Преобразует XML-текст в структурированные XML-данные. | `XML-текст` | `XML-данные` | ✓ |
| Чтение внешнего файла проекта | Читает содержимое модуля, бинарного или другого внешнего файла проекта. | `Описание внешнего файла проекта` | `Содержимое внешнего файла` |  |
| Проверка по схеме | Проверяет сохранённые в worker разобранные YAML-файлы по JSON Schema. | `Разобранные YAML-файлы worker`<br>`JSON Schema` | `Диагностики структуры YAML` | ✓ |
| Построение модели | Преобразует разобранные YAML или XML-данные в metadata-модель по rules.ts. | `Разобранные YAML-файлы worker`<br>`XML-данные`<br>`Содержимое внешнего файла`<br>`rules.ts` | `Metadata-модель` | ✓ |
| Проверка использований | Проверяет назначенные использования и DataPath по общему индексу объявлений. | `Разобранные YAML-файлы worker`<br>`Общий индекс объявлений метаданных`<br>`Часть индекса использований метаданных` | `Диагностики использований метаданных` | ✓ |
| Построение XML | Преобразует metadata-модель в структурированные XML-данные. | `Metadata-модель`<br>`rules.ts`<br>`Исходная metadata-модель из XML` | `XML-данные` | ✓ |
| Сериализация XML | Преобразует структурированные XML-данные в текст XML. | `XML-данные` | `XML-текст` | ✓ |
| Запись XML | Записывает XML-текст в целевой файл. | `XML-текст`<br>`Целевой путь` | `XML-файл` |  |
| Учёт XML-файлов | Добавляет записанный XML-файл в манифест синхронизации. | `XML-файл`<br>`XML-манифест` | `XML-манифест` |  |
| Удаление устаревших XML-файлов | Удаляет из целевого XML-каталога файлы, отсутствующие в манифесте текущей синхронизации. | `XML-каталог`<br>`XML-манифест` | `XML-каталог` |  |
| Запись YAML | Сериализует и записывает metadata-модель в YAML-файл. | `Metadata-модель`<br>`rules.ts`<br>`Целевой путь` | `YAML-файл` |  |
| Запись прочих файлов | Записывает модули, бинарные данные и другие внешние файлы. | `Содержимое внешнего файла`<br>`Целевой путь` | `Прочий файл` |  |
| Переименование путей | Переименовывает файл или каталог согласно плану операции. | `Исходный путь`<br>`Целевой путь` | `Переименованный путь` |  |
| Удаление путей | Удаляет файл или каталог согласно плану операции. | `Удаляемый путь` | — |  |
