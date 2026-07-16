import { ProfileForm } from '@/components/profile/profile-form';

/** Profile editor hits the live API. */
export const dynamic = 'force-dynamic';

/**
 * Profile editor page (`/profile`).
 *
 * @returns The profile page.
 */
export default function ProfilePage() {
  return <ProfileForm />;
}
