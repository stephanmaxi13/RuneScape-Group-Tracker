import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Player, PlayerDocument, PlayerSchema } from './users/schemas/player.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Group, GroupDocument } from './users/schemas/group.schema';
import { Snapshot, snapshotDocument } from './users/schemas/snapshot.schema';

@Injectable()
export class AppService {
  constructor(
    private readonly httpService: HttpService,
    @InjectModel(Player.name) private readonly playerModel: Model<PlayerDocument>,
    @InjectModel(Group.name) private readonly groupModel: Model<GroupDocument>,
    @InjectModel(Snapshot.name) private readonly snapShotModel: Model<snapshotDocument>
  ) { }

  async fetchAndUpsertPlayer(playerName: string): Promise<any> {
    if (!playerName) {
      return { success: false, message: 'Username is required' };
    }

    const url = `https://secure.runescape.com/m=hiscore_oldschool/index_lite.json?player=${playerName}`;
    // Getting Player Data from ruenscape api then creating a player to the database
    let responseData;
    try {
      responseData = await firstValueFrom(
        this.httpService.get(url)
      ).then(res => res.data);
    } catch (err) {
      console.error('Failed to fetch RuneScape API:', err.message);
      return { success: false, message: 'Failed to fetch RuneScape hiscores' };
    }

    const existingPlayer = await this.playerModel.findOne({ username: playerName })


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


    //Snapshot Logic
    const snapshot = {
      timeStamp: new Date(),
      overallLevel: updatedPlayer.overallLevel,
      overallXp: updatedPlayer.overallXp,
      skills: updatedPlayer.skills,
      activities: updatedPlayer.activities,
    };

    await this.playerModel.findByIdAndUpdate(
      { _id: updatedPlayer._id },
      { $push: { snapshots: snapshot } },
    );


      return {
        success: true,
        message: 'Player upserted successfully',
        player: updatedPlayer,
      };
    } catch (err) {
      console.error('Database error:', err.message);
      return { success: false, message: 'Database error', error: err.message };
    }
  }

  async getGroupId(groupName: string): Promise<any> {
    if (!groupName) {
      return { success: false, message: 'group name is required' };
    }

    try {
      const group = await this.groupModel.findOne({ name: groupName }).exec();
      if (!group) {
        return { success: false, message: 'Group not found' };
      }

      return { success: true, groupId: group._id };
    } catch (err) {
      console.error('Database error:', err.message);
      return { success: false, message: 'Database error', error: err.message };
    }
  }

  async createGroup(groupName: string): Promise<any> {
    if (!groupName) {
      return { success: false, message: 'Group name is required' };
    }

    try {
      const group = await this.groupModel.create({ name: groupName, players: [] })

      return {
        success: true,
        message: 'Group Create successfully',
      }
    } catch (err) {
      console.error('Database error:', err.message);
      return { sucess: false, message: 'Database error', error: "Group already exists" }
    }
  }

  async AddMembersToGroup(groupName: string, groupMembers: string[]): Promise<any> {

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
      group.save();


    } catch (err) {
      console.error('Database error:', err.message);
      return { sucess: false, message: 'Database error', error: "Could not find group members" }
    }
  }

}