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
      useFactory: (configService: ConfigService) => ({
        type: 'mssql',
        host: configService.get('DB_HOST', 'mayacrhsql.database.windows.net'),
        port: parseInt(configService.get('DB_PORT', '1433'), 10),
        database: configService.get('DB_NAME', 'MAYACRHDB'),
        username: configService.get('DB_USERNAME', 'testuser'),
        password: configService.get('DB_PASSWORD', 'Te5t!User_Abc123'),
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
