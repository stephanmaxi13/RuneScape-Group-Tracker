import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { PlayerResponse, GroupResponse, ServiceResponse } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('get-player')
  getPlayerXp(@Query('username') username: string): Promise<PlayerResponse> {
    console.info('test');
    return this.appService.fetchAndUpsertPlayer(username);
  }

  @Get('get-group-id')
  getGroupId(@Query('groupName') groupName: string): Promise<GroupResponse> {
    return this.appService.getGroupId(groupName);
  }

  @Get('get-daily-gain')
  getDailyGains(
    @Query('username') username: string,
    @Query('date') date: string,
  ): Promise<ServiceResponse> {
    return this.appService.getDailyGains(
      username,
      date ? new Date(date) : new Date(),
    );
  }

  @Post('create-group')
  createGroup(@Query('groupName') groupName: string): Promise<ServiceResponse> {
    return this.appService.createGroup(groupName);
  }
  @Post('add-members-to-group')
  AddMembersToGroup(
    @Query('groupName') groupName: string,
    @Body() body: { groupMembers: string[] },
  ): Promise<ServiceResponse> {
    return this.appService.AddMembersToGroup(groupName, body.groupMembers);
  }
}
