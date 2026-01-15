import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Player, PlayerDocument } from './users/schemas/player.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Group, GroupDocument } from './users/schemas/group.schema';
import {
  DailyGain,
  DailyGainDocument,
} from './users/schemas/daily-gains.schema';

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

function getDayBounds(date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 9999);

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
    @InjectModel(DailyGain.name)
    private readonly dailyGainModel: Model<DailyGainDocument>,
  ) {}

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
      const updatedPlayer = await this.playerModel.findOneAndUpdate(
        { username: playerName },
        {
          username: playerName,
          overallLevel: responseData.level,
          overallXp: responseData.xp,
          skills: responseData.skills,
          activities: responseData.activities,
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        },
      );

      if (!updatedPlayer) {
        throw new Error('Failed to create or update player');
      }

      //Snapshot Logic
      const snapshot = {
        timeStamp: new Date(),
        overallLevel: updatedPlayer.overallLevel,
        overallXp: updatedPlayer.overallXp,
        skills: updatedPlayer.skills,
        activities: updatedPlayer.activities,
      };

      await this.playerModel.findByIdAndUpdate(updatedPlayer._id, {
        $push: { snapshots: snapshot },
      });

      return {
        success: true,
        message: 'Player upserted successfully',
        player: updatedPlayer,
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Database error:', errorMessage);
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

  async getDailyGains(
    username: string,
    date = new Date(),
  ): Promise<ServiceResponse> {
    try {
      const player = await this.playerModel.findOne({ username }).exec();
      if (!player) return { success: false, message: 'Player not found' };

      const { start, end } = getDayBounds(date);

      // 1. Correct filter with getTime() for reliability
      const dailySnapshot = player.snapshots.filter((s) => {
        const time = new Date(s.timeStamp).getTime();
        return time >= start.getTime() && time <= end.getTime();
      });

      if (dailySnapshot.length < 2) {
        return {
          success: false,
          message: 'Need at least 2 snapshots for this day',
        };
      }

      // 2. Sort correctly using the full timestamp
      dailySnapshot.sort(
        (a, b) =>
          new Date(a.timeStamp).getTime() - new Date(b.timeStamp).getTime(),
      );

      const first = dailySnapshot[0];
      const last = dailySnapshot[dailySnapshot.length - 1];

      // 3. Calculate gains
      const overallexpGained = last.overallXp - first.overallXp;

      const skillsGained = last.skills.map((s) => {
        const firstSkill = first.skills.find((fs) => fs.name === s.name);
        return {
          name: s.name,
          xpGained: firstSkill ? s.xp - firstSkill.xp : 0,
          levelGained: firstSkill ? s.level - firstSkill.level : 0,
        };
      });

      const activitiesGained = last.activities.map((a) => {
        const firstAct = first.activities.find((fa) => fa.name === a.name);
        return {
          name: a.name,
          gained: firstAct ? a.score - firstAct.score : 0,
        };
      });

      // 4. Upsert the gain record
      const dateKey = start.toISOString().split('T')[0];
      await this.dailyGainModel.findOneAndUpdate(
        { username, date: dateKey }, // Ensure this matches your DailyGain schema 'date' field
        {
          username,
          date: dateKey,
          overallXpGained: overallexpGained,
          skillsGained,
          activitiesGained,
        },
        { upsert: true, new: true },
      );

      return { success: true, message: `Gains saved for ${dateKey}` };
    } catch (err: unknown) {
      console.error(
        'Database error:',
        err instanceof Error ? err.message : 'unkown error',
      );
      return {
        success: false,
        message: 'Database error',
        error: 'Could no create gain record',
      };
    }
  }
}
