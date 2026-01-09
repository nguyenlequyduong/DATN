# GIẢI THÍCH TỔNG QUAN FILE App.tsx

## 📋 MỤC LỤC
1. [Cấu trúc tổng quan](#1-cấu-trúc-tổng-quan)
2. [Luồng hoạt động chính](#2-luồng-hoạt-động-chính)
3. [Chi tiết từng phần](#3-chi-tiết-từng-phần)
4. [Sơ đồ luồng dữ liệu](#4-sơ-đồ-luồng-dữ-liệu)

---

## 1. CẤU TRÚC TỔNG QUAN

File `App.tsx` được chia thành **5 phần chính**:

```
App.tsx
├── 🎨 PHẦN 1: Setup & Configuration (dòng 1-77)
│   ├── Imports (React, MUI, Icons)
│   ├── Theme Configuration (màu sắc, font chữ)
│   └── Type Definitions (TypeScript types)
│
├── 🔐 PHẦN 2: Authentication System (dòng 107-247)
│   ├── JWT Token Handler (customJwtDecode, fakeApiLogin)
│   ├── AuthContext & AuthProvider (quản lý state đăng nhập)
│   └── useAuth Hook (để các component dùng)
│
├── 🔑 PHẦN 3: Login Page (dòng 249-335)
│   └── LoginPage Component (form đăng nhập)
│
├── 👥 PHẦN 4: User Layouts (dòng 337-616)
│   ├── PatientLayout (cho bệnh nhân)
│   │   ├── HomePage (trang chủ)
│   │   ├── SearchPage (tìm kiếm bác sĩ)
│   │   ├── AppointmentsPage (lịch hẹn)
│   │   └── ChatbotPage (chat AI)
│   ├── DoctorLayout (cho bác sĩ)
│   │   ├── DoctorDashboard
│   │   └── DoctorSchedule
│   └── AdminLayout (cho admin bệnh viện)
│       ├── AdminDashboard
│       └── ManageDoctors
│
└── 🚪 PHẦN 5: App Gatekeeper & Main App (dòng 618-699)
    ├── AppGatekeeper (router guard - kiểm tra quyền truy cập)
    └── App (component chính - bọc tất cả)
```

---

## 2. LUỒNG HOẠT ĐỘNG CHÍNH

### 🔄 Flow khi user vào app:

```
1. App khởi động
   └─> BrowserRouter bọc toàn bộ app
       └─> AuthProvider (kiểm tra token trong localStorage)
           └─> AppGatekeeper (kiểm tra đã login chưa)
               │
               ├─> Nếu CHƯA LOGIN:
               │   └─> Hiển thị LoginPage
               │       └─> User nhập username/password
               │           └─> Gọi login() trong AuthContext
               │               └─> Tạo token giả lập
               │                   └─> Lưu vào localStorage
               │                       └─> Set user state
               │                           └─> AppGatekeeper render lại
               │
               └─> Nếu ĐÃ LOGIN:
                   └─> Kiểm tra role của user
                       │
                       ├─> role === 'patient'
                       │   └─> Render PatientLayout
                       │       └─> Bottom Navigation (home, search, appointments, chat)
                       │
                       ├─> role === 'doctor'
                       │   └─> Render DoctorLayout
                       │       └─> Sidebar Navigation (dashboard, schedule)
                       │
                       └─> role === 'admin_hospital'
                           └─> Render AdminLayout
                               └─> Sidebar Navigation (dashboard, manage-doctors)
```

---

## 3. CHI TIẾT TỪNG PHẦN

### 🎨 PHẦN 1: Setup & Configuration

**Mục đích**: Cấu hình theme, import thư viện, định nghĩa types

**Các thành phần**:
- **Theme**: Màu sắc chính (#00796B - teal), font chữ Roboto
- **Types**: 
  - `Page`: Loại trang ('home' | 'search' | 'appointments' | 'chat')
  - `Message`: Tin nhắn trong chat
  - `JwtPayload`: Dữ liệu trong JWT token
  - `User`: Thông tin user (bỏ iat, exp)
  - `AuthContextType`: Interface cho AuthContext

---

### 🔐 PHẦN 2: Authentication System

**Mục đích**: Quản lý đăng nhập, đăng xuất, lưu trữ token

#### 2.1. Token Handler Functions:
- **`customJwtDecode(token: string)`**: 
  - Giải mã JWT token (tự viết, không dùng thư viện)
  - Trả về `JwtPayload` hoặc `null`
  
- **`fakeApiLogin(username, role)`**: 
  - Tạo token giả lập (SẼ THAY BẰNG API THẬT)
  - Mã hóa payload thành Base64
  - Format: `header.payload.signature`

#### 2.2. AuthContext & AuthProvider:
- **State quản lý**:
  ```typescript
  user: User | null          // Thông tin user hiện tại
  token: string | null       // JWT token
  loading: boolean           // Đang kiểm tra token?
  ```

- **Functions**:
  - **`login(username, password)`**: 
    - Giả lập đăng nhập (1 giây delay)
    - Tạo token dựa trên username
    - Lưu vào localStorage
    - Set user state
  
  - **`logout()`**: 
    - Xóa token khỏi localStorage
    - Clear user state

- **`useAuth()` Hook**: 
  - Để các component khác dùng AuthContext
  - Ví dụ: `const { user, logout } = useAuth();`

#### 2.3. Auto-check token khi app khởi động:
```typescript
useEffect(() => {
  // Khi app load, check token trong localStorage
  const storedToken = localStorage.getItem('authToken');
  if (storedToken) {
    // Giải mã token
    const decoded = customJwtDecode(storedToken);
    // Kiểm tra token còn hạn không
    if (decoded && decoded.exp * 1000 > Date.now()) {
      // Token hợp lệ -> Set user
      setUser({ ...decoded });
    } else {
      // Token hết hạn -> Xóa
      localStorage.removeItem('authToken');
    }
  }
  setLoading(false);
}, []);
```

---

### 🔑 PHẦN 3: Login Page

**Mục đích**: Form đăng nhập

**Chức năng**:
- Input username và password
- Gọi `login()` từ `useAuth()`
- Hiển thị lỗi nếu đăng nhập thất bại
- Loading state khi đang xử lý

**Lưu ý**: Hiện tại là giả lập, test với:
- `username: 'patient'` → role: patient
- `username: 'doctor'` → role: doctor  
- `username: 'admin'` → role: admin_hospital

---

### 👥 PHẦN 4: User Layouts

#### 4.1. PatientLayout (Bệnh nhân)

**Đặc điểm**:
- Bottom Navigation (4 tab: Home, Search, Appointments, Chat)
- Dùng **State** để chuyển trang (không dùng React Router)
- Mobile-first design

**Các trang**:
1. **HomePage**: 
   - Tìm kiếm nhanh
   - Chuyên khoa phổ biến (Tim mạch, Nhi khoa, Sản phụ khoa, Đa khoa)

2. **SearchPage**: 
   - Bộ lọc (Chuyên khoa, Địa điểm, Ngày)
   - Danh sách bác sĩ (giả lập)

3. **AppointmentsPage**: 
   - Lịch hẹn sắp tới
   - Lịch sử khám

4. **ChatbotPage**: 
   - Chat với AI assistant
   - Auto-scroll khi có tin nhắn mới
   - Loading indicator

#### 4.2. DoctorLayout (Bác sĩ)

**Đặc điểm**:
- Sidebar Navigation (Drawer)
- Dùng **React Router** để điều hướng
- Desktop layout

**Các trang**:
1. **DoctorDashboard**: Trang chủ bác sĩ
2. **DoctorSchedule**: Lịch khám của bác sĩ

**Routes**:
- `/` → DoctorDashboard
- `/schedule` → DoctorSchedule

#### 4.3. AdminLayout (Admin bệnh viện)

**Đặc điểm**:
- Tương tự DoctorLayout
- Sidebar Navigation
- Dùng React Router

**Các trang**:
1. **AdminDashboard**: Trang chủ admin
2. **ManageDoctors**: Quản lý bác sĩ

**Routes**:
- `/` → AdminDashboard
- `/manage-doctors` → ManageDoctors

---

### 🚪 PHẦN 5: App Gatekeeper & Main App

#### 5.1. AppGatekeeper (Router Guard)

**Mục đích**: Kiểm tra quyền truy cập, điều hướng user

**Logic**:

```typescript
1. Nếu loading === true:
   └─> Hiển thị CircularProgress (đang check token)

2. Nếu user === null (chưa login):
   └─> Render Routes chỉ có /login
       └─> Các route khác → Navigate to /login

3. Nếu user !== null (đã login):
   └─> Kiểm tra user.role
       ├─> 'patient' → Render PatientLayout
       ├─> 'doctor' → Render DoctorLayout
       └─> 'admin_hospital' → Render AdminLayout
```

**Lưu ý**: 
- `path="/*"` có nghĩa là Layout đó sẽ xử lý tất cả route con
- PatientLayout dùng State (không dùng route con)
- DoctorLayout và AdminLayout dùng Routes con bên trong

#### 5.2. App Component (Main)

**Cấu trúc**:
```tsx
<ThemeProvider theme={theme}>      // Áp dụng theme MUI
  <CssBaseline />                   // Reset CSS
    <BrowserRouter>                 // React Router
      <AuthProvider>                // Auth Context
        <AppGatekeeper />           // Router Guard
      </AuthProvider>
    </BrowserRouter>
</ThemeProvider>
```

---

## 4. SƠ ĐỒ LUỒNG DỮ LIỆU

### 🔄 Authentication Flow:

```
User nhập username/password
    ↓
LoginPage.handleSubmit()
    ↓
AuthContext.login(username, password)
    ↓
fakeApiLogin() → Tạo token giả
    ↓
customJwtDecode() → Giải mã token
    ↓
localStorage.setItem('authToken', token)
    ↓
setUser({ sub, username, role })
    ↓
AppGatekeeper re-render
    ↓
Kiểm tra user.role
    ↓
Render Layout tương ứng
```

### 🔄 Token Check Flow (khi app khởi động):

```
App khởi động
    ↓
AuthProvider useEffect chạy
    ↓
localStorage.getItem('authToken')
    ↓
customJwtDecode(token)
    ↓
Kiểm tra token.exp > Date.now()
    ↓
├─> Valid → setUser(), setToken()
└─> Invalid → removeItem(), clear state
    ↓
setLoading(false)
    ↓
AppGatekeeper render
```

### 🔄 Page Navigation Flow:

#### Patient (dùng State):
```
User click BottomNavigation
    ↓
setActivePage(newValue)
    ↓
PatientLayout.renderPage()
    ↓
switch(activePage)
    ↓
Render page tương ứng (HomePage, SearchPage, ...)
```

#### Doctor/Admin (dùng React Router):
```
User click Link trong Sidebar
    ↓
React Router navigate to route
    ↓
Routes match route
    ↓
Render component tương ứng
```

---

## 🎯 TÓM TẮT

1. **App.tsx là file chính** quản lý toàn bộ ứng dụng
2. **AuthProvider** quản lý đăng nhập/đăng xuất
3. **AppGatekeeper** là router guard, kiểm tra quyền truy cập
4. **3 Layouts khác nhau** cho 3 roles: Patient, Doctor, Admin
5. **Patient dùng State** để chuyển trang (mobile app style)
6. **Doctor/Admin dùng React Router** (web app style)
7. **Token được lưu** trong localStorage và tự động check khi app khởi động

---

## 💡 ĐIỂM QUAN TRỌNG CẦN NHỚ

1. **Token giả lập**: Hiện tại dùng `fakeApiLogin()`, cần thay bằng API thật
2. **Password không được dùng**: Trong mock, password không được verify
3. **Auto-login**: Token trong localStorage tự động được check khi app load
4. **Role-based routing**: Mỗi role có layout và routes riêng
5. **State vs Router**: Patient dùng State, Doctor/Admin dùng Router

---

## 🔧 CÁC THAY ĐỔI CẦN LÀM KHI KẾT NỐI API THẬT

1. Thay `fakeApiLogin()` bằng API call thật
2. Thay `customJwtDecode()` bằng thư viện `jwt-decode` (nếu cần)
3. Thêm error handling cho API calls
4. Thêm loading states khi gọi API
5. Thêm refresh token logic (nếu cần)
6. Validate password thật sự


