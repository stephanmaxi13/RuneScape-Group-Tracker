import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { GroupService } from './groups.service';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupService) {}
  @Get('get-group-id')
  getGroupId(@Query('groupName') groupName: string) {
    return this.groupsService.getGroupId(groupName);
  }
  @Get('get-group-gains')
  getGainsForGroup(
    @Query('period') period: string,
    @Query('groupName') groupName: string,
    @Query('date') date: string,
  ) {
    return this.groupsService.getGainsForGroup(
      period,
      groupName,
      date ? new Date(date) : new Date(),
    );
  }

  @Post('create-group')
  createGroup(@Query('groupName') groupName: string) {
    return this.groupsService.createGroup(groupName);
  }
  @Post('add-members-to-group')
  AddMembersToGroup(
    @Query('groupName') groupName: string,
    @Body() body: { groupMembers: string[] },
  ) {
    return this.groupsService.AddMembersToGroup(groupName, body.groupMembers);
  }
  @Get('group-rankings')
  getGroupRankings(
    @Query('period') period: string,
    @Query('groupName') groupName: string,
  ) {
    return this.groupsService.getGroupRankings(groupName, period);
  }
}
