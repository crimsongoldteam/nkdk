import { z } from "zod"

const safeString = (description: string) => z.string().refine(
  (value) => !/[\0\r\n]/u.test(value),
  { message: `${description} содержит недопустимые управляющие символы` }
).describe(description)

const requiredString = (description: string) => safeString(description).trim().min(1, `${description} не задан`)

const databaseSchema = z.strictObject({
  dbms: z.enum(["MSSQLServer", "PostgreSQL", "IBMDB2", "OracleDatabase"])
    .describe("Система управления базами данных информационной базы"),
  server: requiredString("Адрес сервера СУБД"),
  name: requiredString("Имя базы данных в СУБД"),
  user: safeString("Имя пользователя СУБД; для MSSQLServer отсутствие поля включает авторизацию ОС").optional(),
  password: safeString("Пароль пользователя СУБД; рекомендуется заполнить вручную").optional(),
}).describe("Прямое подключение к СУБД для автономного сервера")

const importSchema = z.strictObject({
  mode: z.enum(["designer-agent", "standalone-server"])
    .describe("Механизм выгрузки: агент Конфигуратора или автономный сервер"),
  unresolvedReferences: z.enum(["include", "omit"])
    .default("include")
    .describe("Выгружать неразрешённые ссылки или пропускать их"),
}).describe("Настройки импорта конфигурации")

export const projectSettingsStructuralSchema = z.strictObject({
  infobase: z.strictObject({
    connectionString: requiredString("Строка подключения 1С к файловой или клиент-серверной информационной базе"),
    user: safeString("Пользователь информационной базы; поле не нужно при авторизации ОС").optional(),
    password: safeString("Пароль пользователя информационной базы; рекомендуется заполнить вручную").optional(),
    sessionIdleTimeout: z.number().int().positive().default(900)
      .describe("Время простоя сохраняемого подключения в секундах"),
    database: databaseSchema.optional(),
    operations: z.strictObject({ import: importSchema }),
  }),
})

export const PROJECT_SETTINGS_SCHEMA_URI = "nkdk://project-settings/schema/v1"

export const projectSettingsExamples = [
  {
    infobase: {
      connectionString: 'File="/bases/demo";',
      operations: { import: { mode: "designer-agent" } },
    },
  },
  {
    infobase: {
      connectionString: 'File="/bases/demo";',
      operations: { import: { mode: "standalone-server" } },
    },
  },
  {
    infobase: {
      connectionString: 'Srvr="cluster";Ref="base";',
      database: { dbms: "PostgreSQL", server: "db", name: "base", user: "dbuser" },
      operations: { import: { mode: "standalone-server" } },
    },
  },
  {
    infobase: {
      connectionString: 'Srvr="cluster";Ref="base";',
      database: { dbms: "MSSQLServer", server: "db", name: "base" },
      operations: { import: { mode: "standalone-server" } },
    },
  },
] as const

export const projectSettingsJsonSchema = {
  ...z.toJSONSchema(projectSettingsStructuralSchema),
  $id: PROJECT_SETTINGS_SCHEMA_URI,
  examples: projectSettingsExamples,
}
