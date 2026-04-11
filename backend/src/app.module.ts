import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { LeavesModule } from './modules/leaves/leaves.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { TimesheetsModule } from './modules/timesheets/timesheets.module';
import { KpiModule } from './modules/kpi/kpi.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AdminModule } from './modules/admin/admin.module';
import { PayrollModule } from './modules/payroll/payroll.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: () => ({
        type: 'mssql',
        host: 'mayacrhsql.database.windows.net',
        port: 1433,
        database: 'MAYACRHDB',
        username: 'testuser',
        password: 'Te5t!User_Abc123',
        options: {
          encrypt: true,
          trustServerCertificate: false,
          connectionTimeout: 30000,
        },
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    AttendanceModule,
    LeavesModule,
    ProjectsModule,
    TimesheetsModule,
    KpiModule,
    ReportsModule,
    AdminModule,
    PayrollModule,
  ],
})
export class AppModule {}
