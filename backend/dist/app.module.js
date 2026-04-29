"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const attendance_module_1 = require("./modules/attendance/attendance.module");
const leaves_module_1 = require("./modules/leaves/leaves.module");
const projects_module_1 = require("./modules/projects/projects.module");
const timesheets_module_1 = require("./modules/timesheets/timesheets.module");
const kpi_module_1 = require("./modules/kpi/kpi.module");
const reports_module_1 = require("./modules/reports/reports.module");
const admin_module_1 = require("./modules/admin/admin.module");
const payroll_module_1 = require("./modules/payroll/payroll.module");
const notices_module_1 = require("./modules/notices/notices.module");
const mail_module_1 = require("./modules/mail/mail.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => ({
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
                inject: [config_1.ConfigService],
            }),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            attendance_module_1.AttendanceModule,
            leaves_module_1.LeavesModule,
            projects_module_1.ProjectsModule,
            timesheets_module_1.TimesheetsModule,
            kpi_module_1.KpiModule,
            reports_module_1.ReportsModule,
            admin_module_1.AdminModule,
            payroll_module_1.PayrollModule,
            notices_module_1.NoticesModule,
            mail_module_1.MailModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map