import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GroupService } from 'src/groups/groups.service';

@Injectable()
export class ScheduleService {
  private readonly logger = new Logger(ScheduleService.name);
  constructor(private readonly groupService: GroupService) {}

  //TODO: When I create the discord intergation started i need a way to get make sure that the bot saves the group name and then i can input
  //It into the paramaters of the cron jobs

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyGainsUpdate() {
    this.logger.log('Executing Scheduled Daily Gains Update...');

    try {
      const groupName = 'Chunky Seal;';

      const result = await this.groupService.getGainsForGroup(
        'daily',
        groupName,
      );

      if (result) {
        this.logger.log(`Successfully updated gains for group: ${groupName}`);
      } else {
        this.logger.warn(`Update failed for ${groupName}`);
      }
    } catch (err) {
      this.logger.error(
        'CRITICAL: Cron job failed with an exception',
        err instanceof Error ? err.stack : err,
      );
    }
  }
}
