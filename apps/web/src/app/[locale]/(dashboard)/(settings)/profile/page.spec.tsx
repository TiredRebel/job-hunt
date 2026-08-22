/**
 * @module app/profile/page.spec
 *
 * Regression coverage for the Profile route composition.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import ProfilePage from '@/app/[locale]/(dashboard)/(settings)/profile/page';

vi.mock('@/components/profile/profile-form', () => ({
  ProfileForm: () => <form aria-label="Profile editor" />,
}));

vi.mock('@/components/profile/notification-settings-form', () => ({
  NotificationSettingsForm: () => <form aria-label="Notifications" />,
}));

describe('ProfilePage', () => {
  it('renders only the profile editor', () => {
    render(<ProfilePage />);

    expect(screen.getByRole('form', { name: 'Profile editor' })).toBeDefined();
    expect(screen.queryByRole('form', { name: 'Notifications' })).toBeNull();
  });
});
