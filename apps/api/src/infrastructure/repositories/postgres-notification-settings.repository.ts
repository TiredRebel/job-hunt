/**
 * @module postgres-notification-settings.repository
 *
 * Postgres implementation of {@link NotificationSettingsRepository}.
 * Composes the `core.notification_settings` singleton row with the
 * `match_threshold`/`digest_hour` scalars already owned by
 * `core.app_settings` (design.md D2 in
 * openspec/changes/notification-settings-and-board-reorder) into one
 * coherent record. Never selects or accepts a secret value — only the
 * environment variable name that holds one.
 */
import { Injectable } from '@nestjs/common';
import type { PoolClient } from 'pg';

import type {
  NotificationSettings,
  UpdateNotificationSettingsInput,
} from '../../domain/notification-settings.model';
import type { NotificationSettingsRepository } from '../../application/ports/notification-settings-repository.port';
import { PgDatabase } from '../database/database.module';

const SCALARS_SQL =
  "SELECT key, (value::text)::int AS int_value FROM core.app_settings WHERE key IN ('match_threshold', 'digest_hour')";
const SETTINGS_ROW_SQL = 'SELECT * FROM core.notification_settings WHERE id = 1';

/**
 * Maps a `core.notification_settings` row plus the two app_settings scalars to the domain type.
 *
 * @param row - Raw `core.notification_settings` row.
 * @param matchThreshold - The `match_threshold` app_settings scalar.
 * @param digestHour - The `digest_hour` app_settings scalar.
 * @returns The composed domain settings.
 */
function mapRow(
  row: Record<string, unknown>,
  matchThreshold: number,
  digestHour: number,
): NotificationSettings {
  return {
    telegramEnabled: row['telegram_enabled'] as boolean,
    telegramChatId: (row['telegram_chat_id'] as string | null) ?? null,
    telegramBotTokenEnv: row['telegram_bot_token_env'] as string,
    emailEnabled: row['email_enabled'] as boolean,
    smtpHost: (row['smtp_host'] as string | null) ?? null,
    smtpPort: (row['smtp_port'] as number | null) ?? null,
    smtpUser: (row['smtp_user'] as string | null) ?? null,
    smtpPasswordEnv: row['smtp_password_env'] as string,
    fromEmail: (row['from_email'] as string | null) ?? null,
    toEmail: (row['to_email'] as string | null) ?? null,
    matchThreshold,
    digestHour,
  };
}

/**
 * Extracts `{ matchThreshold, digestHour }` from a `SCALARS_SQL` result.
 *
 * @param rows - Rows returned by `SCALARS_SQL`.
 * @returns The two scalars, defaulting to 0 if somehow absent.
 */
function mapScalars(rows: readonly Record<string, unknown>[]): {
  matchThreshold: number;
  digestHour: number;
} {
  const byKey = new Map(rows.map((row) => [row['key'] as string, row['int_value'] as number]));
  return {
    matchThreshold: byKey.get('match_threshold') ?? 0,
    digestHour: byKey.get('digest_hour') ?? 0,
  };
}

/**
 * Postgres-backed notification settings repository.
 */
@Injectable()
export class PostgresNotificationSettingsRepository implements NotificationSettingsRepository {
  /**
   * Postgres-backed notification settings repository.
   *
   * @param db - Pg database wrapper.
   */
  public constructor(private readonly db: PgDatabase) {}

  /** @inheritdoc */
  public async get(): Promise<NotificationSettings> {
    const [settingsResult, scalarsResult] = await Promise.all([
      this.db.query<Record<string, unknown>>(SETTINGS_ROW_SQL),
      this.db.query<Record<string, unknown>>(SCALARS_SQL),
    ]);
    const row = settingsResult.rows[0];
    if (row === undefined) {
      throw new Error('core.notification_settings has no row with id = 1');
    }
    const scalars = mapScalars(scalarsResult.rows);
    return mapRow(row, scalars.matchThreshold, scalars.digestHour);
  }

  /** @inheritdoc */
  public async update(patch: UpdateNotificationSettingsInput): Promise<NotificationSettings> {
    return this.db.transaction(async (client) => {
      await applyChannelPatch(client, patch);
      await applyScalarPatch(client, patch);

      const settingsResult = await client.query<Record<string, unknown>>(SETTINGS_ROW_SQL);
      const row = settingsResult.rows[0];
      if (row === undefined) {
        throw new Error('core.notification_settings has no row with id = 1');
      }
      const scalarsResult = await client.query<Record<string, unknown>>(SCALARS_SQL);
      const scalars = mapScalars(scalarsResult.rows);
      return mapRow(row, scalars.matchThreshold, scalars.digestHour);
    });
  }
}

/**
 * Apply the `core.notification_settings` portion of a patch, if any fields target it.
 *
 * @param client - Transaction client.
 * @param patch - The full patch; only channel-config fields are used here.
 */
async function applyChannelPatch(
  client: PoolClient,
  patch: UpdateNotificationSettingsInput,
): Promise<void> {
  const setClauses: string[] = [];
  const values: unknown[] = [];
  let param = 1;

  const columns: readonly (readonly [keyof UpdateNotificationSettingsInput, string])[] = [
    ['telegramEnabled', 'telegram_enabled'],
    ['telegramChatId', 'telegram_chat_id'],
    ['telegramBotTokenEnv', 'telegram_bot_token_env'],
    ['emailEnabled', 'email_enabled'],
    ['smtpHost', 'smtp_host'],
    ['smtpPort', 'smtp_port'],
    ['smtpUser', 'smtp_user'],
    ['smtpPasswordEnv', 'smtp_password_env'],
    ['fromEmail', 'from_email'],
    ['toEmail', 'to_email'],
  ];

  for (const [key, column] of columns) {
    const value = patch[key];
    if (value !== undefined) {
      setClauses.push(`${column} = $${String(param)}`);
      values.push(value);
      param += 1;
    }
  }

  if (setClauses.length === 0) {
    return;
  }

  setClauses.push('updated_at = now()');
  await client.query(
    `UPDATE core.notification_settings SET ${setClauses.join(', ')} WHERE id = 1`,
    values,
  );
}

/**
 * Apply the `core.app_settings` scalar portion of a patch, if any fields target it.
 *
 * @param client - Transaction client.
 * @param patch - The full patch; only `matchThreshold`/`digestHour` are used here.
 */
async function applyScalarPatch(
  client: PoolClient,
  patch: UpdateNotificationSettingsInput,
): Promise<void> {
  if (patch.matchThreshold !== undefined) {
    await client.query(
      "UPDATE core.app_settings SET value = to_jsonb($1::int) WHERE key = 'match_threshold'",
      [patch.matchThreshold],
    );
  }
  if (patch.digestHour !== undefined) {
    await client.query(
      "UPDATE core.app_settings SET value = to_jsonb($1::int) WHERE key = 'digest_hour'",
      [patch.digestHour],
    );
  }
}
