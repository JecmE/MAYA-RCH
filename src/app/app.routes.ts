import { Routes } from '@angular/router';
import { RootLayout } from './layouts/root-layout/root-layout';

import { Login } from './pages/login/login';
import { ForgotPassword } from './pages/forgot-password/forgot-password';
import { Dashboard } from './pages/dashboard/dashboard';
import { KpiDashboard } from './pages/kpi-dashboard/kpi-dashboard';
import { Asistencia } from './pages/asistencia/asistencia';
import { Solicitudes } from './pages/solicitudes/solicitudes';
import { Timesheet } from './pages/timesheet/timesheet';
import { Boleta } from './pages/boleta/boleta';
import { Perfil } from './pages/perfil/perfil';

import { BandejaPendientes } from './pages/supervisor/bandeja-pendientes/bandeja-pendientes';
import { AsistenciaEquipo } from './pages/supervisor/asistencia-equipo/asistencia-equipo';
import { TimesheetEquipo } from './pages/supervisor/timesheet-equipo/timesheet-equipo';
import { KpiEquipo } from './pages/supervisor/kpi-equipo/kpi-equipo';

import { Empleados } from './pages/rrhh/empleados/empleados';
import { Planilla } from './pages/rrhh/planilla/planilla';
import { Turnos } from './pages/rrhh/turnos/turnos';
import { AsistenciaGeneral } from './pages/rrhh/asistencia-general/asistencia-general';
import { PermisosVacaciones } from './pages/rrhh/permisos-vacaciones/permisos-vacaciones';
import { Proyectos } from './pages/rrhh/proyectos/proyectos';
import { KpisGlobales } from './pages/rrhh/kpis-globales/kpis-globales';
import { BonosIncentivos } from './pages/rrhh/bonos-incentivos/bonos-incentivos';
import { Reportes } from './pages/rrhh/reportes/reportes';
import { AuditoriaFuncional } from './pages/rrhh/auditoria-funcional/auditoria-funcional';

import { Usuarios } from './pages/admin/usuarios/usuarios';
import { RolesPermisos } from './pages/admin/roles-permisos/roles-permisos';
import { ParametrosGlobales } from './pages/admin/parametros-globales/parametros-globales';
import { AuditoriaLogs } from './pages/admin/auditoria-logs/auditoria-logs';
import { Seguridad } from './pages/admin/seguridad/seguridad';
import { SoporteMantenimiento } from './pages/admin/soporte-mantenimiento/soporte-mantenimiento';

export const appRoutes: Routes = [
  { path: 'login', component: Login },
  { path: 'forgot-password', component: ForgotPassword },

  {
    path: '',
    component: RootLayout,
    children: [
      { path: '', component: Dashboard },
      { path: 'kpi', component: KpiDashboard },
      { path: 'asistencia', component: Asistencia },
      { path: 'solicitudes', component: Solicitudes },
      { path: 'timesheet', component: Timesheet },
      { path: 'boleta', component: Boleta },
      { path: 'perfil', component: Perfil },

      { path: 'supervisor/pendientes', component: BandejaPendientes },
      { path: 'supervisor/asistencia', component: AsistenciaEquipo },
      { path: 'supervisor/timesheet', component: TimesheetEquipo },
      { path: 'supervisor/kpi', component: KpiEquipo },

      { path: 'rrhh/empleados', component: Empleados },
      { path: 'rrhh/planilla', component: Planilla },
      { path: 'rrhh/turnos', component: Turnos },
      { path: 'rrhh/asistencia', component: AsistenciaGeneral },
      { path: 'rrhh/permisos', component: PermisosVacaciones },
      { path: 'rrhh/proyectos', component: Proyectos },
      { path: 'rrhh/kpis', component: KpisGlobales },
      { path: 'rrhh/bonos', component: BonosIncentivos },
      { path: 'rrhh/reportes', component: Reportes },
      { path: 'rrhh/auditoria', component: AuditoriaFuncional },

      { path: 'admin/usuarios', component: Usuarios },
      { path: 'admin/roles', component: RolesPermisos },
      { path: 'admin/parametros', component: ParametrosGlobales },
      { path: 'admin/auditoria', component: AuditoriaLogs },
      { path: 'admin/seguridad', component: Seguridad },
      { path: 'admin/soporte', component: SoporteMantenimiento }
    ]
  },

  { path: '**', redirectTo: '' }
];