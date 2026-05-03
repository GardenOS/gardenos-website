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

type AirtableTable = {
  id: string;
  name: string;
};

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
  const data = await airtableRequest<{ id: string; name: string }>(
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

  return { id: data.id, name: data.name };
}

async function ensureTargetTable(baseId: string, token: string, preferredTable: string): Promise<string> {
  const tables = await listTables(baseId, token);
  const wantedNames = [preferredTable, ...FALLBACK_TABLE_NAMES].map((name) => name.toLowerCase());
  const existing = tables.find((table) => wantedNames.includes(table.name.toLowerCase()));
  if (existing) return existing.name;

  const created = await createTable(baseId, token, preferredTable || DEFAULT_TABLE_NAME);
  return created.name;
}

export async function createAirtableRegistration(input: AirtableRegisterInput): Promise<{ tableName: string; recordId: string }> {
  const { token, baseId, preferredTable } = getAirtableConfig();
  const tableName = await ensureTargetTable(baseId, token, preferredTable);

  const data = await airtableRequest<{ records?: Array<{ id: string }> }>(
    `/v0/${baseId}/${encodeURIComponent(tableName)}`,
    {
      method: "POST",
      body: JSON.stringify({
        typecast: true,
        records: [
          {
            fields: {
              name: input.name,
              email: input.email,
              phone: input.phone ?? "",
              region: input.region,
              wechat: input.wechat ?? "",
              garden_features: input.gardenFeatures.join(", "),
              notes: input.notes ?? "",
              timestamp: input.timestamp,
              lang: input.lang,
            },
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

  return { tableName, recordId };
}