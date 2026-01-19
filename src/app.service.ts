import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Player, PlayerDocument } from './users/schemas/player.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Group, GroupDocument } from './users/schemas/group.schema';
import { Gains, GainsDocument } from './users/schemas/gains.schema';

interface RawSkill {
  rank: number;
  level: number;
  xp: number;
}

interface RawActivity {
  score: number;
  rank: number;
}

const OSRS_ACTIVITIES = [
  'League Points',
  'Deadman Points',
  'Bounty Hunter - Hunter',
  'Bounty Hunter - Rogue',
  'Bounty Hunter (Legacy) - Hunter',
  'Bounty Hunter (Legacy) - Rogue',
  'Clue Scrolls (all)',
  'Clue Scrolls (beginner)',
  'Clue Scrolls (easy)',
  'Clue Scrolls (medium)',
  'Clue Scrolls (hard)',
  'Clue Scrolls (elite)',
  'Clue Scrolls (master)',
  'LMS - Rank',
  'PvP Arena - Rank',
  'Soul Wars Zeal',
  'Rifts closed',
  'Abyssal Sire',
  'Alchemical Hydra',
  'Artio',
  'Callisto',
  "Calvar'ion",
  'Cerberus',
  'Chambers of Xeric',
  'Chambers of Xeric: Challenge Mode',
  'Chaos Elemental',
  'Chaos Fanatic',
  'Commander Zilyana',
  'Corporeal Beast',
  'Crazy Archaeologist',
  'Dagannoth Prime',
  'Dagannoth Rex',
  'Dagannoth Supreme',
  'Deranged Archaeologist',
  'General Graardor',
  'Giant Mole',
  'Grotesque Guardians',
  'Hespori',
  'Kalphite Queen',
  'King Black Dragon',
  'Kraken',
  "Kree'Arra",
  'Kril Tsutsaroth',
  'Mimic',
  'Nex',
  'Nightmare',
  "Phosani's Nightmare",
  'Obor',
  'Phantom Muspah',
  'Sarachnis',
  'Scorpia',
  'Scurrius',
  'Skotizo',
  'Spindel',
  'Tempoross',
  'The Gauntlet',
  'The Corrupted Gauntlet',
  'The Leviathan',
  'The Whisperer',
  'The Warden',
  'The Duke Sucellus',
  'The Vardorvis',
  'The Nightmare',
  'Thermonuclear Smoke Devil',
  'ToA',
  'ToA: Expert Mode',
  'ToB',
  'ToB: Hard Mode',
  'TzKal-Zuk',
  'TzTok-Jad',
  'Vardorvis',
  'Venenatis',
  "Vet'ion",
  'Vorkath',
  'Wintertodt',
  'Zalcano',
  'Zulrah',
];

const OSRS_SKILLS = [
  'Overall',
  'Attack',
  'Defence',
  'Strength',
  'Hitpoints',
  'Ranged',
  'Prayer',
  'Magic',
  'Cooking',
  'Woodcutting',
  'Fletching',
  'Fishing',
  'Firemaking',
  'Crafting',
  'Smithing',
  'Mining',
  'Herblore',
  'Agility',
  'Thieving',
  'Slayer',
  'Farming',
  'Runecraft',
  'Hunter',
  'Construction',
];

interface SkillSnapshot {
  name: string;
  xp: number;
  level: number;
}

interface ActivitySnapshot {
  name: string;
  score: number; // Finished this property
}

interface AggregationResult {
  username: string;
  first: {
    overallXp: number;
    skills: SkillSnapshot[];
    activities: ActivitySnapshot[];
  };
  last: {
    overallXp: number;
    skills: SkillSnapshot[];
    activities: ActivitySnapshot[];
  };
}

export interface ServiceResponse {
  success: boolean;
  message: string;
  error?: string;
}

export interface PlayerResponse extends ServiceResponse {
  player?: PlayerDocument;
}

export interface GroupResponse extends ServiceResponse {
  groupId?: string;
}

function getLastDayOfMonthUTC(year: number, month: number): Date {
  // We use month + 1 and day 0 to get the last day of 'month'
  return new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
}

function getDayBounds(date = new Date()): { start: Date; end: Date } {
  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0); // Use UTC to match MongoDB storage

  const end = new Date(date);
  end.setUTCHours(23, 59, 59, 999);

  return { start, end };
}
function getMonthlyBounds(date: Date = new Date()): { start: Date; end: Date } {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();

  // Start of the month (Day 1)
  const start = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));

  // End of the month (using your helper logic)
  const end = getLastDayOfMonthUTC(year, month);

  return { start, end };
}

function getWeeklyBounds(date = new Date()): { start: Date; end: Date } {
  //Get the day of the week
  const start = new Date(date.getTime());
  //How to find to monday
  // if it is sunday then day = 0  and we need to go back 6 days
  const day = start.getUTCDay();

  const differneceToMonday = day === 0 ? 6 : day - 1;
  //set the start Date to the first day of the week
  start.setUTCDate(start.getUTCDate() - differneceToMonday);
  start.setUTCHours(0, 0, 0, 0); // Use UTC to match MongoDB storage

  const end = new Date(date);
  //Start is the first day of the week so we can just 6
  end.setUTCDate(start.getUTCDate() + 6);
  end.setUTCHours(23, 59, 59, 999);

  return { start, end };
}

@Injectable()
export class AppService {
  constructor(
    private readonly httpService: HttpService,
    @InjectModel(Player.name)
    private readonly playerModel: Model<PlayerDocument>,
    @InjectModel(Group.name)
    private readonly groupModel: Model<GroupDocument>,
    @InjectModel(Gains.name)
    private readonly GainsModel: Model<GainsDocument>,
    // eslint-disable-next-line prettier/prettier
  ) { }

  async fetchAndUpsertPlayer(playerName: string): Promise<PlayerResponse> {
    if (!playerName) {
      return { success: false, message: 'Username is required' };
    }

    const url = `https://secure.runescape.com/m=hiscore_oldschool/index_lite.json?player=${playerName}`;
    // Getting Player Data from ruenscape api then creating a player to the database
    let responseData: {
      level: number;
      xp: number;
      skills: any[];
      activities: any[];
    };
    try {
      responseData = await firstValueFrom(this.httpService.get<any>(url)).then(
        (res) =>
          res.data as {
            level: number;
            xp: number;
            skills: any[];
            activities: any[];
          },
      );
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to fetch RuneScape API:', errorMessage);
      return { success: false, message: 'Failed to fetch RuneScape hiscores' };
    }

    try {
      // 1. Map skills with names
      const mappedSkills = responseData.skills.map(
        (skill: RawSkill, index: number) => ({
          name: OSRS_SKILLS[index] || `Unknown_Skill_${index}`,
          rank: skill.rank,
          level: skill.level,
          xp: skill.xp,
        }),
      );

      // Map Activities to include names
      const mappedActivities = responseData.activities.map(
        (act: RawActivity, index: number) => ({
          name: OSRS_ACTIVITIES[index] || `Unknown_Activity_${index}`,
          score: act.score,
          rank: act.rank,
        }),
      );
      // 2. Prepare the snapshot object
      const newSnapshot = {
        timeStamp: new Date(),
        overallLevel: responseData.level,
        overallXp: responseData.xp,
        skills: mappedSkills,
        activities: mappedActivities,
      };

      // 3. Update player AND push snapshot in ONE call
      const updatedPlayer = await this.playerModel.findOneAndUpdate(
        { username: playerName },
        {
          $set: {
            username: playerName,
            overallLevel: responseData.level,
            overallXp: responseData.xp,
            skills: mappedSkills,
            activities: mappedActivities,
          },
          $push: { snapshots: newSnapshot }, // This is the magic line
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );

      return {
        success: true,
        message: 'Player and Snapshot updated successfully',
        player: updatedPlayer,
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, message: 'Database error', error: errorMessage };
    }
  }

  async getGroupId(groupName: string): Promise<GroupResponse> {
    if (!groupName) {
      return { success: false, message: 'group name is required' };
    }

    try {
      const group = await this.groupModel.findOne({ name: groupName }).exec();
      if (!group) {
        return { success: false, message: 'Group not found' };
      }

      // FIX: Cast the ObjectId to a string
      return {
        success: true,
        message: 'Group found',
        groupId: group.id, // .id is a built-in getter that returns the string version
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, message: 'Database error', error: errorMessage };
    }
  }

  async createGroup(groupName: string): Promise<ServiceResponse> {
    if (!groupName) {
      return { success: false, message: 'Group name is required' };
    }

    try {
      await this.groupModel.create({ name: groupName, players: [] });
      return {
        success: true,
        message: 'Group created successfully',
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Database error:', errorMessage);
      return {
        success: false,
        message: 'Database error',
        error: 'Group already exists',
      };
    }
  }

  async AddMembersToGroup(
    groupName: string,
    groupMembers: string[],
  ): Promise<ServiceResponse> {
    if (!groupName) {
      return { success: false, message: 'Group name  is requred' };
    }
    if (!groupMembers || groupMembers.length === 0) {
      return { success: false, message: 'No usernames provided' };
    }

    try {
      const group = await this.groupModel.findOne({ name: groupName }).exec();
      if (!group) {
        return {
          success: false,
          message: 'Group not found',
        };
      }

      const players = await this.playerModel
        .find({ username: { $in: groupMembers } })
        .exec();

      if (players.length === 0) {
        return { success: false, message: 'No matching players found' };
      }

      const existingUsername = group.players.map((p) => p.username);
      const newPlayers = players.filter(
        (p) => !existingUsername.includes(p.username),
      );

      group.players.push(...newPlayers);
      await group.save();

      // FIX: Must return a ServiceResponse
      return {
        success: true,
        message: `${newPlayers.length} members added successfully`,
      };
    } catch (err: unknown) {
      console.error(
        'Database error:',
        err instanceof Error ? err.message : 'unkown error',
      );
      return {
        success: false,
        message: 'Database error',
        error: 'Could not find group members',
      };
    }
  }

  async getGains(
    period: string, // 'daily', 'weekly', or 'monthly'
    username: string,
    date = new Date(),
  ): Promise<ServiceResponse> {
    try {
      const player = await this.playerModel.findOne({ username }).exec();
      if (!player) return { success: false, message: 'Player not found' };

      // 1. Determine bounds based on the period string
      let bounds: { start: Date; end: Date };
      if (period === 'monthly') bounds = getMonthlyBounds(date);
      else if (period === 'weekly') bounds = getWeeklyBounds(date);
      else bounds = getDayBounds(date);

      const { start, end } = bounds;

      // 2. Filter snapshots within those bounds
      const filteredSnapshots = player.snapshots.filter((s) => {
        const time = new Date(s.timeStamp).getTime();
        return time >= start.getTime() && time <= end.getTime();
      });

      if (filteredSnapshots.length < 2) {
        return {
          success: false,
          message: `Found ${filteredSnapshots.length} snapshots for ${period}. Need at least 2.`,
        };
      }

      // 3. Sort and pick start/end points
      filteredSnapshots.sort(
        (a, b) =>
          new Date(a.timeStamp).getTime() - new Date(b.timeStamp).getTime(),
      );

      const first = filteredSnapshots[0];
      const last = filteredSnapshots[filteredSnapshots.length - 1];

      // 4. Calculate Differences
      const overallexpGained = (last.overallXp || 0) - (first.overallXp || 0);

      const skillsGained = last.skills.map((s) => {
        const firstSkill = first.skills.find((fs) => fs.name === s.name);
        return {
          name: s.name,
          xp: (s.xp || 0) - (firstSkill?.xp || 0),
          level: (s.level || 0) - (firstSkill?.level || 0),
        };
      });

      const activitiesGained = last.activities.map((a) => {
        const firstAct = first.activities.find((fa) => fa.name === a.name);
        return {
          name: a.name,
          score: firstAct ? (a.score || 0) - (firstAct.score || 0) : 0,
        };
      });

      // Use the start of the period as the unique Date Key
      const dateKey = start.toISOString().split('T')[0];

      // 5. Save to the unified Gains collection
      await this.GainsModel.findOneAndUpdate(
        { username, date: dateKey, period: period },
        {
          username,
          date: dateKey,
          period: period,
          overallXpGained: overallexpGained,
          skillsGained,
          activitiesGained,
        },
        { upsert: true, new: true },
      );

      return {
        success: true,
        message: `${period} gains calculated for ${username} (${dateKey})`,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, message: 'Database error', error: msg };
    }
  }

  // //update paramter to take in daily, weekly and monthly
  // async getGainsForGroup(
  //   // id: number,
  //   groupName: string,
  //   date = new Date(),
  // ): Promise<ServiceResponse> {
  //   try {
  //     // 1. Find the group
  //     const group = await this.groupModel.findOne({ name: groupName }).exec();
  //     if (!group) return { success: false, message: 'Group not found' };

  //     const { start, end } = getDayBounds(date);
  //     const dateKey = start.toISOString().split('T')[0];

  //     // 2. Get all usernames and fetch their Player documents from the DB
  //     const usernames = group.players.map((p) => p.username);
  //     const players = await this.playerModel
  //       .find({ username: { $in: usernames } })
  //       .exec();

  //     if (players.length === 0) {
  //       return { success: false, message: 'No players found in this group' };
  //     }

  //     // 3. Process all players in parallel using Promise.all
  //     const processingPromises = players.map(async (player) => {
  //       // Filter snapshots for this specific player
  //       const dailySnapshot = player.snapshots.filter((s) => {
  //         const time = new Date(s.timeStamp).getTime();
  //         return time >= start.getTime() && time <= end.getTime();
  //       });

  //       // Skip players who don't have enough data (prevents the whole group from failing)
  //       if (dailySnapshot.length < 2) {
  //         console.log(`Skipping ${player.username}: Not enough snapshots.`);
  //         return;
  //       }

  //       // Sort snapshots
  //       dailySnapshot.sort(
  //         (a, b) =>
  //           new Date(a.timeStamp).getTime() - new Date(b.timeStamp).getTime(),
  //       );

  //       const first = dailySnapshot[0];
  //       const last = dailySnapshot[dailySnapshot.length - 1];

  //       // Calculate Gains
  //       const overallexpGained = (last.overallXp || 0) - (first.overallXp || 0);

  //       const skillsGained = last.skills.map((s) => {
  //         const firstSkill = first.skills.find((fs) => fs.name === s.name);
  //         return {
  //           name: s.name,
  //           xpGained: (s.xp || 0) - (firstSkill?.xp || 0),
  //           levelGained: (s.level || 0) - (firstSkill?.level || 0),
  //         };
  //       });

  //       const activitiesGained = last.activities.map((a) => {
  //         const firstAct = first.activities.find((fa) => fa.name === a.name);
  //         return {
  //           name: a.name,
  //           gained: firstAct ? (a.score || 0) - (firstAct.score || 0) : 0,
  //         };
  //       });

  //       // Save to DailyGain collection
  //       return this.dailyGainModel.findOneAndUpdate(
  //         { username: player.username, date: dateKey },
  //         {
  //           username: player.username,
  //           date: dateKey,
  //           overallXpGained: overallexpGained,
  //           skillsGained,
  //           activitiesGained,
  //         },
  //         { upsert: true },
  //       );
  //     });

  //     await Promise.all(processingPromises);

  //     return {
  //       success: true,
  //       message: `Gains processed for all available members in ${groupName} for ${dateKey}`,
  //     };
  //   } catch (err: unknown) {
  //     console.error('Group Save Error:', err);
  //     const msg = err instanceof Error ? err.message : 'Unknown error';
  //     return { success: false, message: 'Database error', error: msg };
  //   }
  // }

  async getGainsForGroup(
    period: string,
    groupName: string,
    date = new Date(),
  ): Promise<ServiceResponse> {
    try {
      // <--- ADDED THIS TRY
      const group = await this.groupModel.findOne({ name: groupName }).exec();

      if (!group) {
        return {
          success: false,
          message: 'Group not found',
        };
      }

      const usernames = group.players.map((p) => p.username);

      let bounds: { start: Date; end: Date };
      if (period === 'daily') bounds = getDayBounds(date);
      else if (period === 'monthly') bounds = getMonthlyBounds(date);
      else bounds = getWeeklyBounds(date);

      const { start, end } = bounds;

      // DEBUG LOGS: Check these in your terminal!
      console.log(`Checking ${period} gains for ${groupName}`);
      console.log(`Start: ${start.toISOString()} | End: ${end.toISOString()}`);

      const results = await this.playerModel.aggregate<AggregationResult>([
        { $match: { username: { $in: usernames } } },
        {
          $project: {
            username: 1,
            filteredSnapshots: {
              $filter: {
                input: '$snapshots',
                as: 's',
                cond: {
                  $and: [
                    { $gte: [{ $toDate: '$$s.timeStamp' }, start] },
                    { $lte: [{ $toDate: '$$s.timeStamp' }, end] },
                  ],
                },
              },
            },
          },
        },
        // This is the stage that usually causes "No players had enough snapshots"
        { $match: { $expr: { $gte: [{ $size: '$filteredSnapshots' }, 2] } } },
        {
          $project: {
            username: 1,
            first: { $arrayElemAt: ['$filteredSnapshots', 0] },
            last: { $arrayElemAt: ['$filteredSnapshots', -1] },
          },
        },
      ]);

      if (!results || results.length === 0) {
        return {
          success: false,
          message: `No players had enough snapshots between ${start.toLocaleDateString()} and ${end.toLocaleDateString()}.`,
        };
      }

      const dateKey = start.toISOString().split('T')[0];
      const savePromises = results.map((res: AggregationResult) => {
        const overallXpGained =
          (res.last.overallXp || 0) - (res.first.overallXp || 0);

        const skillsGained = res.last.skills.map((s) => {
          const firstSkill = res.first.skills.find((fs) => fs.name === s.name);
          return {
            name: s.name,
            xpGained: (s.xp || 0) - (firstSkill?.xp || 0),
            levelGained: (s.level || 0) - (firstSkill?.level || 0),
          };
        });

        const activitiesGained = res.last.activities.map((a) => {
          const firstAct = res.first.activities.find(
            (fa) => fa.name === a.name,
          );
          return {
            name: a.name,
            gained: firstAct ? (a.score || 0) - (firstAct.score || 0) : 0,
          };
        });

        return this.GainsModel.findOneAndUpdate(
          { username: res.username, date: dateKey, period: period },
          {
            username: res.username,
            date: dateKey,
            period: period,
            overallXpGained,
            skillsGained,
            activitiesGained,
          },
          { upsert: true, new: true },
        );
      });

      await Promise.all(savePromises);

      return {
        success: true,
        message: `Processed gains for ${results.length} members in ${groupName} (${period})`,
      };
    } catch (err: unknown) {
      // <--- THIS NOW HAS A MATCHING TRY
      console.error('Group Aggregation Error:', err);
      return {
        success: false,
        message: 'Database error',
        error: err instanceof Error ? err.message : 'Unknown',
      };
    }
  }
}
