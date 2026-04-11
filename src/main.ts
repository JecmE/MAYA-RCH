import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { appConfig } from './app/app.config';

console.log('main.ts: STARTING bootstrap');
console.log('main.ts: appConfig providers:', appConfig.providers.length);

bootstrapApplication(App, appConfig).catch((err) =>
  console.error('main.ts: BOOTSTRAP ERROR:', err),
);

console.log('main.ts: AFTER bootstrapApplication call');
