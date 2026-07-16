import { JobDetailView } from '@/components/jobs/job-detail';

/** Always request-time: detail is fetched client-side against the live API. */
export const dynamic = 'force-dynamic';

/** Route props for `/jobs/[id]`. */
interface JobDetailPageProps {
  readonly params: Promise<{ id: string }>;
}

/**
 * Full-page job detail. Renders the same {@link JobDetailView} as the drawer
 * (design.md D5).
 *
 * @param props - Route props.
 * @returns The job detail page.
 */
export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-3xl">
      <JobDetailView jobId={id} variant="page" />
    </div>
  );
}
