import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

// Import các module của mày ở đây, ví dụ:
// import { UsersModule } from './users/users.module';

@Module({
  imports: [
    // 1. Cấu hình ConfigModule (để sau này dùng .env)
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // 2. Cấu hình TypeORM (phần quan trọng nhất)
    TypeOrmModule.forRoot({
      type: 'postgres', // Loại CSDL
      host: 'postgresql.toolhub.app', // IP thầy cung cấp
      port: 5432, // Port thầy cung cấp
      username: 'duongnlq', // Username thầy cung cấp
      password: '20210242', // Password thầy cung cấp
      database: 'Clinic_Duong', // Database thầy cung cấp

      // Tự động load tất cả các file .entity.ts (hoặc .js)
      entities: [__dirname + '/**/*.entity{.ts,.js}'],

      // Tự động tạo/cập nhật bảng CSDL dựa trên Entity
      // **QUAN TRỌNG:** Chỉ dùng 'true' khi phát triển (dev).
      // Khi deploy (production) phải để 'false'.
      synchronize: true,
    }),

    // 3. Import các module tính năng của mày (User, Doctor, Clinic...)
    // UsersModule, // (Khi nào mày tạo thì bỏ comment)
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
