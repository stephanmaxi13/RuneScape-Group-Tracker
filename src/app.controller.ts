import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { AppService } from './app.service';
import type { Request } from 'express';
import { get } from 'axios';
import * as playerSchema from './users/schemas/player.schema';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get('get-player')
  getPlayerXp(@Query('username') username: string) {
    console.info("test");
    return this.appService.fetchAndUpsertPlayer(username);
  }

  @Get('get-group-id')
    getGroupId(@Query('groupName') groupName: string, ) {
    return this.appService.getGroupId(groupName);
  }

  @Post('create-group')
  createGroup(@Query('groupName') groupName: string) {
    return this.appService.createGroup(groupName);
  }
  @Post('add-members-to-group')
  AddMembersToGroup(@Query('groupName') groupName: string,@Body() body: { groupMembers: string[] }) {
    return this.appService.AddMembersToGroup(groupName, body.groupMembers);
  }
}
