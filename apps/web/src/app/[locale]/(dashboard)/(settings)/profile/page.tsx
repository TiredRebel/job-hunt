import { NotificationSettingsForm } from '@/components/profile/notification-settings-form';
import { ProfileForm } from '@/components/profile/profile-form';

/** Profile editor hits the live API. */
export const dynamic = 'force-dynamic';

/** Profile editor page (`/profile`). */
export default function ProfilePage() {
  return (
    <div className="flex flex-col gap-6">
      <ProfileForm />
      <NotificationSettingsForm />
    </div>
  );
}
