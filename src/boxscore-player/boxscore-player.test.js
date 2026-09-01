import PlayerStats from '../player-stats/player-stats';

import BoxscorePlayer from './boxscore-player.js';

describe('BoxscorePlayer', () => {
  describe('responseMap', () => {
    const buildBoxscorePlayer = (data, options) => BoxscorePlayer.buildFromServer(data, options);

    let data;
    let pointStats;
    let projectedStats;

    beforeEach(() => {
      pointStats = {
        appliedStats: {
          24: 2.3,
          25: 6
        },
        stats: {
          24: 3,
          25: 6.4
        },
        statSourceId: 0,
        statSplitTypeId: 1
      };
      projectedStats = {
        appliedStats: {
          24: 4.2,
          25: 1
        },
        stats: {
          24: 3.2,
          25: 4
        },
        statSourceId: 1,
        statSplitTypeId: 1
      };

      data = {
        lineupSlotId: 6,
        playerPoolEntry: {
          player: {
            stats: [projectedStats, pointStats]
          },
          status: 'ONTEAM'
        },
        status: 'NORMAL'
      };
    });

    describe('availabilityStatus', () => {
      describe('manualParse', () => {
        test('maps from rawData to override collision with other status', () => {
          const player = buildBoxscorePlayer(data);
          expect(player.availabilityStatus).toBe(data.playerPoolEntry.status);
        });
      });
    });

    describe('rosteredPosition', () => {
      describe('manualParse', () => {
        // Slot id 6 rather than a value the two position enums agree on: `defaultPositionId` has
        // no 6, so wiring this to the wrong map yields undefined and fails here.
        test('maps lineup slot id to human readable rosteredPosition', () => {
          const player = buildBoxscorePlayer(data);
          expect(player.rosteredPosition).toBe('TE');
        });
      });
    });

    describe('pointBreakdown', () => {
      describe('manualParse', () => {
        test('maps points to a PlayerStats instance', () => {
          const player = buildBoxscorePlayer(data);
          const expectedStats = PlayerStats.buildFromServer(
            pointStats.appliedStats,
            { usesPoints: true }
          );
          expect(player.pointBreakdown).toEqual(expectedStats);
        });
      });
    });

    describe('projectedPointBreakdown', () => {
      describe('manualParse', () => {
        test('maps points to a PlayerStats instance', () => {
          const player = buildBoxscorePlayer(data);
          const expectedStats = PlayerStats.buildFromServer(
            projectedStats.appliedStats,
            { usesPoints: true }
          );
          expect(player.projectedPointBreakdown).toEqual(expectedStats);
        });
      });
    });

    describe('rawStats', () => {
      describe('manualParse', () => {
        test('maps points to a PlayerStats instance', () => {
          const player = buildBoxscorePlayer(data);
          const expectedStats = PlayerStats.buildFromServer(
            pointStats.stats,
            { usesPoints: false }
          );
          expect(player.rawStats).toEqual(expectedStats);
        });
      });
    });

    describe('projectedRawStats', () => {
      describe('manualParse', () => {
        test('maps points to a PlayerStats instance', () => {
          const player = buildBoxscorePlayer(data);
          const expectedStats = PlayerStats.buildFromServer(
            projectedStats.stats,
            { usesPoints: false }
          );
          expect(player.projectedRawStats).toEqual(expectedStats);
        });
      });
    });
  });
});
