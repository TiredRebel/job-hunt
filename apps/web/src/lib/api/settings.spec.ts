import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from './client';
import { getNotificationSettings, updateNotificationSettings } from './settings';

vi.mock('@/lib/env', () => ({
  getApiBaseUrl: () => 'http://localhost:4000/v1',
}));

const SETTINGS_BODY = {
  telegram: {
    enabled: false,
    chatId: null,
    botTokenEnv: 'TELEGRAM_BOT_TOKEN',
    botTokenConfigured: false,
  },
  email: {
    enabled: false,
    smtpHost: null,
    smtpPort: null,
    smtpUser: null,
    smtpPasswordEnv: 'SMTP_PASSWORD',
    smtpPasswordConfigured: false,
    fromEmail: null,
    toEmail: null,
  },
  matchThreshold: 70,
  digestHour: 9,
};

describe('getNotificationSettings', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('GETs the settings resource and returns it', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(SETTINGS_BODY), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await getNotificationSettings();

    expect(result).toEqual(SETTINGS_BODY);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/v1/settings/notifications',
      expect.objectContaining({ method: 'GET' }),
    );
  });
});

describe('updateNotificationSettings', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('PATCHes only the provided fields', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(SETTINGS_BODY), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await updateNotificationSettings({ telegramChatId: '12345' });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/v1/settings/notifications',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ telegramChatId: '12345' }),
      }),
    );
  });

  it('propagates ApiError on a validation failure (400)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: 'smtpPort must be between 1 and 65535' }), {
        status: 400,
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(updateNotificationSettings({ smtpPort: 0 })).rejects.toBeInstanceOf(ApiError);
  });
});
