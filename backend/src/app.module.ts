import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { GuardModule } from './modules/guard/guard.module';
import { ClientModule } from './modules/client/client.module';
import { SiteModule } from './modules/site/site.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { PatrolModule } from './modules/patrol/patrol.module';
import { IncidentModule } from './modules/incident/incident.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReportsModule } from './modules/reports/reports.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }),
    DatabaseModule,
    AuthModule,
    GuardModule,
    ClientModule,
    SiteModule,
    AttendanceModule,
    PatrolModule,
    IncidentModule,
    NotificationsModule,
    ReportsModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
