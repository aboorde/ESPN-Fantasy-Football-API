/**
 * Maps ESPN's `lineupSlotId` enum to readable positions.
 *
 * This is the enum used by `eligibleSlots` and by a roster entry's `lineupSlotId` -- the slots a
 * player may be *started* in. It includes combination slots (`RB/WR`), `Bench` and `IR`, which are
 * lineup concepts rather than positions.
 *
 * NOTE: ESPN has a *second*, incompatible position enum, `defaultPositionId`, which describes what
 * a player *is* rather than where they may be slotted. The two overlap on `2` (RB) and `16`
 * (D/ST) and disagree everywhere else, so reading one through the other silently yields a wrong
 * but plausible position. Use {@link defaultPositionIdToPosition} for that enum.
 *
 * @type {Record<number, string>}
 */
export const slotCategoryIdToPositionMap: Record<number, string>;
/**
 * Maps ESPN's `defaultPositionId` enum to readable positions.
 *
 * This is the enum on a player object describing the position the player actually plays, and it is
 * also the enum `pointsOverrides` is keyed by in a league's scoring settings. It is NOT the same
 * enum as {@link slotCategoryIdToPositionMap}: there, `1` is `TQB`, `3` is `RB/WR`, `4` is `WR`
 * and `5` is `WR/TE`.
 *
 * Verified against real 2026 player payloads: Josh Allen is `1`, Jahmyr Gibbs `2`, Ja'Marr Chase
 * `3`, Trey McBride `4`, Brandon Aubrey `5`, and a D/ST `16`.
 *
 * Only those six ids are listed, because only those six are confirmed. ESPN issues further ids for
 * IDP positions, and this project has no payload to verify them against. An unlisted id resolves to
 * `undefined` rather than to a guess -- an absent position is recoverable, a confidently wrong one
 * is not.
 *
 * @type {Record<number, string>}
 */
export const defaultPositionIdToPosition: Record<number, string>;
/**
 * Maps `proTeam` numerical enum to readable team names.
 * @type {object}
 */
export const nflTeamIdToNFLTeam: object;
/**
 * Maps `proTeam` numerical enum to readable team name abbreviations.
 * @type {object}
 */
export const nflTeamIdToNFLTeamAbbreviation: object;
/**
 * @typedef {object} ScoringItems
 *
 * `scoringItemToId` and `scoringIdToItem` map between numerical ids and human-readable attribute
 * names. While some attributes are straight-forward (yards, attempts, completions, etc.), some
 * attributes are niche items such as ranges.
 *
 * Scoring items that are not configured or enabled in a league's settings may still be populated on
 * API responses.
 *
 * There are several scoring categories scoring all have "per increment" scoring, i.e. points for
 * every <X> yards gained. The typically scoring pattern is something like 0.1 point per 1 yard. The
 * <X> point per 1 yard attribute does not include the "Per1Yard" suffix; only attributes like
 * "Per5Yards" have the matching suffix. "Per5Yards" scoring means that 5 total yards gained is
 * given 1 point, 9 total yards gained would be given 1 point, and 10 total yards gained given 2
 * points.
 *
 * Passing scoring items are typically only present for QBs, but position players (like RBs, WRs,
 * TEs) will occasionally make a passing play as well.
 *
 * Defensive yards allowed and points allowed are inclusive and only scored when their condition
 * is met. For example, if a DST allowed 360 yards, then `defensive350To399YardsAllowed` will be
 * scored (value is 1 when statistical) and the other defensive yard stats will not be populated.
 *
 * @property {number} passingAttempts Total passing attempts.
 * @property {number} passingYards Total passing yards.
 * @property {number} passingCompletions Total passing completions.
 * @property {number} passingIncompletions Total passing incompletions.
 * @property {number} passingCompletionPercentage Passing completions divided by passing attempts.
 *                                                This value is 0-100.
 * @property {number} passingFirstDowns Total passes resulting in first downs.
 * @property {number} passingTouchdowns Total passing TDs.
 * @property {number} passing2PtConversion Total passing 2 point conversion.
 * @property {number} passingInterceptions Total passing attempts resulting in an interception
 *                                         (typically negative points).
 * @property {number} sacked Total times the passer is sacked.
 *
 * @property {number} passingYardsPer5Yards Passing yards scored in 5 yard increments. See summary
 *                                          note for more detail.
 * @property {number} passingYardsPer10Yards Passing yards scored in 10 yard increments. See summary
 *                                           note for more.
 * @property {number} passingYardsPer20Yards Passing yards scored in 20 yard increments. See summary
 *                                           note for more.
 * @property {number} passingYardsPer25Yards Passing yards scored in 25 yard increments. See summary
 *                                           note for more.
 * @property {number} passingYardsPer50Yards Passing yards scored in 50 yard increments. See summary
 *                                           note for more.
 * @property {number} passingYardsPer100Yards Passing yards scored in 100 yard increments. See
 *                                            summary note for more.
 *
 * @property {number} passingCompletionsPer5Completions Passing completions scored in 5 completion
 *                                                      increments. See summary note for more.
 * @property {number} passingCompletionsPer10Completions Passing completions scored in 10 completion
 *                                                       increments. See summary note for more.
 * @property {number} passingIncompletionsPer5Incompletions Passing incompletions scored in 5
 *                                                          incompletion increments. See summary
 *                                                          note for more.
 * @property {number} passingIncompletionsPer10Incompletions Passing incompletions scored in 10
 *                                                           incompletion increments. See summary
 *                                                           note for more.
 *
 * @property {number} passingYards300To399 If the player threw for 300-399 yards in the game.
 * @property {number} passingYards400Plus If the player threw for 400+ yards in the game.
 * @property {number} passingTouchdowns40Plus Total number of passing touchdowns where the passing
 *                                            touchdown play was 40 yards or more.
 * @property {number} passingTouchdowns50Plus Total number of passing touchdowns where the passing
 *                                            touchdown play was 50 yards or more.
 *
 *
 * @property {number} rushingAttempts Total rushing attempts.
 * @property {number} rushingYards Total rushing yards.
 * @property {number} rushingYardsPerAttempt Rushing yards divided by rushing attempts.
 * @property {number} rushingFirstDowns Total rushes resulting in first downs.
 * @property {number} rushingTouchdowns Total rushing touchdowns.
 * @property {number} rushing2PtConversions Total rushing 2 point conversions.
 *
 * @property {number} rushingYardsPer5Yards Rushing yards scored in 5 yard increments. See summary
 *                                         note for more.
 * @property {number} rushingYardsPer10Yards Rushing yards scored in 10 yard increments. See summary
 *                                          note for more.
 * @property {number} rushingYardsPer20Yards Rushing yards scored in 20 yard increments. See summary
 *                                          note for more.
 * @property {number} rushingYardsPer25Yards Rushing yards scored in 25 yard increments. See summary
 *                                          note for more.
 * @property {number} rushingYardsPer50Yards Rushing yards scored in 50 yard increments. See summary
 *                                          note for more.
 * @property {number} rushingYardsPer100Yards Rushing yards scored in 100 yard increments. See
 *                                           summary note for more.
 *
 * @property {number} rushingAttemptsPer5Attempts Rushing attempts scored in 5 attempt increments.
 *                                                See summary note for more.
 * @property {number} rushingAttemptsPer10Attempts Rushing attempts scored in 10 attempt increments.
 *                                                 See summary note for more.
 *
 * @property {number} rushingTouchdowns40Plus Total number of rushing touchdowns where the rushing
 *                                            touchdown play was 40 yards or more.
 * @property {number} rushingTouchdowns50Plus Total number of rushing touchdowns where the rushing
 *                                            touchdown play was 50 yards or more.
 * @property {number} rushingGame100To199Yards Scored if the player rushes for 100-199 yards in a
 *                                             NFL game.
 * @property {number} rushingGame200PlusYards Scored if the player rushes for 200+ yards in a NFL
 *                                            game.
 *
 * @property {number} receivingTargets Total times the player was targeted on a pass, regardless
 *                                     if the pass was completed.
 * @property {number} receivingReceptions Total receptions (only populated in PPR
 *                                        leagues).
 * @property {number} receivingYards Total receiving yards.
 * @property {number} receivingFirstDowns Total catches resulting in first downs.
 * @property {number} receivingTouchdowns Total receiving touchdowns.
 * @property {number} receivingYardsAfterCatch Total yards gained by the player after passes were
 *                                             caught.
 * @property {number} receivingYardsPerReception Total yards divided by receptions.
 * @property {number} receiving2PtConversions Total receiving 2 point conversions.
 *
 * @property {number} receivingYardsPer5Yards Receiving yards scored in 5 yard increments. See
 *                                            summary note for more.
 * @property {number} receivingYardsPer10Yards Receiving yards scored in 10 yard increments. See
 *                                             summary note for more.
 * @property {number} receivingYardsPer20Yards Receiving yards scored in 20 yard increments. See
 *                                             summary note for more.
 * @property {number} receivingYardsPer25Yards Receiving yards scored in 25 yard increments. See
 *                                             summary note for more.
 * @property {number} receivingYardsPer50Yards Receiving yards scored in 50 yard increments. See
 *                                             summary note for more.
 * @property {number} receivingYardsPer100Yards Receiving yards scored in 100 yard increments. See
 *                                              summary note for more.
 *
 * @property {number} receptionsPer5Receptions Receptions scored in 5 reception increments. See
 *                                             summary note for more.
 * @property {number} receptionsPer10Receptions Receptions scored in 10 reception increments. See
 *                                             summary note for more.
 *
 * @property {number} receivingTouchdowns40Plus Total number of receiving touchdowns where the
 *                                              receiving touchdown play was 40 yards or more.
 * @property {number} receivingTouchdowns50Plus Total number of receiving touchdowns where the
 *                                              receiving touchdown play was 50 yards or more.
 * @property {number} receivingGame100To199Yards Scored if the player catches for 100-199 yards in a
 *                                               NFL game.
 * @property {number} receivingGame200PlusYards Scored if the player catches for 200+ yards in a NFL
 *                                              game.)
 *
 *
 * @property {number} fumbles Total fumbles, regardless of whether the fumble was recovered by the
 *                            opposing team (i.e "lost") or not
 * @property {number} lostFumbles Total fumbles lost (typically negative points) (applies to all
 *                                offensive players).
 * @property {number} totalTurnovers Total turnovers (typically fumbles and interceptions, possibly
 *                              safeties and downs as well?)
 *
 * @property {number} madeFieldGoals Made field goal attempts (any distance).
 * @property {number} attemptedFieldGoals Total field goal attempts (any distance).
 * @property {number} missedFieldGoals Missed field goal attempts (any distance)
 *                                     (typically negative points).
 *
 * @property {number} madeFieldGoalsFrom60Plus Total made field goals from 60 yards or further.
 * @property {number} madeFieldGoalsFrom50Plus Total made field goals from 50 yards or further.
 * @property {number} madeFieldGoalsFrom50To59 Total made field goals from 50 yards to 59 yards.
 * @property {number} madeFieldGoalsFrom40To49 Total made field goals from 40 yards to 49 yards.
 * @property {number} madeFieldGoalsFromUnder40 Total made field goals from under 40 yards.
 * @property {number} attemptedFieldGoalsFrom60Plus Total attempted field goals from 60 yards or
 *                                                  further.
 * @property {number} attemptedFieldGoalsFrom50Plus Total attempted field goals from 50 yards or
 *                                                  further.
 * @property {number} attemptedFieldGoalsFrom50To59 Total attempted field goals from 50 yards to
 *                                                  59 yards.
 * @property {number} attemptedFieldGoalsFrom40To49 Total attempted field goals from 40 yards to
 *                                                  49 yards.
 * @property {number} attemptedFieldGoalsFromUnder40 Total attempted field goals from under 40
 *                                                   yards.
 * @property {number} missedFieldGoalsFrom60Plus Total missed field goals from 60 yards or
 *                                               further (typically negative or zero points).
 * @property {number} missedFieldGoalsFrom50Plus Total missed field goals from 50 yards or
 *                                               further (typically negative or zero points).
 * @property {number} missedFieldGoalsFrom50To59 Total missed field goals from 50 yards to 59
 *                                               yards (typically negative or zero points).
 * @property {number} missedFieldGoalsFrom40To49 Total missed field goals from 40 yards to 49
 *                                               yards (typically negative or zero points).
 * @property {number} missedFieldGoalsFromUnder40 Total missed field goals from under 40 yards
 *                                                (typically negative or zero points).
 *
 * @property {number} fieldGoalMadeYards The total yards in distance of all made field goals scored
 *                                       in 1 yard increments.
 * @property {number} fieldGoalMadeYardsPer5Yards The total yards in distance of all made field
 *                                                goals scored in 5 yard increments.
 * @property {number} fieldGoalMadeYardsPer10Yards The total yards in distance of all made field
 *                                                 goals scored in 10 yard increments.
 * @property {number} fieldGoalMadeYardsPer20Yards The total yards in distance of all made field
 *                                                 goals scored in 20 yard increments.
 * @property {number} fieldGoalMadeYardsPer25Yards The total yards in distance of all made field
 *                                                 goals scored in 25 yard increments.
 * @property {number} fieldGoalMadeYardsPer50Yards The total yards in distance of all made field
 *                                                 goals scored in 50 yard increments.
 * @property {number} fieldGoalMadeYardsPer100Yards The total yards in distance of all made field
 *                                                  goals scored in 100 yard increments.
 * @property {number} fieldGoalMissedYards The total yards in distance of all missed field goals
 *                                         scored in 1 yard increments.
 * @property {number} fieldGoalMissedYardsPer5Yards The total yards in distance of all missed field
 *                                                  goals scored in 5 yard increments.
 * @property {number} fieldGoalMissedYardsPer10Yards The total yards in distance of all missed field
 *                                                   goals scored in 10 yard increments.
 * @property {number} fieldGoalMissedYardsPer20Yards The total yards in distance of all missed field
 *                                                   goals scored in 20 yard increments.
 * @property {number} fieldGoalMissedYardsPer25Yards The total yards in distance of all missed field
 *                                                   goals scored in 25 yard increments.
 * @property {number} fieldGoalMissedYardsPer50Yards The total yards in distance of all missed field
 *                                                   goals scored in 50 yard increments.
 * @property {number} fieldGoalMissedYardsPer100Yards The total yards in distance of all missed
 *                                                    field goals scored in 100 yard increments.
 * @property {number} fieldGoalAttemptedYards The total yards in distance of all attempted field
 *                                            goals scored in 1 yard increments.
 * @property {number} fieldGoalAttemptedYardsPer5Yards The total yards in distance of all attempted
 *                                                     field goals scored in 5 yard increments.
 * @property {number} fieldGoalAttemptedYardsPer10Yards The total yards in distance of all attempted
 *                                                      field goals scored in 10 yard increments.
 * @property {number} fieldGoalAttemptedYardsPer20Yards The total yards in distance of all attempted
 *                                                      field goals scored in 20 yard increments.
 * @property {number} fieldGoalAttemptedYardsPer25Yards The total yards in distance of all attempted
 *                                                      field goals scored in 25 yard increments.
 * @property {number} fieldGoalAttemptedYardsPer50Yards The total yards in distance of all attempted
 *                                                      field goals scored in 50 yard increments.
 * @property {number} fieldGoalAttemptedYardsPer100Yards The total yards in distance of all
 *                                                       attempted field goals scored in 100 yard
 *                                                       increments.
 *
 * @property {number} madeExtraPoints Made extra point attempts.
 * @property {number} attemptedExtraPoints Total extra point attempts.
 * @property {number} missedExtraPoints Missed extra point attempts (typically negative points).
 *
 * @property {number} defensiveBlockedKickForTouchdowns When a DST blocks any kick and returns it
 *                                                      for a touchdown.
 * @property {number} defensiveInterceptions When a DST records an interception.
 * @property {number} defensiveFumbles When a DST recovers a fumble.
 * @property {number} defensiveBlockedKicks When a DST blocks any kick.
 * @property {number} defensiveSafeties When a DST records a safety.
 * @property {number} defensiveSacks When a DST records a sack.
 * @property {number} defensiveHalfSacks When a DST records an half sack. Like an assist for sacks.
 *
 * @property {number} kickoffReturnTouchdown When a DST returns a kickoff for a touchdown.
 * @property {number} puntReturnTouchdown When a DST returns a punt for a touchdown.
 * @property {number} fumbleReturnTouchdown When a DST returns a fumble for a touchdown.
 * @property {number} interceptionReturnTouchdown When a DST returns an interception for a
 *                                                touchdown.
 * @property {number} totalReturnTouchdowns Total times a DST returns a kick, punt, fumble, or
 *                                          interception for a touchdown.
 *
 * @property {number} kickoffReturnYards Total yards on kickoff returns.
 * @property {number} puntReturnYards Total yards on punt returns.
 *
 * @property {number} kickoffReturnYardsPer10Yards Kickoff return yards scored in 10 yard
 *                                                 increments.
 * @property {number} kickoffReturnYardsPer25Yards Kickoff return yards scored in 25 yard
 *                                                 increments.
 * @property {number} puntReturnYardsPer10Yards Punt return yards scored in 10 yard increments.
 * @property {number} puntReturnYardsPer25Yards Punt return yards scored in 25 yard increments.
 *
 * @property {number} defensiveForcedFumbles No description
 * @property {number} defensiveAssistedTackles No description
 * @property {number} defensiveSoloTackles No description
 * @property {number} defensiveTotalTackles No description
 * @property {number} defensiveTacklesPer3Tackles No description
 * @property {number} defensiveTacklesPer5Tackles No description
 * @property {number} defensiveStuffs No description
 *
 * @property {number} defensivePointsAllowed Total points allowed by the defense in the NFL game
 *                                           (real points allowed, not fantasy points).
 * @property {number} defensive0PointsAllowed When a DST allowed 0 points in their NFL game.
 * @property {number} defensive1To6PointsAllowed When a DST allowed 1-6 points in their NFL game.
 * @property {number} defensive7To13PointsAllowed When a DST allowed 7-13 points in their NFL
 *                                                game.
 * @property {number} defensive14To17PointsAllowed When a DST allowed 14-17 points in their NFL
 *                                                 game.
 * @property {number} defensive18To21PointsAllowed When a DST allows 18-21 points in their NFL
 *                                                 game.
 * @property {number} defensive22To27PointsAllowed When a DST allows 22-27 points in their NFL
 *                                                 game.
 * @property {number} defensive28To34PointsAllowed When a DST allows 28-34 points in their NFL
 *                                                 game.
 * @property {number} defensive35To45PointsAllowed When a DST allows 35-45 points in their NFL
 *                                                 game.
 * @property {number} defensiveOver45PointsAllowed When a DST allows more than 45 points in their
 *                                                 NFL game.
 *
 * @property {number} defensiveYardsAllowed Total yards allowed by a DST.
 * @property {number} defensiveLessThan100YardsAllowed When a DST allows less than 100 yards in
 *                                                     their NFL game.
 * @property {number} defensive100To199YardsAllowed When a DST allows 100-199 yards in their NFL
 *                                                  game.
 * @property {number} defensive200To299YardsAllowed When a DST allows 200-299 yards in their NFL
 *                                                  game.
 * @property {number} defensive350To399YardsAllowed When a DST allows 350-399 yards in their NFL
 *                                                  game.
 * @property {number} defensive400To449YardsAllowed When a DST allows 400-449 yards in their NFL
 *                                                  game.
 * @property {number} defensive450To499YardsAllowed When a DST allows 450-499 yards in their NFL
 *                                                  game.
 * @property {number} defensive500To549YardsAllowed When a DST allows 500-549 yards in their NFL
 *                                                  game.
 * @property {number} defensiveOver550YardsAllowed When a DST allows 550 or more yards in their
 *                                                 NFL game.
 *
 * @property {number} teamWin Scored when the NFL player's team wins their NFL game.
 * @property {number} teamLoss Scored when the NFL player's team loses their NFL game.
 * @property {number} teamTie Scored when the NFL player's team ties their NFL game.
 * @property {number} teamPointsScored Fantasy points awarded based on the total points scored by
 *                                     a player's team in their NFL game.
 *
 * @property {number} teamWinMargin25Plus Scored when a player's NFL team wins their NFL games by
 *                                        25 or more points.
 * @property {number} teamWinMargin20To24 Scored when a player's NFL team wins their NFL games by
 *                                        20-24 points.
 * @property {number} teamWinMargin15To19 Scored when a player's NFL team wins their NFL games by
 *                                        15-19 points.
 * @property {number} teamWinMargin10To14 Scored when a player's NFL team wins their NFL games by
 *                                        10-14 points.
 * @property {number} teamWinMargin5To9 Scored when a player's NFL team wins their NFL games by 5-9
 *                                      points.
 * @property {number} teamWinMargin1To4 Scored when a player's NFL team wins their NFL games by 1-4
 *                                      points.
 *
 * @property {number} teamLossMargin25Plus Scored when a player's NFL team loses their NFL games by
 *                                         25 or more points.
 * @property {number} teamLossMargin20To24 Scored when a player's NFL team loses their NFL games by
 *                                         20-24 points.
 * @property {number} teamLossMargin15To19 Scored when a player's NFL team loses their NFL games by
 *                                         15-19 points.
 * @property {number} teamLossMargin10To14 Scored when a player's NFL team loses their NFL games by
 *                                         10-14 points.
 * @property {number} teamLossMargin5To9 Scored when a player's NFL team loses their NFL games by
 *                                       5-9 points.
 * @property {number} teamLossMargin1To4 Scored when a player's NFL team loses their NFL games by
 *                                       1-4 points.
 *
 * @property {number} netPunts No description.
 * @property {number} puntYards No description.
 * @property {number} puntsInsideThe10 Total number of punts ending inside the opponent's 10 yard
 *                                     line.
 * @property {number} puntsInsideThe20 Total number of punts ending inside the opponent's 20 yard
 *                                     line.
 * @property {number} fairCatches lol
 */
/**
 * @type {ScoringItems}
 */
export const scoringItemToId: ScoringItems;
export const scoringIdToItem: {
    [k: string]: string;
};
/**
 * ESPN's own string enums, as open unions.
 *
 * Each is written `... | (string & {})` rather than as a closed union, deliberately. These lists
 * are hand-maintained knowledge about an API this project does not control, and that knowledge has
 * already been wrong here: `defaultPositionId` was read through the lineup-slot enum for years,
 * reporting four of the six fantasy positions incorrectly. A closed union would let a consumer
 * write an exhaustive `switch`, have TypeScript certify it complete, and then meet a value ESPN
 * sends that is not on the list. The open form gives autocomplete without the false promise.
 *
 * A few carry runtime constants below, for the values a consumer is likely to compare against.
 */
/**
 * How players are acquired onto a roster.
 * @typedef {'FREEAGENCY' |
 *   'WAIVERS_TRADITIONAL' |
 *   'WAIVERS_CONTINUOUS' |
 *   (string & {})} AcquisitionType
 */
/**
 * How a league drafts.
 * @typedef {'OFFLINE' |
 *   'SNAKE' |
 *   'AUTOPICK' |
 *   'SNAIL' |
 *   'AUCTION' |
 *   (string & {})} DraftType
 */
/**
 * A player's injury status.
 * @typedef {'ACTIVE' |
 *   'BEREAVEMENT' |
 *   'DAY_TO_DAY' |
 *   'DOUBTFUL' |
 *   'FIFTEEN_DAY_DL' |
 *   'INJURY_RESERVE' |
 *   'OUT' |
 *   'PATERNITY' |
 *   'PROBABLE' |
 *   'QUESTIONABLE' |
 *   'SEVEN_DAY_DL' |
 *   'SIXTY_DAY_DL' |
 *   'SUSPENSION' |
 *   'TEN_DAY_DL' |
 *   (string & {})} InjuryStatus
 */
/**
 * How keeper order is determined.
 * @typedef {'TRADITIONAL' |
 *   'END_OF_DRAFT' |
 *   'SELECTED_ROUND' |
 *   (string & {})} KeeperOrderType
 */
/**
 * When a starting lineup locks.
 * @typedef {'INDIVIDUAL_GAME' |
 *   'FIRSTGAME_SCORINGPERIOD' |
 *   (string & {})} LineupLockTime
 */
/**
 * The result of a matchup, from one team's side. This is what a streak is made of.
 * @typedef {'WIN' |
 *   'LOSS' |
 *   'TIE' |
 *   'NONE' |
 *   (string & {})} MatchupResult
 */
/**
 * How a tied matchup is broken.
 * @typedef {'NONE' |
 *   'HOME_TEAM_WINS' |
 *   'SLOT_POINTS' |
 *   'STAT_POINTS' |
 *   'FIRSTGAME_SCORINGPERIOD' |
 *   (string & {})} MatchupTiebreaker
 */
/**
 * A player's status for fantasy rostering purposes.
 * @typedef {'FREEAGENT' |
 *   'ONTEAM' |
 *   'WAIVERS' |
 *   (string & {})} PlayerAvailabilityStatus
 */
/**
 * How a player moved.
 * @typedef {'NONE' |
 *   'LINEUP' |
 *   'ADD' |
 *   'DROP' |
 *   'DRAFT' |
 *   'UNDRAFT' |
 *   'DRAFT_TRADE' |
 *   (string & {})} PlayerMoveType
 */
/**
 * How playoff seeds are determined.
 * @typedef {'UNKNOWN' |
 *   'H2H_RECORD' |
 *   'TOTAL_POINTS_SCORED' |
 *   'INTRA_DIVISION_RECORD' |
 *   'TOTAL_POINTS_AGAINST' |
 *   'RAW_STAT' |
 *   (string & {})} PlayoffSeedingRule
 */
/**
 * A kind of transaction.
 * @typedef {'TRADE_DECLINE' |
 *   'TRADE_PROPOSAL' |
 *   'TRADE_ACCEPT' |
 *   'TRADE_UPHOLD' |
 *   'TRADE_VETO' |
 *   'WAIVER_ERROR' |
 *   'TRADE_ERROR' |
 *   'WAIVER' |
 *   'ROSTER' |
 *   'FUTURE_ROSTER' |
 *   'RETRO_ROSTER' |
 *   'FREEAGENT' |
 *   'DRAFT' |
 *   (string & {})} TransactionType
 */
/**
 * Which side won a matchup.
 * @typedef {'HOME' |
 *   'AWAY' |
 *   'TIE' |
 *   'UNDECIDED' |
 *   (string & {})} WinningTeam
 */
/**
 * Runtime values for {@link WinningTeam}, so a consumer can compare against a constant rather than
 * repeating a string literal.
 * @type {Readonly<Record<'HOME'|'AWAY'|'TIE'|'UNDECIDED', WinningTeam>>}
 */
export const WINNING_TEAM: Readonly<Record<"HOME" | "AWAY" | "TIE" | "UNDECIDED", WinningTeam>>;
/**
 * Runtime values for {@link MatchupResult}.
 * @type {Readonly<Record<'WIN'|'LOSS'|'TIE'|'NONE', MatchupResult>>}
 */
export const MATCHUP_RESULT: Readonly<Record<"WIN" | "LOSS" | "TIE" | "NONE", MatchupResult>>;
/**
 * Runtime values for {@link PlayerAvailabilityStatus}.
 * @type {Readonly<Record<'FREEAGENT'|'ONTEAM'|'WAIVERS', PlayerAvailabilityStatus>>}
 */
export const PLAYER_AVAILABILITY_STATUS: Readonly<Record<"FREEAGENT" | "ONTEAM" | "WAIVERS", PlayerAvailabilityStatus>>;
/**
 * Runtime values for {@link InjuryStatus}. Only the statuses a fantasy manager acts on are given
 * constants; the type accepts the rest, and any ESPN adds.
 * @type {Readonly<Record<string, InjuryStatus>>}
 */
export const INJURY_STATUS: Readonly<Record<string, InjuryStatus>>;
/**
 * `scoringItemToId` and `scoringIdToItem` map between numerical ids and human-readable attribute
 * names. While some attributes are straight-forward (yards, attempts, completions, etc.), some
 * attributes are niche items such as ranges.
 *
 * Scoring items that are not configured or enabled in a league's settings may still be populated on
 * API responses.
 *
 * There are several scoring categories scoring all have "per increment" scoring, i.e. points for
 * every <X> yards gained. The typically scoring pattern is something like 0.1 point per 1 yard. The
 * <X> point per 1 yard attribute does not include the "Per1Yard" suffix; only attributes like
 * "Per5Yards" have the matching suffix. "Per5Yards" scoring means that 5 total yards gained is
 * given 1 point, 9 total yards gained would be given 1 point, and 10 total yards gained given 2
 * points.
 *
 * Passing scoring items are typically only present for QBs, but position players (like RBs, WRs,
 * TEs) will occasionally make a passing play as well.
 *
 * Defensive yards allowed and points allowed are inclusive and only scored when their condition
 * is met. For example, if a DST allowed 360 yards, then `defensive350To399YardsAllowed` will be
 * scored (value is 1 when statistical) and the other defensive yard stats will not be populated.
 */
export type ScoringItems = {
    /**
     * Total passing attempts.
     */
    passingAttempts: number;
    /**
     * Total passing yards.
     */
    passingYards: number;
    /**
     * Total passing completions.
     */
    passingCompletions: number;
    /**
     * Total passing incompletions.
     */
    passingIncompletions: number;
    /**
     * Passing completions divided by passing attempts.
     * This value is 0-100.
     */
    passingCompletionPercentage: number;
    /**
     * Total passes resulting in first downs.
     */
    passingFirstDowns: number;
    /**
     * Total passing TDs.
     */
    passingTouchdowns: number;
    /**
     * Total passing 2 point conversion.
     */
    passing2PtConversion: number;
    /**
     * Total passing attempts resulting in an interception
     * (typically negative points).
     */
    passingInterceptions: number;
    /**
     * Total times the passer is sacked.
     */
    sacked: number;
    /**
     * Passing yards scored in 5 yard increments. See summary
     * note for more detail.
     */
    passingYardsPer5Yards: number;
    /**
     * Passing yards scored in 10 yard increments. See summary
     * note for more.
     */
    passingYardsPer10Yards: number;
    /**
     * Passing yards scored in 20 yard increments. See summary
     * note for more.
     */
    passingYardsPer20Yards: number;
    /**
     * Passing yards scored in 25 yard increments. See summary
     * note for more.
     */
    passingYardsPer25Yards: number;
    /**
     * Passing yards scored in 50 yard increments. See summary
     * note for more.
     */
    passingYardsPer50Yards: number;
    /**
     * Passing yards scored in 100 yard increments. See
     * summary note for more.
     */
    passingYardsPer100Yards: number;
    /**
     * Passing completions scored in 5 completion
     * increments. See summary note for more.
     */
    passingCompletionsPer5Completions: number;
    /**
     * Passing completions scored in 10 completion
     * increments. See summary note for more.
     */
    passingCompletionsPer10Completions: number;
    /**
     * Passing incompletions scored in 5
     * incompletion increments. See summary
     * note for more.
     */
    passingIncompletionsPer5Incompletions: number;
    /**
     * Passing incompletions scored in 10
     * incompletion increments. See summary
     * note for more.
     */
    passingIncompletionsPer10Incompletions: number;
    /**
     * If the player threw for 300-399 yards in the game.
     */
    passingYards300To399: number;
    /**
     * If the player threw for 400+ yards in the game.
     */
    passingYards400Plus: number;
    /**
     * Total number of passing touchdowns where the passing
     * touchdown play was 40 yards or more.
     */
    passingTouchdowns40Plus: number;
    /**
     * Total number of passing touchdowns where the passing
     * touchdown play was 50 yards or more.
     */
    passingTouchdowns50Plus: number;
    /**
     * Total rushing attempts.
     */
    rushingAttempts: number;
    /**
     * Total rushing yards.
     */
    rushingYards: number;
    /**
     * Rushing yards divided by rushing attempts.
     */
    rushingYardsPerAttempt: number;
    /**
     * Total rushes resulting in first downs.
     */
    rushingFirstDowns: number;
    /**
     * Total rushing touchdowns.
     */
    rushingTouchdowns: number;
    /**
     * Total rushing 2 point conversions.
     */
    rushing2PtConversions: number;
    /**
     * Rushing yards scored in 5 yard increments. See summary
     * note for more.
     */
    rushingYardsPer5Yards: number;
    /**
     * Rushing yards scored in 10 yard increments. See summary
     * note for more.
     */
    rushingYardsPer10Yards: number;
    /**
     * Rushing yards scored in 20 yard increments. See summary
     * note for more.
     */
    rushingYardsPer20Yards: number;
    /**
     * Rushing yards scored in 25 yard increments. See summary
     * note for more.
     */
    rushingYardsPer25Yards: number;
    /**
     * Rushing yards scored in 50 yard increments. See summary
     * note for more.
     */
    rushingYardsPer50Yards: number;
    /**
     * Rushing yards scored in 100 yard increments. See
     * summary note for more.
     */
    rushingYardsPer100Yards: number;
    /**
     * Rushing attempts scored in 5 attempt increments.
     * See summary note for more.
     */
    rushingAttemptsPer5Attempts: number;
    /**
     * Rushing attempts scored in 10 attempt increments.
     * See summary note for more.
     */
    rushingAttemptsPer10Attempts: number;
    /**
     * Total number of rushing touchdowns where the rushing
     * touchdown play was 40 yards or more.
     */
    rushingTouchdowns40Plus: number;
    /**
     * Total number of rushing touchdowns where the rushing
     * touchdown play was 50 yards or more.
     */
    rushingTouchdowns50Plus: number;
    /**
     * Scored if the player rushes for 100-199 yards in a
     * NFL game.
     */
    rushingGame100To199Yards: number;
    /**
     * Scored if the player rushes for 200+ yards in a NFL
     * game.
     */
    rushingGame200PlusYards: number;
    /**
     * Total times the player was targeted on a pass, regardless
     * if the pass was completed.
     */
    receivingTargets: number;
    /**
     * Total receptions (only populated in PPR
     * leagues).
     */
    receivingReceptions: number;
    /**
     * Total receiving yards.
     */
    receivingYards: number;
    /**
     * Total catches resulting in first downs.
     */
    receivingFirstDowns: number;
    /**
     * Total receiving touchdowns.
     */
    receivingTouchdowns: number;
    /**
     * Total yards gained by the player after passes were
     * caught.
     */
    receivingYardsAfterCatch: number;
    /**
     * Total yards divided by receptions.
     */
    receivingYardsPerReception: number;
    /**
     * Total receiving 2 point conversions.
     */
    receiving2PtConversions: number;
    /**
     * Receiving yards scored in 5 yard increments. See
     * summary note for more.
     */
    receivingYardsPer5Yards: number;
    /**
     * Receiving yards scored in 10 yard increments. See
     * summary note for more.
     */
    receivingYardsPer10Yards: number;
    /**
     * Receiving yards scored in 20 yard increments. See
     * summary note for more.
     */
    receivingYardsPer20Yards: number;
    /**
     * Receiving yards scored in 25 yard increments. See
     * summary note for more.
     */
    receivingYardsPer25Yards: number;
    /**
     * Receiving yards scored in 50 yard increments. See
     * summary note for more.
     */
    receivingYardsPer50Yards: number;
    /**
     * Receiving yards scored in 100 yard increments. See
     * summary note for more.
     */
    receivingYardsPer100Yards: number;
    /**
     * Receptions scored in 5 reception increments. See
     * summary note for more.
     */
    receptionsPer5Receptions: number;
    /**
     * Receptions scored in 10 reception increments. See
     * summary note for more.
     */
    receptionsPer10Receptions: number;
    /**
     * Total number of receiving touchdowns where the
     * receiving touchdown play was 40 yards or more.
     */
    receivingTouchdowns40Plus: number;
    /**
     * Total number of receiving touchdowns where the
     * receiving touchdown play was 50 yards or more.
     */
    receivingTouchdowns50Plus: number;
    /**
     * Scored if the player catches for 100-199 yards in a
     * NFL game.
     */
    receivingGame100To199Yards: number;
    /**
     * Scored if the player catches for 200+ yards in a NFL
     * game.)
     */
    receivingGame200PlusYards: number;
    /**
     * Total fumbles, regardless of whether the fumble was recovered by the
     * opposing team (i.e "lost") or not
     */
    fumbles: number;
    /**
     * Total fumbles lost (typically negative points) (applies to all
     * offensive players).
     */
    lostFumbles: number;
    /**
     * Total turnovers (typically fumbles and interceptions, possibly
     * safeties and downs as well?)
     */
    totalTurnovers: number;
    /**
     * Made field goal attempts (any distance).
     */
    madeFieldGoals: number;
    /**
     * Total field goal attempts (any distance).
     */
    attemptedFieldGoals: number;
    /**
     * Missed field goal attempts (any distance)
     * (typically negative points).
     */
    missedFieldGoals: number;
    /**
     * Total made field goals from 60 yards or further.
     */
    madeFieldGoalsFrom60Plus: number;
    /**
     * Total made field goals from 50 yards or further.
     */
    madeFieldGoalsFrom50Plus: number;
    /**
     * Total made field goals from 50 yards to 59 yards.
     */
    madeFieldGoalsFrom50To59: number;
    /**
     * Total made field goals from 40 yards to 49 yards.
     */
    madeFieldGoalsFrom40To49: number;
    /**
     * Total made field goals from under 40 yards.
     */
    madeFieldGoalsFromUnder40: number;
    /**
     * Total attempted field goals from 60 yards or
     * further.
     */
    attemptedFieldGoalsFrom60Plus: number;
    /**
     * Total attempted field goals from 50 yards or
     * further.
     */
    attemptedFieldGoalsFrom50Plus: number;
    /**
     * Total attempted field goals from 50 yards to
     * 59 yards.
     */
    attemptedFieldGoalsFrom50To59: number;
    /**
     * Total attempted field goals from 40 yards to
     * 49 yards.
     */
    attemptedFieldGoalsFrom40To49: number;
    /**
     * Total attempted field goals from under 40
     * yards.
     */
    attemptedFieldGoalsFromUnder40: number;
    /**
     * Total missed field goals from 60 yards or
     * further (typically negative or zero points).
     */
    missedFieldGoalsFrom60Plus: number;
    /**
     * Total missed field goals from 50 yards or
     * further (typically negative or zero points).
     */
    missedFieldGoalsFrom50Plus: number;
    /**
     * Total missed field goals from 50 yards to 59
     * yards (typically negative or zero points).
     */
    missedFieldGoalsFrom50To59: number;
    /**
     * Total missed field goals from 40 yards to 49
     * yards (typically negative or zero points).
     */
    missedFieldGoalsFrom40To49: number;
    /**
     * Total missed field goals from under 40 yards
     * (typically negative or zero points).
     */
    missedFieldGoalsFromUnder40: number;
    /**
     * The total yards in distance of all made field goals scored
     * in 1 yard increments.
     */
    fieldGoalMadeYards: number;
    /**
     * The total yards in distance of all made field
     * goals scored in 5 yard increments.
     */
    fieldGoalMadeYardsPer5Yards: number;
    /**
     * The total yards in distance of all made field
     * goals scored in 10 yard increments.
     */
    fieldGoalMadeYardsPer10Yards: number;
    /**
     * The total yards in distance of all made field
     * goals scored in 20 yard increments.
     */
    fieldGoalMadeYardsPer20Yards: number;
    /**
     * The total yards in distance of all made field
     * goals scored in 25 yard increments.
     */
    fieldGoalMadeYardsPer25Yards: number;
    /**
     * The total yards in distance of all made field
     * goals scored in 50 yard increments.
     */
    fieldGoalMadeYardsPer50Yards: number;
    /**
     * The total yards in distance of all made field
     * goals scored in 100 yard increments.
     */
    fieldGoalMadeYardsPer100Yards: number;
    /**
     * The total yards in distance of all missed field goals
     * scored in 1 yard increments.
     */
    fieldGoalMissedYards: number;
    /**
     * The total yards in distance of all missed field
     * goals scored in 5 yard increments.
     */
    fieldGoalMissedYardsPer5Yards: number;
    /**
     * The total yards in distance of all missed field
     * goals scored in 10 yard increments.
     */
    fieldGoalMissedYardsPer10Yards: number;
    /**
     * The total yards in distance of all missed field
     * goals scored in 20 yard increments.
     */
    fieldGoalMissedYardsPer20Yards: number;
    /**
     * The total yards in distance of all missed field
     * goals scored in 25 yard increments.
     */
    fieldGoalMissedYardsPer25Yards: number;
    /**
     * The total yards in distance of all missed field
     * goals scored in 50 yard increments.
     */
    fieldGoalMissedYardsPer50Yards: number;
    /**
     * The total yards in distance of all missed
     * field goals scored in 100 yard increments.
     */
    fieldGoalMissedYardsPer100Yards: number;
    /**
     * The total yards in distance of all attempted field
     * goals scored in 1 yard increments.
     */
    fieldGoalAttemptedYards: number;
    /**
     * The total yards in distance of all attempted
     * field goals scored in 5 yard increments.
     */
    fieldGoalAttemptedYardsPer5Yards: number;
    /**
     * The total yards in distance of all attempted
     * field goals scored in 10 yard increments.
     */
    fieldGoalAttemptedYardsPer10Yards: number;
    /**
     * The total yards in distance of all attempted
     * field goals scored in 20 yard increments.
     */
    fieldGoalAttemptedYardsPer20Yards: number;
    /**
     * The total yards in distance of all attempted
     * field goals scored in 25 yard increments.
     */
    fieldGoalAttemptedYardsPer25Yards: number;
    /**
     * The total yards in distance of all attempted
     * field goals scored in 50 yard increments.
     */
    fieldGoalAttemptedYardsPer50Yards: number;
    /**
     * The total yards in distance of all
     * attempted field goals scored in 100 yard
     * increments.
     */
    fieldGoalAttemptedYardsPer100Yards: number;
    /**
     * Made extra point attempts.
     */
    madeExtraPoints: number;
    /**
     * Total extra point attempts.
     */
    attemptedExtraPoints: number;
    /**
     * Missed extra point attempts (typically negative points).
     */
    missedExtraPoints: number;
    /**
     * When a DST blocks any kick and returns it
     * for a touchdown.
     */
    defensiveBlockedKickForTouchdowns: number;
    /**
     * When a DST records an interception.
     */
    defensiveInterceptions: number;
    /**
     * When a DST recovers a fumble.
     */
    defensiveFumbles: number;
    /**
     * When a DST blocks any kick.
     */
    defensiveBlockedKicks: number;
    /**
     * When a DST records a safety.
     */
    defensiveSafeties: number;
    /**
     * When a DST records a sack.
     */
    defensiveSacks: number;
    /**
     * When a DST records an half sack. Like an assist for sacks.
     */
    defensiveHalfSacks: number;
    /**
     * When a DST returns a kickoff for a touchdown.
     */
    kickoffReturnTouchdown: number;
    /**
     * When a DST returns a punt for a touchdown.
     */
    puntReturnTouchdown: number;
    /**
     * When a DST returns a fumble for a touchdown.
     */
    fumbleReturnTouchdown: number;
    /**
     * When a DST returns an interception for a
     * touchdown.
     */
    interceptionReturnTouchdown: number;
    /**
     * Total times a DST returns a kick, punt, fumble, or
     * interception for a touchdown.
     */
    totalReturnTouchdowns: number;
    /**
     * Total yards on kickoff returns.
     */
    kickoffReturnYards: number;
    /**
     * Total yards on punt returns.
     */
    puntReturnYards: number;
    /**
     * Kickoff return yards scored in 10 yard
     * increments.
     */
    kickoffReturnYardsPer10Yards: number;
    /**
     * Kickoff return yards scored in 25 yard
     * increments.
     */
    kickoffReturnYardsPer25Yards: number;
    /**
     * Punt return yards scored in 10 yard increments.
     */
    puntReturnYardsPer10Yards: number;
    /**
     * Punt return yards scored in 25 yard increments.
     */
    puntReturnYardsPer25Yards: number;
    /**
     * No description
     */
    defensiveForcedFumbles: number;
    /**
     * No description
     */
    defensiveAssistedTackles: number;
    /**
     * No description
     */
    defensiveSoloTackles: number;
    /**
     * No description
     */
    defensiveTotalTackles: number;
    /**
     * No description
     */
    defensiveTacklesPer3Tackles: number;
    /**
     * No description
     */
    defensiveTacklesPer5Tackles: number;
    /**
     * No description
     */
    defensiveStuffs: number;
    /**
     * Total points allowed by the defense in the NFL game
     * (real points allowed, not fantasy points).
     */
    defensivePointsAllowed: number;
    /**
     * When a DST allowed 0 points in their NFL game.
     */
    defensive0PointsAllowed: number;
    /**
     * When a DST allowed 1-6 points in their NFL game.
     */
    defensive1To6PointsAllowed: number;
    /**
     * When a DST allowed 7-13 points in their NFL
     * game.
     */
    defensive7To13PointsAllowed: number;
    /**
     * When a DST allowed 14-17 points in their NFL
     * game.
     */
    defensive14To17PointsAllowed: number;
    /**
     * When a DST allows 18-21 points in their NFL
     * game.
     */
    defensive18To21PointsAllowed: number;
    /**
     * When a DST allows 22-27 points in their NFL
     * game.
     */
    defensive22To27PointsAllowed: number;
    /**
     * When a DST allows 28-34 points in their NFL
     * game.
     */
    defensive28To34PointsAllowed: number;
    /**
     * When a DST allows 35-45 points in their NFL
     * game.
     */
    defensive35To45PointsAllowed: number;
    /**
     * When a DST allows more than 45 points in their
     * NFL game.
     */
    defensiveOver45PointsAllowed: number;
    /**
     * Total yards allowed by a DST.
     */
    defensiveYardsAllowed: number;
    /**
     * When a DST allows less than 100 yards in
     * their NFL game.
     */
    defensiveLessThan100YardsAllowed: number;
    /**
     * When a DST allows 100-199 yards in their NFL
     * game.
     */
    defensive100To199YardsAllowed: number;
    /**
     * When a DST allows 200-299 yards in their NFL
     * game.
     */
    defensive200To299YardsAllowed: number;
    /**
     * When a DST allows 350-399 yards in their NFL
     * game.
     */
    defensive350To399YardsAllowed: number;
    /**
     * When a DST allows 400-449 yards in their NFL
     * game.
     */
    defensive400To449YardsAllowed: number;
    /**
     * When a DST allows 450-499 yards in their NFL
     * game.
     */
    defensive450To499YardsAllowed: number;
    /**
     * When a DST allows 500-549 yards in their NFL
     * game.
     */
    defensive500To549YardsAllowed: number;
    /**
     * When a DST allows 550 or more yards in their
     * NFL game.
     */
    defensiveOver550YardsAllowed: number;
    /**
     * Scored when the NFL player's team wins their NFL game.
     */
    teamWin: number;
    /**
     * Scored when the NFL player's team loses their NFL game.
     */
    teamLoss: number;
    /**
     * Scored when the NFL player's team ties their NFL game.
     */
    teamTie: number;
    /**
     * Fantasy points awarded based on the total points scored by
     * a player's team in their NFL game.
     */
    teamPointsScored: number;
    /**
     * Scored when a player's NFL team wins their NFL games by
     * 25 or more points.
     */
    teamWinMargin25Plus: number;
    /**
     * Scored when a player's NFL team wins their NFL games by
     * 20-24 points.
     */
    teamWinMargin20To24: number;
    /**
     * Scored when a player's NFL team wins their NFL games by
     * 15-19 points.
     */
    teamWinMargin15To19: number;
    /**
     * Scored when a player's NFL team wins their NFL games by
     * 10-14 points.
     */
    teamWinMargin10To14: number;
    /**
     * Scored when a player's NFL team wins their NFL games by 5-9
     * points.
     */
    teamWinMargin5To9: number;
    /**
     * Scored when a player's NFL team wins their NFL games by 1-4
     * points.
     */
    teamWinMargin1To4: number;
    /**
     * Scored when a player's NFL team loses their NFL games by
     * 25 or more points.
     */
    teamLossMargin25Plus: number;
    /**
     * Scored when a player's NFL team loses their NFL games by
     * 20-24 points.
     */
    teamLossMargin20To24: number;
    /**
     * Scored when a player's NFL team loses their NFL games by
     * 15-19 points.
     */
    teamLossMargin15To19: number;
    /**
     * Scored when a player's NFL team loses their NFL games by
     * 10-14 points.
     */
    teamLossMargin10To14: number;
    /**
     * Scored when a player's NFL team loses their NFL games by
     * 5-9 points.
     */
    teamLossMargin5To9: number;
    /**
     * Scored when a player's NFL team loses their NFL games by
     * 1-4 points.
     */
    teamLossMargin1To4: number;
    /**
     * No description.
     */
    netPunts: number;
    /**
     * No description.
     */
    puntYards: number;
    /**
     * Total number of punts ending inside the opponent's 10 yard
     * line.
     */
    puntsInsideThe10: number;
    /**
     * Total number of punts ending inside the opponent's 20 yard
     * line.
     */
    puntsInsideThe20: number;
    /**
     * lol
     */
    fairCatches: number;
};
/**
 * How players are acquired onto a roster.
 */
export type AcquisitionType = "FREEAGENCY" | "WAIVERS_TRADITIONAL" | "WAIVERS_CONTINUOUS" | (string & {});
/**
 * How a league drafts.
 */
export type DraftType = "OFFLINE" | "SNAKE" | "AUTOPICK" | "SNAIL" | "AUCTION" | (string & {});
/**
 * A player's injury status.
 */
export type InjuryStatus = "ACTIVE" | "BEREAVEMENT" | "DAY_TO_DAY" | "DOUBTFUL" | "FIFTEEN_DAY_DL" | "INJURY_RESERVE" | "OUT" | "PATERNITY" | "PROBABLE" | "QUESTIONABLE" | "SEVEN_DAY_DL" | "SIXTY_DAY_DL" | "SUSPENSION" | "TEN_DAY_DL" | (string & {});
/**
 * How keeper order is determined.
 */
export type KeeperOrderType = "TRADITIONAL" | "END_OF_DRAFT" | "SELECTED_ROUND" | (string & {});
/**
 * When a starting lineup locks.
 */
export type LineupLockTime = "INDIVIDUAL_GAME" | "FIRSTGAME_SCORINGPERIOD" | (string & {});
/**
 * The result of a matchup, from one team's side. This is what a streak is made of.
 */
export type MatchupResult = "WIN" | "LOSS" | "TIE" | "NONE" | (string & {});
/**
 * How a tied matchup is broken.
 */
export type MatchupTiebreaker = "NONE" | "HOME_TEAM_WINS" | "SLOT_POINTS" | "STAT_POINTS" | "FIRSTGAME_SCORINGPERIOD" | (string & {});
/**
 * A player's status for fantasy rostering purposes.
 */
export type PlayerAvailabilityStatus = "FREEAGENT" | "ONTEAM" | "WAIVERS" | (string & {});
/**
 * How a player moved.
 */
export type PlayerMoveType = "NONE" | "LINEUP" | "ADD" | "DROP" | "DRAFT" | "UNDRAFT" | "DRAFT_TRADE" | (string & {});
/**
 * How playoff seeds are determined.
 */
export type PlayoffSeedingRule = "UNKNOWN" | "H2H_RECORD" | "TOTAL_POINTS_SCORED" | "INTRA_DIVISION_RECORD" | "TOTAL_POINTS_AGAINST" | "RAW_STAT" | (string & {});
/**
 * A kind of transaction.
 */
export type TransactionType = "TRADE_DECLINE" | "TRADE_PROPOSAL" | "TRADE_ACCEPT" | "TRADE_UPHOLD" | "TRADE_VETO" | "WAIVER_ERROR" | "TRADE_ERROR" | "WAIVER" | "ROSTER" | "FUTURE_ROSTER" | "RETRO_ROSTER" | "FREEAGENT" | "DRAFT" | (string & {});
/**
 * Which side won a matchup.
 */
export type WinningTeam = "HOME" | "AWAY" | "TIE" | "UNDECIDED" | (string & {});
