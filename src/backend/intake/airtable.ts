type AirtableRegisterInput = {
  name: string;
  email: string;
  phone: string | null;
  region: string;
  wechat: string | null;
  gardenFeatures: string[];
  notes: string | null;
  timestamp: string;
  lang: string;
};

const DEFAULT_TABLE_NAME = "Registrations";
const FALLBACK_TABLE_NAMES = ["Registrations", "Leads"];

type AirtableField = {
  id: string;
  name: string;
};

type AirtableTable = {
  id: string;
  name: string;
  fields?: AirtableField[];
};

type LogicalFieldKey =
  | "name"
  | "email"
  | "phone"
  | "region"
  | "wechat"
  | "gardenFeatures"
  | "notes"
  | "timestamp"
  | "lang"
  | "source";

const FIELD_ALIASES: Record<LogicalFieldKey, string[]> = {
  name: ["name", "full name", "fullname", "customer name", "姓名", "联系人"],
  email: ["email", "e-mail", "contact email", "邮箱", "电子邮箱"],
  phone: ["phone", "phone number", "mobile", "cell", "手机号", "电话"],
  region: ["region", "area", "suburb", "location", "区域", "所在区域"],
  wechat: ["wechat", "wechat id", "weixin", "whatsapp", "whatsapp number", "微信", "微信号"],
  gardenFeatures: ["garden_features", "garden features", "features", "garden feature", "花园特点", "庭院特点"],
  notes: ["notes", "note", "comments", "comment", "remarks", "补充说明", "关注点"],
  timestamp: ["timestamp", "submitted at", "submission time", "created at", "提交时间", "提交日期"],
  lang: ["lang", "language", "locale", "语言"],
  source: ["source", "lead source", "intake source", "来源"],
};

function normalizeFieldName(value: string): string {
  return value.toLowerCase().replace(/[\s_-]+/g, " ").trim();
}

function firstExistingFieldName(table: AirtableTable, aliases: string[]): string | null {
  const normalizedAliases = new Set(aliases.map(normalizeFieldName));
  const fields = table.fields ?? [];
  for (const field of fields) {
    if (normalizedAliases.has(normalizeFieldName(field.name))) {
      return field.name;
    }
  }
  return null;
}

function getAirtableConfig() {
  const token = process.env.AIRTABLE_ACCESS_TOKEN ?? process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const preferredTable = process.env.AIRTABLE_TABLE_NAME?.trim() || DEFAULT_TABLE_NAME;

  if (!token || !baseId) {
    throw new Error("Missing AIRTABLE_ACCESS_TOKEN/AIRTABLE_API_KEY or AIRTABLE_BASE_ID.");
  }

  return { token, baseId, preferredTable };
}

async function airtableRequest<T>(
  path: string,
  init: RequestInit,
  token: string
): Promise<T> {
  const response = await fetch(`https://api.airtable.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Airtable request failed (${response.status}): ${text || response.statusText}`);
  }

  return (await response.json()) as T;
}

async function listTables(baseId: string, token: string): Promise<AirtableTable[]> {
  const data = await airtableRequest<{ tables?: AirtableTable[] }>(
    `/v0/meta/bases/${baseId}/tables`,
    { method: "GET" },
    token
  );

  return data.tables ?? [];
}

async function createTable(baseId: string, token: string, tableName: string): Promise<AirtableTable> {
  const data = await airtableRequest<{ id: string; name: string; fields?: AirtableField[] }>(
    `/v0/meta/bases/${baseId}/tables`,
    {
      method: "POST",
      body: JSON.stringify({
        name: tableName,
        fields: [
          { name: "name", type: "singleLineText" },
          { name: "email", type: "email" },
          { name: "phone", type: "phoneNumber" },
          { name: "region", type: "singleLineText" },
          { name: "wechat", type: "singleLineText" },
          { name: "garden_features", type: "multilineText" },
          { name: "notes", type: "multilineText" },
          { name: "timestamp", type: "singleLineText" },
          { name: "lang", type: "singleLineText" },
        ],
      }),
    },
    token
  );

  return { id: data.id, name: data.name, fields: data.fields };
}

async function ensureTargetTable(baseId: string, token: string, preferredTable: string): Promise<AirtableTable> {
  const tables = await listTables(baseId, token);
  const wantedNames = [preferredTable, ...FALLBACK_TABLE_NAMES].map((name) => name.toLowerCase());
  const existing = tables.find((table) => wantedNames.includes(table.name.toLowerCase()));
  if (existing) return existing;

  const created = await createTable(baseId, token, preferredTable || DEFAULT_TABLE_NAME);
  if (created.fields?.length) return created;

  // Some Airtable responses may omit fields immediately after table creation; reload once.
  const refreshedTables = await listTables(baseId, token);
  return (
    refreshedTables.find((table) => table.name.toLowerCase() === created.name.toLowerCase()) ??
    created
  );
}

function mapInputToAirtableFields(input: AirtableRegisterInput, table: AirtableTable): Record<string, string> {
  const fields: Record<string, string> = {};

  const setIfFieldExists = (key: LogicalFieldKey, value: string | null | undefined) => {
    const fieldName = firstExistingFieldName(table, FIELD_ALIASES[key]);
    if (!fieldName) return;
    fields[fieldName] = value ?? "";
  };

  const nameField = firstExistingFieldName(table, FIELD_ALIASES.name);
  const emailField = firstExistingFieldName(table, FIELD_ALIASES.email);
  if (!nameField || !emailField) {
    const available = (table.fields ?? []).map((field) => field.name).join(", ");
    throw new Error(
      `Airtable table "${table.name}" is missing required fields for name/email. Available fields: ${available || "(none)"}`
    );
  }

  fields[nameField] = input.name;
  fields[emailField] = input.email;

  setIfFieldExists("phone", input.phone);
  setIfFieldExists("region", input.region);
  setIfFieldExists("wechat", input.wechat);
  setIfFieldExists("gardenFeatures", input.gardenFeatures.join(", "));
  setIfFieldExists("notes", input.notes);
  setIfFieldExists("timestamp", input.timestamp);
  setIfFieldExists("lang", input.lang);
  setIfFieldExists("source", "register-form-v2");

  return fields;
}

export async function createAirtableRegistration(input: AirtableRegisterInput): Promise<{ tableName: string; recordId: string }> {
  const { token, baseId, preferredTable } = getAirtableConfig();
  const table = await ensureTargetTable(baseId, token, preferredTable);
  const fields = mapInputToAirtableFields(input, table);

  const data = await airtableRequest<{ records?: Array<{ id: string }> }>(
    `/v0/${baseId}/${encodeURIComponent(table.name)}`,
    {
      method: "POST",
      body: JSON.stringify({
        typecast: true,
        records: [
          {
            fields,
          },
        ],
      }),
    },
    token
  );

  const recordId = data.records?.[0]?.id;
  if (!recordId) {
    throw new Error("Airtable did not return a record id.");
  }

  return { tableName: table.name, recordId };
}