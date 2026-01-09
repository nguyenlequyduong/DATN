# ClinicBook - Hệ thống đặt lịch phòng khám

Hệ thống quản lý và đặt lịch khám bệnh tại phòng khám, được phát triển cho đồ án tốt nghiệp.

## 📋 Tổng quan

ClinicBook là một ứng dụng web full-stack cho phép:

- **Bệnh nhân**: Tìm kiếm bác sĩ, đặt lịch hẹn, quản lý lịch khám
- **Bác sĩ**: Quản lý lịch làm việc, xem danh sách bệnh nhân, cập nhật trạng thái cuộc hẹn
- **Admin bệnh viện**: Quản lý bác sĩ, cấu hình lịch làm việc, quản lý lịch hẹn, danh mục dịch vụ
- **Super Admin**: Quản lý toàn bộ phòng khám trong hệ thống, cấu hình hệ thống

## 🏗️ Kiến trúc hệ thống

Project được chia thành 2 phần chính:

```
datn/
├── frontend-clinic-app/    # Frontend (React + TypeScript)
└── backend-clinic-app/     # Backend (NestJS + TypeScript)
```

## 🛠️ Công nghệ sử dụng

### Frontend

- **React 19** - UI Framework
- **TypeScript** - Type safety
- **Vite** - Build tool & Dev server
- **Material-UI (MUI)** - Component library
- **React Router** - Routing
- **Context API** - State management (Authentication)

### Backend

- **NestJS** - Node.js framework
- **TypeScript** - Type safety
- **TypeORM** - ORM cho database
- **PostgreSQL** - Database
- **Swagger** - API documentation
- **JWT** - Authentication (đang phát triển)

## 📁 Cấu trúc project

### Frontend (`frontend-clinic-app/`)

```
src/
├── App.tsx          # Component chính, chứa toàn bộ logic routing và layouts
├── main.tsx         # Entry point
├── App.css          # Global styles
└── index.css        # Base styles
```

**Tính năng Frontend:**

- Authentication với mock data (đang chờ tích hợp backend)
- 4 layouts riêng biệt cho từng role
- Responsive design với Material-UI
- Routing và navigation

### Backend (`backend-clinic-app/`)

```
src/
├── main.ts              # Entry point, cấu hình Swagger & CORS
├── app.module.ts        # Root module, cấu hình TypeORM
├── users/
│   └── entities/
│       └── user.entity.ts  # User entity
└── ...
```

**Tính năng Backend:**

- RESTful API với NestJS
- TypeORM integration với PostgreSQL
- Swagger API documentation tại `/api-docs`
- CORS enabled cho frontend

## 🚀 Cài đặt và chạy

### Yêu cầu

- Node.js >= 18.x
- PostgreSQL (hoặc sử dụng database remote đã cấu hình)
- npm hoặc yarn

### Backend

```bash
cd backend-clinic-app
npm install
npm run start:dev
```

Backend sẽ chạy tại: `http://localhost:3000`
API Documentation: `http://localhost:3000/api-docs`

**Cấu hình Database:**
Database đã được cấu hình trong `app.module.ts`:

- Host: `postgresql.toolhub.app`
- Port: `5432`
- Database: `Clinic_Duong`

### Frontend

```bash
cd frontend-clinic-app
npm install
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:5173` (hoặc port khác nếu 5173 bận)

## 🔐 Authentication

Hiện tại frontend đang sử dụng **mock authentication** để test UI.

**Test accounts (mock):**

- Username: `patient` → Role: Bệnh nhân
- Username: `doctor` → Role: Bác sĩ
- Username: `admin` → Role: Admin bệnh viện
- Username: `superadmin` → Role: Super Admin

**Lưu ý:** Password không được kiểm tra trong mock mode.

## 📝 Các tính năng chính

### 👤 Bệnh nhân (Patient)

- Trang chủ với tìm kiếm nhanh
- Tìm kiếm bác sĩ/chuyên khoa
- Xem và quản lý lịch hẹn
- Chatbot AI hỗ trợ

### 👨‍⚕️ Bác sĩ (Doctor)

- Dashboard xem lịch hẹn theo ngày/tuần
- Quản lý trạng thái cuộc hẹn (hoàn thành, không đến, đã hủy)
- Quản lý lịch cá nhân (mở/đóng slot)

### 🏥 Admin bệnh viện (Admin Hospital)

- Dashboard với thống kê nhanh
- Quản lý hồ sơ phòng khám
- Quản lý bác sĩ (thêm, sửa, xóa)
- Cấu hình lịch làm việc cho bác sĩ
- Quản lý danh mục (chuyên khoa, dịch vụ)
- Quản lý lịch hẹn (xác nhận, hủy, xếp lại)

### 🔧 Super Admin

- Tổng quan hệ thống
- Quản lý phòng khám (duyệt, khóa)
- Cấu hình hệ thống (flags, permissions)

## 🔄 Trạng thái phát triển

### ✅ Đã hoàn thành

- [x] Frontend UI cho tất cả các role
- [x] Mock authentication
- [x] Routing và navigation
- [x] Backend setup với NestJS
- [x] Database connection với PostgreSQL
- [x] User entity
- [x] Swagger documentation

### 🚧 Đang phát triển

- [ ] Backend authentication (JWT)
- [ ] API endpoints cho các tính năng
- [ ] Kết nối Frontend với Backend API
- [ ] Database entities đầy đủ (Doctor, Appointment, Clinic, etc.)

### 📋 Kế hoạch

- [ ] Tích hợp payment gateway
- [ ] Email notifications
- [ ] Real-time notifications
- [ ] Mobile app (tùy chọn)

## 📚 API Documentation

Khi backend chạy, truy cập Swagger UI tại:

```
http://localhost:3000/api-docs
```

## 🗄️ Database Schema

### User Entity

```typescript
- id: UUID (Primary Key)
- email: string (Unique)
- fullName: string
- passwordHash: string
- phoneNumber: string (Optional)
- createdAt: Date
```

**Lưu ý:** Các entity khác (Doctor, Appointment, Clinic, etc.) đang được phát triển.

## 🧪 Testing

### Backend

```bash
cd backend-clinic-app
npm run test          # Unit tests
npm run test:e2e      # E2E tests
npm run test:cov      # Coverage
```

### Frontend

```bash
cd frontend-clinic-app
npm run lint          # Lint code
```

## 📦 Build cho Production

### Backend

```bash
cd backend-clinic-app
npm run build
npm run start:prod
```

### Frontend

```bash
cd frontend-clinic-app
npm run build
# Output sẽ ở thư mục dist/
```

## 🔧 Cấu hình

### Environment Variables

**Backend** - Tạo file `.env` trong `backend-clinic-app/`:

```env
PORT=3000
DATABASE_HOST=postgresql.toolhub.app
DATABASE_PORT=5432
DATABASE_USERNAME=duongnlq
DATABASE_PASSWORD=20210242
DATABASE_NAME=Clinic_Duong
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
```

**Frontend** - Tạo file `.env` trong `frontend-clinic-app/`:

```env
VITE_API_URL=http://localhost:3000
```

## 🤝 Đóng góp

Đây là đồ án tốt nghiệp, mọi thay đổi và cải tiến đều được chào đón!

## 📄 License

UNLICENSED - Đồ án tốt nghiệp

## 👤 Tác giả

Được phát triển bởi sinh viên thực hiện đồ án tốt nghiệp.

---

**Lưu ý:** Project đang trong giai đoạn phát triển. Một số tính năng có thể chưa hoàn thiện hoặc đang sử dụng mock data.
