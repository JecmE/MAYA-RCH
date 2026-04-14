# MAYA RCH - Notas para Desarrollo

## ⚠️ IMPORTANTE: No hacer push directo a main

**Hoy casi arruinamos todo** por hacer push directo a `main` sin probar primero. Reglas:

1. **Trabajar SIEMPRE en branch `desarrollo`**
2. **Testear localmente** antes de mergear a `main`
3. **Solo mergear a main cuando todo esté verificado** en desarrollo

---

## Estructura de Branches

- `main` → producción (Azure) - SOLO merge cuando esté listo
- `desarrollo` → trabajo diario

```bash
# Trabajar en desarrollo
git checkout desarrollo
git pull origin desarrollo
# hacer cambios, testear localmente
git commit -m "tu mensaje"
git push origin desarrollo

# Cuando esté listo para producción:
git checkout main
git pull origin main
git merge origin/desarrollo
git push origin main  # ⚠️ Esto triggerea deploy a Azure
```

---

## Problemas Conocidos y Soluciones

### 1. Deploy Backend a Azure App Service

**Problema:** El `node_modules.tar.gz` de Oryx se corrompe y causa `Cannot find module '@nestjs/core'`.

**Solución temporal:** En Azure Portal → App Service → Configuration → Startup Command:

```
bash -c "cd /home/site/wwwroot/backend && node dist/main.js"
```

**Solución permanente:** El `.deployment` en `/home/site/wwwroot/.deployment` debe contener:

```
[config]
command = bash -c "cd /home/site/wwwroot/backend && npm install && npm run build && node dist/main.js"
```

### 2. Si el backend no inicia después de restart

1. Conectar a Kudu SSH: `https://mayarch.scm.centralus-01.azurewebsites.net`
2. Ejecutar manualmente:
   ```bash
   cd /home/site/wwwroot/backend && node dist/main.js
   ```
3. Verificar que la app funciona: `https://mayarch-fpc5dvefa9cycne9.centralus-01.azurewebsites.net/api/projects`

### 3. Deployment Center muestra "Failed" pero el app funciona

Es normal si el startup command deja un proceso corriendo. El app funciona aunque muestre error.

---

## URLs de Producción

- **Backend API:** https://mayarch-fpc5dvefa9cycne9.centralus-01.azurewebsites.net
- **Frontend:** https://jolly-field-0ba3cdc10.2.azurestaticapps.net

---

## Archivos Críticos en Azure

No modificar directamente en producción. Solo via deploy:

- `/home/site/wwwroot/.deployment` - comando de startup
- `/home/site/wwwroot/backend/` - código del backend
- `dist/` - código compilado

---

## Variables de Entorno (Azure App Settings)

Verificar que estén configuradas en Azure Portal:

- `DB_HOST` = `mayacrhsql.database.windows.net`
- `DB_PORT` = `1433`
- `DB_USERNAME` = `testuser`
- `DB_PASSWORD` = (密码)
- `DB_NAME` = `MAYACRHDB`
- `JWT_SECRET` = (密码)
- `JWT_EXPIRES_IN` = `24h`
- `PORT` = `3000`
- `FRONTEND_URL` = `https://jolly-field-0ba3cdc10.2.azurestaticapps.net`

---

## Workflows de GitHub Actions

### Backend: `deploy-backend.yml`

- Se ejecuta en cada push a `main`
- Build: `cd backend && npm install && npm run build`
- Deploy: usa `azure/webapps-deploy@v3`

### Frontend: `azure-static-web-apps-*.yml`

- Se ejecuta en cada push a `main`
- Build: `ng build`
- Deploy automático a Static Web Apps

### Si el deploy falla

1. **NO hacer más push hasta resolver**
2. Verificar logs en GitHub Actions
3. Si es problema de `node_modules.tar.gz`, usar Kudu para borrar y reintentar
4. Si el backend no inicia, verificar el Startup Command

---

## Testing Local

Antes de mergear a main, testear localmente:

```bash
# Backend
cd backend
npm install
npm run start:dev

# Frontend (en otra terminal)
cd frontend-o-raíz
npm install
ng serve
```

---

## Errores Comunes

### `EADDRINUSE: address already in use :::3000`

El backend ya está corriendo. En Kudu no podemos matar procesos. Reiniciar desde Azure Portal.

### `Cannot find module '@nestjs/core'`

El `node_modules.tar.gz` está corrupto. Solución: borrar y forzar rebuild.

### `nest: not found` en logs

El `.deployment` no se está usando correctamente o el `npm install` no terminó.

---

## Tips

- Si necesitas reiniciar el backend sin hacer deploy, usa Kudu SSH para ejecutar `node dist/main.js` manualmente
- El frontend se desplega automáticamente via Static Web Apps CI/CD
- Siempre verificar que el backend funciona antes de mergear cambios grandes

---

## Próximos Pasos (TODO)

- [ ] Arreglar lógica de hora de tolerancia para hora de Guatemala
- [ ] Limpiar Deployment Center (actualmente muestra error pero funciona)
- [ ] Posiblemente cambiar el deploy para que no deixe proceso corriendo
