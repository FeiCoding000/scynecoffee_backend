import { LegacyUserCandidateMapper } from './legacy-user-candidate.mapper';

describe('LegacyUserCandidateMapper', () => {
  let mapper: LegacyUserCandidateMapper;

  beforeEach(() => {
    mapper = new LegacyUserCandidateMapper();
  });

  it('maps legacy user to candidate with preferred drink count', () => {
    expect(
      mapper.toCandidate({
        legacyUserId: 'legacy-user-1',
        displayName: 'Chloe Woodburn',
        firstName: 'Chloe',
        lastName: 'Woodburn',
        normalizedName: 'chloe woodburn',
        options: [{ title: 'Flat White' }, { title: 'Latte' }],
      }),
    ).toEqual({
      legacyUserId: 'legacy-user-1',
      displayName: 'Chloe Woodburn',
      firstName: 'Chloe',
      lastName: 'Woodburn',
      preferredDrinkCount: 2,
    });
  });

  it('uses zero preferred drink count when options are absent at runtime', () => {
    expect(
      mapper.toCandidate({
        legacyUserId: 'legacy-user-1',
        displayName: null,
        firstName: null,
        lastName: null,
        normalizedName: null,
        options: undefined as never,
      }),
    ).toMatchObject({ preferredDrinkCount: 0 });
  });
});
