import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ApiKeyGuard } from './auth/api-key.guard';
import { AssistantsModule } from './assistants/assistants.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { UsageModule } from './usage/usage.module';
import { ResponseInterceptor } from './common/response.interceptor';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    AssistantsModule,
    ApiKeysModule,
    UsageModule,
  ],
  providers: [
    // API-key auth is applied to every route by default. Routes decorated with
    // @Public() opt out (see UsageController's internal /usage/log endpoint).
    { provide: APP_GUARD, useClass: ApiKeyGuard },
    // Every response is wrapped in { data, message, timestamp }.
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
  ],
})
export class AppModule {}
