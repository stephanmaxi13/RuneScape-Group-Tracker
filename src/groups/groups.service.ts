import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Group, GroupDocument } from './schemas/group.schema';
import { Gains, GainsDocument } from './schemas/gains.schema';
import { PlayerDocument } from 'src/players/schemas/player.schema';
import { PlayersService } from '../players/players.service';
import {
  getDayBounds,
  getMonthlyBounds,
  getWeeklyBounds,
} from 'src/common/utils/date.utils';

interface SkillSnapshot {
  name: string;
  xp: number;
  level: number;
}

interface ActivitySnapshot {
  name: string;
  score: number; // Finished this property
}

export interface AggregationResult {
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

@Injectable()
export class GroupService {
  constructor(
    private readonly httpService: HttpService,
    @InjectModel(Group.name)
    private readonly groupModel: Model<GroupDocument>,
    @InjectModel(Gains.name)
    private readonly GainsModel: Model<GainsDocument>,
    private readonly playerService: PlayersService,
  ) {}
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

      // 1. Use the NEW service method (this clears the .find red line)
      const players: PlayerDocument[] =
        await this.playerService.findManyByNames(groupMembers);

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

  async getGainsForGroup(
    period: string,
    groupName: string,
    date = new Date(),
  ): Promise<ServiceResponse> {
    try {
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

      const results: AggregationResult[] =
        await this.playerService.aggregatePlayers([
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
