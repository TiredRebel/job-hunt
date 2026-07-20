import { NotificationSettingsForm } from '@/components/profile/notification-settings-form';
import { ProfileForm } from '@/components/profile/profile-form';

/** Profile editor hits the live API. */
export const dynamic = 'force-dynamic';

/**
 * Profile editor page (`/profile`). The matching-profile form and the
 * notifications section are independent forms with separate save actions
 * (profile-editor spec's "Saving notifications leaves the matching profile
 * untouched" scenario) — visually separated, not merged into one form.
 *
 * @returns The profile page.
 */
export default function ProfilePage() {
  return (
    <div className="flex flex-col gap-6">
      <ProfileForm />
      <NotificationSettingsForm />
    </div>
  );
}
