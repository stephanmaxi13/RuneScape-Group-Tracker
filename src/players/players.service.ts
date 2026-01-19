import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { firstValueFrom } from 'rxjs';
import { Player, PlayerDocument } from './schemas/player.schema';
import {
  OSRS_SKILLS,
  OSRS_ACTIVITIES,
} from '../common/constants/osrs.constants';
import { ServiceResponse } from '../groups/groups.service';
import {
  getMonthlyBounds,
  getWeeklyBounds,
  getDayBounds,
} from 'src/common/utils/date.utils';
import { Gains, GainsDocument } from 'src/groups/schemas/gains.schema';
import { AggregationResult } from '../groups/groups.service';

// Define these interfaces so TypeScript knows what the data looks like
interface RawSkill {
  rank: number;
  level: number;
  xp: number;
}

interface RawActivity {
  score: number;
  rank: number;
}

export interface PlayerResponse {
  success: boolean;
  message: string;
  player?: PlayerDocument;
  error?: string;
}

interface RuneScapeApiResponse {
  level: number;
  xp: number;
  skills: RawSkill[];
  activities: RawActivity[];
}

@Injectable()
export class PlayersService {
  constructor(
    private readonly httpService: HttpService,
    @InjectModel(Player.name)
    private readonly playerModel: Model<PlayerDocument>,
    @InjectModel(Gains.name)
    private readonly gainsModel: Model<GainsDocument>,
  ) {}

  async fetchAndUpsertPlayer(playerName: string): Promise<PlayerResponse> {
    if (!playerName) {
      return { success: false, message: 'Username is required' };
    }

    // Normalize for consistent DB searching
    const normalizedName = playerName.toLowerCase();
    const url = `https://secure.runescape.com/m=hiscore_oldschool/index_lite.json?player=${playerName}`;

    let responseData: RuneScapeApiResponse;
    try {
      const response = await firstValueFrom(
        this.httpService.get<RuneScapeApiResponse>(url),
      );
      responseData = response.data;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to fetch RuneScape API:', errorMessage);
      return { success: false, message: 'Failed to fetch RuneScape hiscores' };
    }

    try {
      // 1. Map skills with names from our new constants file
      const mappedSkills = responseData.skills.map(
        (skill: RawSkill, index: number) => ({
          name: OSRS_SKILLS[index] || `Unknown_Skill_${index}`,
          rank: skill.rank,
          level: skill.level,
          xp: skill.xp,
        }),
      );

      // 2. Map Activities
      const mappedActivities = responseData.activities.map(
        (act: RawActivity, index: number) => ({
          name: OSRS_ACTIVITIES[index] || `Unknown_Activity_${index}`,
          score: act.score,
          rank: act.rank,
        }),
      );

      // 3. Prepare the snapshot
      const newSnapshot = {
        timeStamp: new Date(),
        overallLevel: responseData.level,
        overallXp: responseData.xp,
        skills: mappedSkills,
        activities: mappedActivities,
      };

      // 4. Update player AND push snapshot
      const updatedPlayer = await this.playerModel.findOneAndUpdate(
        { username: normalizedName },
        {
          $set: {
            username: normalizedName,
            overallLevel: responseData.level,
            overallXp: responseData.xp,
            skills: mappedSkills,
            activities: mappedActivities,
          },
          $push: { snapshots: newSnapshot },
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

  async getGains(
    period: string, // 'daily', 'weekly', or 'monthly'
    username: string,
    date = new Date(),
  ): Promise<ServiceResponse> {
    try {
      const player = await this.findByName(username);
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
      await this.gainsModel.findOneAndUpdate(
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

  // Helper method for the AppService to use later
  async findByName(username: string): Promise<PlayerDocument | null> {
    return this.playerModel
      .findOne({
        username: { $regex: new RegExp(`^${username}$`, 'i') },
      })
      .exec();
  }
  //Testing
  async findManyByNames(usernames: string[]): Promise<PlayerDocument[]> {
    return this.playerModel
      .find({
        username: { $in: usernames.map((u) => u.toLowerCase()) },
      })
      .exec();
  }
  async aggregatePlayers(pipeline: any[]): Promise<AggregationResult[]> {
    return this.playerModel.aggregate<AggregationResult>(pipeline).exec();
  }
}
