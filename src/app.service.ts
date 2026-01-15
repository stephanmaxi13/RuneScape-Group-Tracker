import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Player, PlayerDocument } from './users/schemas/player.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Group, GroupDocument } from './users/schemas/group.schema';

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
export class AppService {
  constructor(
    private readonly httpService: HttpService,
    @InjectModel(Player.name) private readonly playerModel: Model<PlayerDocument>,
    @InjectModel(Group.name) private readonly groupModel: Model<GroupDocument>
  ) { }

  async fetchAndUpsertPlayer(playerName: string): Promise<PlayerResponse> {
    if (!playerName) {
      return { success: false, message: 'Username is required' };
    }

    const url = `https://secure.runescape.com/m=hiscore_oldschool/index_lite.json?player=${playerName}`;
    // Getting Player Data from ruenscape api then creating a player to the database
    let responseData: { level: number; xp: number; skills: any[]; activities: any[]; };
    try {
      responseData = await firstValueFrom(
        this.httpService.get(url)
      ).then(res => res.data);
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

      await this.playerModel.findByIdAndUpdate(
        updatedPlayer._id,
        { $push: { snapshots: snapshot } },
      );


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
        groupId: group.id  // .id is a built-in getter that returns the string version
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
      return { success: false, message: 'Database error', error: 'Group already exists' };
    }
  }

  async AddMembersToGroup(groupName: string, groupMembers: string[]): Promise<ServiceResponse> {

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
          message: "Group not found"
        }
      }

      const players = await this.playerModel.find({ username: { $in: groupMembers } }).exec();

      if (players.length === 0) {
        return { success: false, message: 'No matching players found' };
      }


      const existingUsername = group.players.map(p => p.username);
      const newPlayers = players.filter(p => !existingUsername.includes(p.username));

      group.players.push(...newPlayers);
      await group.save()

      // FIX: Must return a ServiceResponse
      return { success: true, message: `${newPlayers.length} members added successfully` };
    } catch (err: unknown) {
      console.error('Database error:', err instanceof Error ? err.message : "unkown error");
      return { success: false, message: 'Database error', error: "Could not find group members" }
    }
  }

}