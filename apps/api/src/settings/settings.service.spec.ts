/**
 * @module settings.service.spec
 *
 * Unit tests for {@link SettingsService} using an in-memory repository
 * fake. Proves the partial-update contract, the env-presence computation
 * (design.md D7), and — most importantly — that no response ever carries a
 * secret value.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type {
  NotificationSettings,
  UpdateNotificationSettingsInput,
} from '../domain/notification-settings.model';
import type { NotificationSettingsRepository } from '../application/ports/notification-settings-repository.port';
import { SettingsService } from './settings.service';

const TOKEN_ENV = 'TEST_TELEGRAM_BOT_TOKEN';
const PASSWORD_ENV = 'TEST_SMTP_PASSWORD';
const SECRET_VALUE = 'super-secret-value-must-never-appear';

/**
 * Build a settings fixture with sensible defaults.
 *
 * @param overrides - Fields to override.
 * @returns Settings fixture.
 */
function makeSettings(overrides: Partial<NotificationSettings> = {}): NotificationSettings {
  return {
    telegramEnabled: false,
    telegramChatId: null,
    telegramBotTokenEnv: TOKEN_ENV,
    emailEnabled: false,
    smtpHost: null,
    smtpPort: null,
    smtpUser: null,
    smtpPasswordEnv: PASSWORD_ENV,
    fromEmail: null,
    toEmail: null,
    matchThreshold: 70,
    digestHour: 9,
    ...overrides,
  };
}

/**
 * In-memory {@link NotificationSettingsRepository} fake.
 */
class FakeNotificationSettingsRepository implements NotificationSettingsRepository {
  public settings: NotificationSettings = makeSettings();
  public lastPatch: UpdateNotificationSettingsInput | null = null;

  public get(): Promise<NotificationSettings> {
    return Promise.resolve(this.settings);
  }

  public update(patch: UpdateNotificationSettingsInput): Promise<NotificationSettings> {
    this.lastPatch = patch;
    this.settings = { ...this.settings, ...patch };
    return Promise.resolve(this.settings);
  }
}

describe('SettingsService', () => {
  let repository: FakeNotificationSettingsRepository;
  let service: SettingsService;

  beforeEach(() => {
    repository = new FakeNotificationSettingsRepository();
    service = new SettingsService(repository);
    Reflect.deleteProperty(process.env, TOKEN_ENV);
    Reflect.deleteProperty(process.env, PASSWORD_ENV);
  });

  afterEach(() => {
    Reflect.deleteProperty(process.env, TOKEN_ENV);
    Reflect.deleteProperty(process.env, PASSWORD_ENV);
  });

  it('reports both channels with their non-secret fields', async () => {
    repository.settings = makeSettings({
      telegramEnabled: true,
      telegramChatId: '12345',
      emailEnabled: true,
      smtpHost: 'smtp.example.com',
      smtpPort: 587,
    });

    const result = await service.getNotificationSettings();

    expect(result.telegram.enabled).toBe(true);
    expect(result.telegram.chatId).toBe('12345');
    expect(result.email.enabled).toBe(true);
    expect(result.email.smtpHost).toBe('smtp.example.com');
    expect(result.email.smtpPort).toBe(587);
  });

  it('passes only the provided fields through to the repository on update', async () => {
    await service.updateNotificationSettings({ telegramChatId: '999' });

    expect(repository.lastPatch).toEqual({ telegramChatId: '999' });
  });

  it('reports the secret as configured when its env var is set', async () => {
    process.env[TOKEN_ENV] = SECRET_VALUE;

    const result = await service.getNotificationSettings();

    expect(result.telegram.botTokenConfigured).toBe(true);
  });

  it('reports the secret as not configured when its env var is unset', async () => {
    const result = await service.getNotificationSettings();

    expect(result.telegram.botTokenConfigured).toBe(false);
  });

  it('reports the secret as not configured when its env var is empty', async () => {
    process.env[PASSWORD_ENV] = '';

    const result = await service.getNotificationSettings();

    expect(result.email.smtpPasswordConfigured).toBe(false);
  });

  it('never includes a secret value anywhere in the notification settings response', async () => {
    process.env[TOKEN_ENV] = SECRET_VALUE;
    process.env[PASSWORD_ENV] = SECRET_VALUE;

    const result = await service.getNotificationSettings();

    expect(JSON.stringify(result)).not.toContain(SECRET_VALUE);
  });

  it('never includes a secret value anywhere in the automation settings response', async () => {
    process.env[TOKEN_ENV] = SECRET_VALUE;
    process.env[PASSWORD_ENV] = SECRET_VALUE;

    const result = await service.getAutomationSettings();

    expect(JSON.stringify(result)).not.toContain(SECRET_VALUE);
  });

  it('automation settings expose enabled flags and destinations only', async () => {
    repository.settings = makeSettings({
      telegramEnabled: true,
      telegramChatId: '12345',
      emailEnabled: false,
      toEmail: 'me@example.com',
    });

    const result = await service.getAutomationSettings();

    expect(result).toEqual({
      telegramEnabled: true,
      telegramChatId: '12345',
      emailEnabled: false,
      toEmail: 'me@example.com',
      matchThreshold: 70,
      digestHour: 9,
    });
  });
});
