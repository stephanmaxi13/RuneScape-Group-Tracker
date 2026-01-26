import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GroupService } from '../groups/groups.service';

@Injectable()
export class ScheduleService {
  private readonly logger = new Logger(ScheduleService.name);

  constructor(private readonly groupService: GroupService) {}

  // 1. DAILY: Runs every night at 00:00:00
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyGains() {
    this.logger.log('Starting Scheduled Task: [DAILY GAINS]');
    await this.processGroupGains('daily');
  }

  // 2. WEEKLY: Runs every Monday at 00:05:00
  // We offset by 5 mins to ensure daily tasks finish first if there is overlap
  @Cron('0 5 0 * * 1')
  async handleWeeklyGains() {
    this.logger.log('Starting Scheduled Task: [WEEKLY GAINS]');
    await this.processGroupGains('weekly');
  }

  // 3. MONTHLY: Runs at 00:10:00 on the 1st day of every month
  @Cron('0 10 0 1 * *')
  async handleMonthlyGains() {
    this.logger.log('Starting Scheduled Task: [MONTHLY GAINS]');
    await this.processGroupGains('monthly');
  }

  /**
   * Helper to process all groups (Addressing your Discord TODO)
   */
  private async processGroupGains(period: 'daily' | 'weekly' | 'monthly') {
    try {
      // In the future, fetch these from your GroupModel:
      // const groups = await this.groupModel.find().exec();
      const groupNames = ['Chunky Seal'];

      for (const name of groupNames) {
        const result = await this.groupService.getGainsForGroup(name, period);
        if (!result.success) {
          this.logger.warn(
            `Failed ${period} update for ${name}: ${result.message}`,
          );
        }
      }
      this.logger.log(`Completed ${period} updates.`);
    } catch (err) {
      this.logger.error(`Error during ${period} cron execution:`, err);
    }
  }
}
