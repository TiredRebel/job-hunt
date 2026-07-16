/**
 * @module reactions.service.spec
 *
 * Unit tests for {@link ReactionsService} using an in-memory repository fake.
 */
import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';

import type { CurrentReaction, JobReaction, JobReactionEvent } from '../domain/job-reaction.model';
import type {
  AppendReactionInput,
  JobReactionRepository,
} from '../application/ports/job-reaction-repository.port';
import { ReactionsService } from './reactions.service';

/**
 * In-memory {@link JobReactionRepository} fake.
 */
class FakeJobReactionRepository implements JobReactionRepository {
  public events: JobReactionEvent[] = [];
  private nextId = 1n;

  public append(input: AppendReactionInput): Promise<JobReactionEvent> {
    const event: JobReactionEvent = {
      id: this.nextId,
      jobId: input.jobId,
      profileId: input.profileId,
      reaction: input.reaction,
      note: input.note ?? null,
      occurredAt: input.occurredAt ?? new Date('2026-07-16T00:00:00Z'),
      createdAt: new Date('2026-07-16T00:00:00Z'),
    };
    this.nextId += 1n;
    this.events.push(event);
    return Promise.resolve(event);
  }

  public async appendBulk(
    jobIds: readonly bigint[],
    profileId: number,
    reaction: JobReaction,
    note?: string | null,
    occurredAt?: Date,
  ): Promise<number> {
    for (const jobId of jobIds) {
      await this.append({
        jobId,
        profileId,
        reaction,
        note: note ?? null,
        ...(occurredAt === undefined ? {} : { occurredAt }),
      });
    }
    return jobIds.length;
  }

  public timeline(jobId: bigint, profileId: number): Promise<readonly JobReactionEvent[]> {
    return Promise.resolve(
      this.events
        .filter((event) => event.jobId === jobId && event.profileId === profileId)
        .reverse(),
    );
  }

  public findCurrent(jobId: bigint, profileId: number): Promise<CurrentReaction | null> {
    const latest = [...this.events]
      .reverse()
      .find(
        (event) =>
          event.jobId === jobId && event.profileId === profileId && event.reaction !== 'note',
      );
    if (latest === undefined) {
      return Promise.resolve(null);
    }
    return Promise.resolve({
      jobId: latest.jobId,
      profileId: latest.profileId,
      reaction: latest.reaction,
      occurredAt: latest.occurredAt,
    });
  }

  public async findCurrentMany(
    jobIds: readonly bigint[],
    profileId: number,
  ): Promise<ReadonlyMap<bigint, CurrentReaction>> {
    const map = new Map<bigint, CurrentReaction>();
    for (const jobId of jobIds) {
      const current = await this.findCurrent(jobId, profileId);
      if (current !== null) {
        map.set(jobId, current);
      }
    }
    return map;
  }
}

describe('ReactionsService', () => {
  let repository: FakeJobReactionRepository;
  let service: ReactionsService;

  beforeEach(() => {
    repository = new FakeJobReactionRepository();
    service = new ReactionsService(repository);
  });

  it('appends a single reaction', async () => {
    const event = await service.add({ jobId: 1n, profileId: 1, reaction: 'applied' });

    expect(event.reaction).toBe('applied');
    expect(repository.events).toHaveLength(1);
  });

  it('appends bulk reactions and returns the inserted count', async () => {
    const count = await service.addBulk([1n, 2n, 3n], 1, 'saved');

    expect(count).toBe(3);
    expect(repository.events.map((event) => event.jobId)).toEqual([1n, 2n, 3n]);
  });

  it('short-circuits bulk append for an empty id list', async () => {
    const count = await service.addBulk([], 1, 'saved');

    expect(count).toBe(0);
    expect(repository.events).toHaveLength(0);
  });

  it('returns the timeline newest first', async () => {
    await service.add({ jobId: 1n, profileId: 1, reaction: 'saved' });
    await service.add({ jobId: 1n, profileId: 1, reaction: 'applied' });
    await service.add({ jobId: 2n, profileId: 1, reaction: 'saved' });

    const events = await service.timeline(1n, 1);

    expect(events.map((event) => event.reaction)).toEqual(['applied', 'saved']);
  });

  it('throws NotFoundException for an empty timeline', async () => {
    await expect(service.timeline(9n, 1)).rejects.toBeInstanceOf(NotFoundException);
  });
});
