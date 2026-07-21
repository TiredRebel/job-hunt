import { describe, expect, it } from 'vitest';

import { sourceRunCounts } from './sources-page';

describe('sourceRunCounts', () => {
  it('maps scraper discovery and insertion counters to the source-history labels', () => {
    expect(sourceRunCounts({ discovered: 72, inserted: 3 })).toEqual({ found: 72, neu: 3 });
  });

  it('continues to read the legacy API counter names', () => {
    expect(sourceRunCounts({ found: 4, new: 2 })).toEqual({ found: 4, neu: 2 });
  });
});
