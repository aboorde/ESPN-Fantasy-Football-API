export default NFLGame;
/**
 * Represents an NFL game between two NFL teams.
 *
 * @augments {BaseObject}
 */
declare class NFLGame extends BaseObject {
    static GAME_STATUSES: {
        pre: string;
        in: string;
        post: string;
    };
    /**
     * @typedef {object} NFLTeam
     *
     * @property {number} id The id of the NFL team in the ESPN universe.
     * @property {string} team The name of the NFL team.
     * @property {string} teamAbbrev The name abbreviation of the NFL team.
     * @property {string} record The win/loss/tie record of the NFL team.
     * @property {number} score The score of the NFL team in the game.
     */
    /**
     * @typedef {object} NFLGameMap
     *
     * @property {Date} startTime The date and time when the game starts in Eastern Time.
     * @property {number} quarter The quarter the game is in.
     * @property {string} clock The current game clock formatted as MM:SS.
     * @property {string} odds The odds for the game formatted as "TEAM_ABBREV LINE". NOTE: These
     *   may only display for the current week.
     * @property {string} broadcaster Who is broadcasting the game on TV.
     *
     * @property {string} gameStatus Whether or not the game has not started, is in progress, or has
     *                               finished.
     * @property {NFLTeam} homeTeam The home team in the game.
     * @property {NFLTeam} awayTeam The away team in the game.
     */
    /**
     * @type {NFLGameMap}
     */
    static responseMap: {
        /**
         * The date and time when the game starts in Eastern Time.
         */
        startTime: Date;
        /**
         * The quarter the game is in.
         */
        quarter: number;
        /**
         * The current game clock formatted as MM:SS.
         */
        clock: string;
        /**
         * The odds for the game formatted as "TEAM_ABBREV LINE". NOTE: These
         * may only display for the current week.
         */
        odds: string;
        /**
         * Who is broadcasting the game on TV.
         */
        broadcaster: string;
        /**
         * Whether or not the game has not started, is in progress, or has
         * finished.
         */
        gameStatus: string;
        /**
         * The home team in the game.
         */
        homeTeam: {
            /**
             * The id of the NFL team in the ESPN universe.
             */
            id: number;
            /**
             * The name of the NFL team.
             */
            team: string;
            /**
             * The name abbreviation of the NFL team.
             */
            teamAbbrev: string;
            /**
             * The win/loss/tie record of the NFL team.
             */
            record: string;
            /**
             * The score of the NFL team in the game.
             */
            score: number;
        };
        /**
         * The away team in the game.
         */
        awayTeam: {
            /**
             * The id of the NFL team in the ESPN universe.
             */
            id: number;
            /**
             * The name of the NFL team.
             */
            team: string;
            /**
             * The name abbreviation of the NFL team.
             */
            teamAbbrev: string;
            /**
             * The win/loss/tie record of the NFL team.
             */
            record: string;
            /**
             * The score of the NFL team in the game.
             */
            score: number;
        };
    };
    static _buildTeamAttribute(teamResponseData: any): {
        id: number;
        team: any;
        teamAbbrev: any;
        record: any;
        score: number;
    };
}
import BaseObject from '../base-classes/base-object/base-object';

// Instance attributes, projected from the jsdoc by scripts/build-types.mjs.

type NFLGameAttributes = typeof NFLGame.responseMap;
interface NFLGame extends NFLGameAttributes {}
