import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CategoriesModule } from './categories/categories.module';
import { PlacesModule } from './places/places.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        const isProduction = cfg.get('NODE_ENV') === 'production';
        return {
          type: 'postgres',
          host: cfg.get('DB_HOST', 'localhost'),
          port: cfg.get<number>('DB_PORT', 5432),
          username: cfg.get('DB_USERNAME'),
          password: cfg.get('DB_PASSWORD', ''),
          database: cfg.get('DB_DATABASE', 'mini2gis'),
          autoLoadEntities: true,
          synchronize: true,
          ssl: isProduction ? { rejectUnauthorized: false } : false,
          extra: isProduction ? { family: 4 } : {},
        };
      },
    }),
    UsersModule,
    AuthModule,
    CategoriesModule,
    PlacesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
