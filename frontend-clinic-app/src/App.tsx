import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { 
  ThemeProvider, 
  createTheme, 
  CssBaseline, 
  CircularProgress, 
  Box,
  AppBar,
  Toolbar,
  Typography,
  Avatar,
  Paper,
  BottomNavigation,
  BottomNavigationAction,
  TextField,
  Button,
  Card,
  CardContent,
  CardMedia,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Container,
  Alert,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Divider,
  Stack,
  Switch
} from '@mui/material';
import { 
  Home as HomeIcon, 
  Search as SearchIcon, 
  CalendarMonth as CalendarIcon, 
  Chat as ChatIcon,
  Send as SendIcon,
  LocalHospital as LocalHospitalIcon,
  MonitorHeart as MonitorHeartIcon,
  ChildFriendly as ChildFriendlyIcon,
  PregnantWoman as PregnantWomanIcon,
  Logout as LogoutIcon,
  Dashboard as DashboardIcon,
  Event as EventIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  HighlightOff as HighlightOffIcon,
  EventBusy as EventBusyIcon,
  Settings as SettingsIcon,
  Group as GroupIcon,
  Schedule as ScheduleIcon,
  ListAlt as ListAltIcon,
  BarChart as BarChartIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  Category as CategoryIcon,
  SettingsApplications as SettingsApplicationsIcon,
  Analytics as AnalyticsIcon,
  Lock as LockIcon
} from '@mui/icons-material';

// --- Định nghĩa Theme (Chủ đề) ---
const theme = createTheme({
  palette: {
    primary: {
      main: '#00796B', // Màu Teal (xanh mòng két) đậm
    },
    secondary: {
      main: '#00B0FF', // Màu xanh dương sáng
    },
    background: {
      default: '#F4F6F8', // Màu nền xám nhạt
      paper: '#FFFFFF',
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
  },
});

// --- Định nghĩa kiểu (TypeScript) chung ---
type Page = 'home' | 'search' | 'appointments' | 'chat';

interface Message {
  id: number;
  sender: 'user' | 'bot';
  text: string;
}

// --- Doctor domain types ---
type AppointmentStatus = 'scheduled' | 'completed' | 'no_show' | 'cancelled';

interface Patient {
  id: string;
  fullName: string;
  age: number;
  gender: 'male' | 'female' | 'other';
}

interface Appointment {
  id: string;
  patient: Patient;
  startTime: string; // ISO
  endTime: string;   // ISO
  reason: string;
  status: AppointmentStatus;
}

interface Slot {
  id: string;
  startTime: string; // ISO
  endTime: string;   // ISO
  isOpen: boolean;
}

// --- Admin domain types ---
interface ClinicProfile {
  name: string;
  address: string;
  workingHours: string;
  description?: string;
  imageUrl?: string;
}

interface Doctor {
  id: string;
  fullName: string;
  specialty: string;
  email: string;
  phone?: string;
  active: boolean;
}

type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7; // T2..CN
interface WorkingPattern {
  id: string;
  doctorId: string;
  weekdays: Weekday[];        // ví dụ: [1,3,5] = T2-T4-T6
  startTime: string;          // '08:00'
  endTime: string;            // '16:30'
  note?: string;
}

type AdminAppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'rescheduled';
interface AdminAppointment {
  id: string;
  patientName: string;
  doctorName: string;
  time: string;               // ISO
  reason: string;
  status: AdminAppointmentStatus;
}

// --- Super Admin domain types ---
type ClinicStatus = 'pending' | 'approved' | 'locked';
interface ClinicAccount {
  id: string;
  name: string;
  ownerEmail: string;
  status: ClinicStatus;
}

interface Specialty {
  id: string;
  name: string;
}
interface ServiceItem {
  id: string;
  name: string;
  price?: number;
}

interface SystemSetting {
  key: string;
  label: string;
  enabled: boolean;
}

// Kiểu dữ liệu của payload trong token
interface JwtPayload {
  sub: number; // userId
  username: string;
  role: 'patient' | 'doctor' | 'admin_hospital' | 'super_admin';
  iat: number;
  exp: number;
}
// Kiểu dữ liệu của user trong app
type User = Omit<JwtPayload, 'iat' | 'exp'>;

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

// Hàm giải mã token "dởm"
const customJwtDecode = (token: string): JwtPayload | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.warn('Invalid token format');
      return null;
    }
    const payload = parts[1];
    // Thay thế các ký tự không an toàn cho URL
    let base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    // Thêm padding '=' nếu cần
    const padding = base64.length % 4;
    if (padding) {
      base64 += '='.repeat(4 - padding);
    }
    
    const decodedPayload = atob(base64); // Giải mã Base64
    return JSON.parse(decodedPayload) as JwtPayload;
  } catch (error) {
    console.error("Failed to decode token:", error);
    return null;
  }
};

// Hàm giả lập tạo token (MÀY SẼ THAY BẰNG API THẬT)
const fakeApiLogin = (username: string, role: string): string => {
  const payload = {
    sub: Math.floor(Math.random() * 1000),
    username: username,
    role: role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // Hết hạn sau 1 ngày
  };
  // Dùng btoa để mã hóa base64
  const encodedPayload = btoa(JSON.stringify(payload))
                          .replace(/\+/g, '-') // Thay + bằng -
                          .replace(/\//g, '_') // Thay / bằng _
                          .replace(/=/g, '');  // Bỏ padding =
  return `header.${encodedPayload}.signature`; 
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('authToken'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Khi app mới tải, check token trong localStorage
    try {
      const storedToken = localStorage.getItem('authToken');
      if (storedToken) {
        const decoded = customJwtDecode(storedToken);
        
        if (decoded && decoded.exp * 1000 > Date.now()) {
          // Token còn hạn
          setToken(storedToken);
          setUser({ sub: decoded.sub, username: decoded.username, role: decoded.role });
        } else {
          // Token hết hạn
          localStorage.removeItem('authToken');
          setToken(null);
          setUser(null);
        }
      }
    } catch (e) {
      console.error("Failed to decode token", e);
      localStorage.removeItem('authToken');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false); // Báo là đã check xong
    }
  }, []);

  const login = async (username: string, password: string) => {
    // --- (GIẢ LẬP) ---
    // (XÓA ĐOẠN NÀY KHI LÀM THẬT)
    // password được nhận nhưng không dùng trong giả lập
    void password; // Đánh dấu là cố ý không dùng trong mock
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        let role = '';
        if (username === 'patient') role = 'patient';
        else if (username === 'doctor') role = 'doctor';
        else if (username === 'admin') role = 'admin_hospital';
        else if (username === 'superadmin') role = 'super_admin';
        else {
          reject(new Error('Sai user. Gõ: patient, doctor, admin, hoặc superadmin'));
          return;
        }

        const fakeToken = fakeApiLogin(username, role);
        const decoded = customJwtDecode(fakeToken);
        
        if (!decoded) {
            reject(new Error('Lỗi tạo/giải mã token giả'));
            return;
        }
        
        localStorage.setItem('authToken', fakeToken);
        setToken(fakeToken);
        setUser({ sub: decoded.sub, username: decoded.username, role: decoded.role });
        resolve();
      }, 1000); // Giả lập 1s gọi API
    });
    // --- (HẾT PHẦN GIẢ LẬP) ---
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// ==================================================================
// FILE: src/pages/LoginPage.tsx (Đã gộp vào đây)
// ==================================================================

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await login(username, password); 
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại!');
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper 
        elevation={6} 
        sx={{ 
          marginTop: 8, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          padding: 4,
          borderRadius: 3
        }}
      >
        <LocalHospitalIcon color="primary" sx={{ fontSize: 60, mb: 2 }} />
        <Typography component="h1" variant="h5">
          ClinicBook Login
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Tên đăng nhập"
            name="username"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Mật khẩu"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          
          {error && <Alert severity="error" sx={{ width: '100%', mt: 1 }}>{error}</Alert>}
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2, py: 1.5 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Đăng nhập'}
          </Button>

          <Typography variant="body2" color="textSecondary" align="center">
            (Giả lập: gõ 'patient', 'doctor', 'admin', hoặc 'superadmin' để test)
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}

// ==================================================================
// FILE: src/layouts/PatientLayout.tsx (Đã gộp vào đây)
// ==================================================================

// --- Các "Trang Con" của Patient ---
const HomePage: React.FC = () => (
  <Box sx={{ p: 2 }}>
    <Typography variant="h5" component="h2" fontWeight="bold" gutterBottom>Chào mừng, Bệnh nhân!</Typography>
    <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 3 }}>
      <Typography variant="h6" component="h3" fontWeight="600" gutterBottom>Tìm kiếm nhanh</Typography>
      <TextField fullWidth variant="outlined" placeholder="Tìm bác sĩ, chuyên khoa, bệnh viện..." sx={{ mb: 2 }} />
      <Button variant="contained" size="large" fullWidth>Tìm kiếm</Button>
    </Paper>
    <Typography variant="h6" component="h3" fontWeight="600" gutterBottom>Chuyên khoa phổ biến</Typography>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
      {[
        { name: 'Tim mạch', icon: <MonitorHeartIcon fontSize="large" color="primary" /> },
        { name: 'Nhi khoa', icon: <ChildFriendlyIcon fontSize="large" color="secondary" /> },
        { name: 'Sản phụ khoa', icon: <PregnantWomanIcon fontSize="large" sx={{ color: 'pink' }} /> },
        { name: 'Đa khoa', icon: <LocalHospitalIcon fontSize="large" color="success" /> },
      ].map(khoa => (
        <Paper 
          key={khoa.name}
          elevation={1} 
          sx={{ 
            p: 2, 
            textAlign: 'center', 
            cursor: 'pointer', 
            borderRadius: 3, 
            '&:hover': { boxShadow: 4, transform: 'scale(1.02)' },
            transition: 'all 0.2s'
          }}
        >
          {khoa.icon}
          <Typography variant="subtitle1" fontWeight="500" sx={{ mt: 1 }}>{khoa.name}</Typography>
        </Paper>
      ))}
    </Box>
  </Box>
);

const SearchPage: React.FC = () => (
  <Box sx={{ p: 2 }}>
    <Typography variant="h5" component="h2" fontWeight="bold" gutterBottom>Tìm kiếm Bác sĩ / Bệnh viện</Typography>
    <Paper elevation={2} sx={{ p: 2, mb: 3, borderRadius: 3 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
        <FormControl fullWidth><InputLabel>Chuyên khoa</InputLabel><Select label="Chuyên khoa" defaultValue=""><MenuItem value="cardiology">Tim mạch</MenuItem></Select></FormControl>
        <FormControl fullWidth><InputLabel>Địa điểm</InputLabel><Select label="Địa điểm" defaultValue=""><MenuItem value="hanoi">Hà Nội</MenuItem></Select></FormControl>
        <TextField fullWidth type="date" label="Chọn ngày" InputLabelProps={{ shrink: true }} />
      </Box>
    </Paper>
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {[1, 2].map(id => (
        <Card key={id} sx={{ display: 'flex', borderRadius: 3, boxShadow: 2 }}>
          <CardMedia component="img" sx={{ width: 100, height: 100, m: 2, borderRadius: '50%' }} image={`https://placehold.co/100x100/E0F2F1/00796B?text=BS`} alt="Bác sĩ" />
          <CardContent sx={{ flex: '1 0 auto' }}>
            <Typography component="div" variant="h6" color="primary.main" fontWeight="bold">Bác sĩ Nguyễn Văn A</Typography>
            <Typography variant="subtitle1" color="text.secondary" component="div">Chuyên khoa Tim mạch</Typography>
            <Button variant="contained" size="small" sx={{ mt: 1 }}>Đặt lịch</Button>
          </CardContent>
        </Card>
      ))}
    </Box>
  </Box>
);

const AppointmentsPage: React.FC = () => (
  <Box sx={{ p: 2 }}>
    <Typography variant="h5" component="h2" fontWeight="bold" gutterBottom>Lịch hẹn của tôi</Typography>
    <Card sx={{ mb: 3, borderRadius: 3, boxShadow: 2 }}>
      <CardContent>
        <Typography variant="h6" component="div" gutterBottom>Lịch hẹn sắp tới</Typography>
        <Box sx={{ border: '1px solid #e0e0e0', p: 2, borderRadius: 2 }}>
          <Typography variant="body1" fontWeight="bold">Khám chuyên khoa Tim mạch</Typography>
          <Typography variant="body2">Thời gian: 09:00 - Thứ Hai, 28/10/2025</Typography>
          <Button variant="contained" color="error" size="small" sx={{ mt: 1 }}>Huỷ lịch</Button>
        </Box>
      </CardContent>
    </Card>
  </Box>
);

const ChatbotPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, sender: 'bot', text: 'Chào bạn! Tôi là trợ lý sức khoẻ AI. Tôi có thể giúp gì cho bạn?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (input.trim() === '' || isLoading) return;
    const userMessage: Message = { id: Date.now(), sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setTimeout(() => {
      const botResponse: Message = { id: Date.now() + 1, sender: 'bot', text: 'Tôi đang xử lý câu hỏi của bạn...' };
      setMessages(prev => [...prev, botResponse]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Typography variant="h5" component="h2" fontWeight="bold" sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>AI Health Assistant</Typography>
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2, bgcolor: 'background.default', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {messages.map(msg => (
          <Box key={msg.id} sx={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
            <Paper elevation={2} sx={{ p: 1.5, maxWidth: '80%', bgcolor: msg.sender === 'user' ? 'primary.main' : 'background.paper', color: msg.sender === 'user' ? 'primary.contrastText' : 'text.primary', borderRadius: msg.sender === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px' }}>
              <Typography variant="body1">{msg.text}</Typography>
            </Paper>
          </Box>
        ))}
        {isLoading && (<Box sx={{ display: 'flex', justifyContent: 'flex-start' }}><CircularProgress size={24} /></Box>)}
        <div ref={chatEndRef} />
      </Box>
      <Paper elevation={4} component="form" onSubmit={(e) => { e.preventDefault(); handleSend(); }} sx={{ p: 1, display: 'flex', alignItems: 'center', borderTop: '1px solid #e0e0e0' }}>
        <TextField fullWidth variant="outlined" size="small" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Nhập câu hỏi của bạn..." sx={{ '& .MuiOutlinedInput-root': { borderRadius: 5 } }} />
        <IconButton type="submit" color="primary" disabled={isLoading}><SendIcon /></IconButton>
      </Paper>
    </Box>
  );
};

// --- Component Layout chính (Bệnh nhân) ---
const PatientLayout: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>('home');
  const { logout } = useAuth();

  const renderPage = () => {
    switch (activePage) {
      case 'home': return <HomePage />;
      case 'search': return <SearchPage />;
      case 'appointments': return <AppointmentsPage />;
      case 'chat': return <ChatbotPage />;
      default: return <HomePage />;
    }
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default', overflow: 'hidden' }}>
      <AppBar position="static" elevation={0} sx={{ borderBottom: '1px solid #e0e0e0' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>ClinicBook (Patient)</Typography>
          <Avatar alt="User Avatar" src="https://placehold.co/40x40/E0F2F1/00796B?text=User" sx={{ mr: 1 }} />
          <IconButton color="inherit" onClick={logout}><LogoutIcon /></IconButton>
        </Toolbar>
      </AppBar>
      <Box sx={{ flex: 1, overflowY: activePage === 'chat' ? 'hidden' : 'auto' }}>
        {renderPage()}
      </Box>
      <Paper sx={{ width: '100%' }} elevation={3}>
        <BottomNavigation showLabels value={activePage} onChange={(_event, newValue: Page) => { setActivePage(newValue); }}>
          <BottomNavigationAction label="Trang chủ" value="home" icon={<HomeIcon />} />
          <BottomNavigationAction label="Tìm kiếm" value="search" icon={<SearchIcon />} />
          <BottomNavigationAction label="Lịch hẹn" value="appointments" icon={<CalendarIcon />} />
          <BottomNavigationAction label="Trợ lý AI" value="chat" icon={<ChatIcon />} />
        </BottomNavigation>
      </Paper>
    </Box>
  );
}

// ==================================================================
// FILE: src/layouts/DoctorLayout.tsx (Đã gộp vào đây)
// ==================================================================

const drawerWidth = 240;
// Các trang con của Bác sĩ
const DoctorDashboard: React.FC = () => {
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    // Mock data cho 1 ngày
    const base = new Date();
    const mk = (h: number, m = 0) => {
      const s = new Date(base);
      s.setHours(h, m, 0, 0);
      const e = new Date(s);
      e.setMinutes(s.getMinutes() + 30);
      return { startTime: s.toISOString(), endTime: e.toISOString() };
    };
    return [
      { id: 'a1', patient: { id: 'p1', fullName: 'Trần Văn B', age: 35, gender: 'male' }, ...mk(9), reason: 'Khám tim mạch', status: 'scheduled' },
      { id: 'a2', patient: { id: 'p2', fullName: 'Nguyễn Thị C', age: 28, gender: 'female' }, ...mk(9, 30), reason: 'Đau ngực', status: 'scheduled' },
      { id: 'a3', patient: { id: 'p3', fullName: 'Phạm Văn D', age: 42, gender: 'male' }, ...mk(10), reason: 'Khó thở', status: 'scheduled' },
      { id: 'a4', patient: { id: 'p4', fullName: 'Lê Thị E', age: 31, gender: 'female' }, ...mk(11), reason: 'Tái khám', status: 'scheduled' },
    ];
  });
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const changeStatus = (id: string, status: AppointmentStatus) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight="bold">Bảng điều khiển</Typography>

      <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Tabs
              value={viewMode === 'day' ? 0 : 1}
              onChange={(_, idx) => setViewMode(idx === 0 ? 'day' : 'week')}
              textColor="primary"
              indicatorColor="primary"
            >
              <Tab label="Theo ngày" />
              <Tab label="Theo tuần" />
            </Tabs>
            <TextField
              type="date"
              size="small"
              value={selectedDate.toISOString().slice(0, 10)}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
            />
          </Stack>
          <Chip color="primary" label={`Tổng lịch: ${appointments.length}`} />
        </Stack>
      </Paper>

      {/* Day view */}
      {viewMode === 'day' && (
      <Box sx={{ display: { xs: 'block', md: 'flex' }, gap: 2 }}>
        <Box sx={{ flex: { md: 7 }, mb: { xs: 2, md: 0 } }}>
          <Paper sx={{ p: 2, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="600" gutterBottom>Lịch hẹn hôm nay</Typography>
            <Divider sx={{ mb: 2 }} />
            <Stack spacing={1.5}>
              {appointments.map(apm => (
                <Paper key={apm.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                    <Stack spacing={0.5}>
                      <Typography fontWeight="600">
                        {formatTime(apm.startTime)} - {formatTime(apm.endTime)} • {apm.patient.fullName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">{apm.reason}</Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        size="small"
                        label={
                          apm.status === 'scheduled' ? 'Đã đặt' :
                          apm.status === 'completed' ? 'Hoàn thành' :
                          apm.status === 'no_show' ? 'Không đến' : 'Đã huỷ'
                        }
                        color={
                          apm.status === 'scheduled' ? 'default' :
                          apm.status === 'completed' ? 'success' :
                          apm.status === 'no_show' ? 'warning' : 'error'
                        }
                        variant="outlined"
                      />
                      <IconButton size="small" color="primary" onClick={() => setSelectedAppointment(apm)}><InfoIcon /></IconButton>
                      <IconButton size="small" color="success" onClick={() => changeStatus(apm.id, 'completed')}><CheckCircleIcon /></IconButton>
                      <IconButton size="small" color="warning" onClick={() => changeStatus(apm.id, 'no_show')}><HighlightOffIcon /></IconButton>
                    </Stack>
                  </Stack>
                </Paper>
              ))}
              {!appointments.length && <Typography>Không có lịch hẹn.</Typography>}
            </Stack>
          </Paper>
        </Box>

        <Box sx={{ flex: { md: 5 } }}>
          <Paper sx={{ p: 2, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="600" gutterBottom>Tổng quan tuần</Typography>
            <Divider sx={{ mb: 2 }} />
            <Stack spacing={1}>
              {['Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7','Chủ nhật'].map((d, idx) => (
                <Stack key={idx} direction="row" alignItems="center" justifyContent="space-between">
                  <Typography>{d}</Typography>
                  <Chip size="small" label={`${Math.max(0, (appointments.length - idx))} lịch`} color={idx === 0 ? 'primary' : 'default'} />
                </Stack>
              ))}
            </Stack>
          </Paper>
        </Box>
      </Box>
      )}

      {/* Week view */}
      {viewMode === 'week' && (
        <Paper sx={{ p: 2, borderRadius: 3 }}>
          <Typography variant="h6" fontWeight="600" gutterBottom>Lịch theo tuần</Typography>
          <Divider sx={{ mb: 2 }} />
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '120px repeat(7, 1fr)',
              gap: 1,
            }}
          >
            {/* Header */}
            <Box />
            {['T2','T3','T4','T5','T6','T7','CN'].map((d, i) => (
              <Box key={i} sx={{ textAlign: 'center', fontWeight: 600 }}>{d}</Box>
            ))}
            {/* Time slots */}
            {['08:00','08:30','09:00','09:30','10:00','10:30','11:00','14:00','14:30','15:00','15:30','16:00','16:30'].map((t) => (
              <React.Fragment key={t}>
                <Box sx={{ fontWeight: 500, color: 'text.secondary' }}>{t}</Box>
                {Array.from({ length: 7 }).map((_, dayIdx) => {
                  // mock: gán các cuộc hẹn vào ngày hiện tại (thứ 2) cho dễ nhìn
                  const isTodayCol = dayIdx === 0;
                  const apmAtTime = isTodayCol && appointments.find(a => {
                    const ts = new Date(a.startTime);
                    const hh = ts.getHours().toString().padStart(2, '0');
                    const mm = ts.getMinutes().toString().padStart(2, '0');
                    return `${hh}:${mm}` === t;
                  });
                  return (
                    <Box key={dayIdx} sx={{ minHeight: 42 }}>
                      {apmAtTime ? (
                        <Paper sx={{ p: 0.5, borderRadius: 1 }}>
                          <Typography variant="caption" fontWeight={600}>{apmAtTime.patient.fullName}</Typography>
                          <Typography variant="caption" display="block" color="text.secondary">{apmAtTime.reason}</Typography>
                        </Paper>
                      ) : (
                        <Box sx={{ height: 42, bgcolor: 'background.default', borderRadius: 1, border: '1px dashed #eee' }} />
                      )}
                    </Box>
                  );
                })}
              </React.Fragment>
            ))}
          </Box>
        </Paper>
      )}

      <Dialog open={!!selectedAppointment} onClose={() => setSelectedAppointment(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Thông tin bệnh nhân</DialogTitle>
        <DialogContent dividers>
          {selectedAppointment && (
            <Stack spacing={1.5}>
              <Typography><strong>Họ tên:</strong> {selectedAppointment.patient.fullName}</Typography>
              <Typography><strong>Tuổi:</strong> {selectedAppointment.patient.age}</Typography>
              <Typography><strong>Giới tính:</strong> {selectedAppointment.patient.gender === 'male' ? 'Nam' : selectedAppointment.patient.gender === 'female' ? 'Nữ' : 'Khác'}</Typography>
              <Typography><strong>Thời gian:</strong> {formatTime(selectedAppointment.startTime)} - {formatTime(selectedAppointment.endTime)}</Typography>
              <Typography><strong>Lý do khám:</strong> {selectedAppointment.reason}</Typography>
              <Chip
                label={`Trạng thái: ${selectedAppointment.status}`}
                color={selectedAppointment.status === 'completed' ? 'success' : selectedAppointment.status === 'no_show' ? 'warning' : selectedAppointment.status === 'cancelled' ? 'error' : 'default'}
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedAppointment(null)}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const DoctorSchedule: React.FC = () => {
  const [slots, setSlots] = useState<Slot[]>(() => {
    // Mock các slot trong ngày
    const base = new Date();
    const create = (h: number, m = 0): Slot => {
      const s = new Date(base);
      s.setHours(h, m, 0, 0);
      const e = new Date(s);
      e.setMinutes(s.getMinutes() + 30);
      return { id: `${h}-${m}`, startTime: s.toISOString(), endTime: e.toISOString(), isOpen: true };
    };
    return [
      create(8), create(8,30),
      create(9), create(9,30),
      create(10), create(10,30),
      create(11),
      create(14), create(14,30),
      create(15), create(15,30),
      create(16)
    ];
  });

  const toggleSlot = (id: string) => {
    setSlots(prev => prev.map(s => s.id === id ? ({ ...s, isOpen: !s.isOpen }) : s));
  };

  const fmt = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight="bold">Quản lý lịch cá nhân</Typography>
      <Paper sx={{ p: 2, borderRadius: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <EventBusyIcon color="action" />
          <Typography variant="body2" color="text.secondary">Đóng slot sẽ ngăn bệnh nhân đặt vào giờ đó</Typography>
        </Stack>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 1.5 }}>
          {slots.map(slot => (
            <Paper key={slot.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography fontWeight="600">{fmt(slot.startTime)} - {fmt(slot.endTime)}</Typography>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="caption" color={slot.isOpen ? 'success.main' : 'error.main'}>
                  {slot.isOpen ? 'Mở' : 'Đóng'}
                </Typography>
                <Switch checked={slot.isOpen} onChange={() => toggleSlot(slot.id)} />
              </Stack>
            </Paper>
          ))}
        </Box>
      </Paper>
    </Box>
  );
};

const DoctorLayout: React.FC = () => {
  const { logout, user } = useAuth();

  const drawer = (
    <div>
      <Toolbar />
      <Box sx={{ overflow: 'auto' }}>
        <List>
          <ListItem disablePadding component={Link} to="dashboard">
            <ListItemButton><ListItemIcon><DashboardIcon /></ListItemIcon><ListItemText primary="Bảng điều khiển" /></ListItemButton>
          </ListItem>
          <ListItem disablePadding component={Link} to="schedule">
            <ListItemButton><ListItemIcon><EventIcon /></ListItemIcon><ListItemText primary="Quản lý lịch" /></ListItemButton>
          </ListItem>
        </List>
      </Box>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }} elevation={1}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>ClinicBook (Bác sĩ)</Typography>
          <Typography sx={{ mr: 2 }}>Chào, {user?.username}</Typography>
          <IconButton color="inherit" onClick={logout}><LogoutIcon /></IconButton>
        </Toolbar>
      </AppBar>
      <Drawer variant="permanent" sx={{ width: drawerWidth, flexShrink: 0, [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' } }}>
        {drawer}
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Paper sx={{ p: 3 }}>
          <Routes>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DoctorDashboard />} />
            <Route path="schedule" element={<DoctorSchedule />} />
          </Routes>
        </Paper>
      </Box>
    </Box>
  );
}

// ==================================================================
// FILE: src/layouts/AdminLayout.tsx (Đã gộp vào đây)
// ==================================================================

// Các trang con của Admin
const AdminDashboard: React.FC = () => {
  // mock numbers
  const metrics = [
    { label: 'Tổng lịch hẹn tháng', value: 128, color: 'primary' as const },
    { label: 'Tỉ lệ hoàn thành', value: '92%', color: 'success' as const },
    { label: 'Bác sĩ đang hoạt động', value: 12, color: 'secondary' as const },
    { label: 'Huỷ/Không đến', value: '6%', color: 'warning' as const },
  ];
  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight="bold">Báo cáo nhanh</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
        {metrics.map((m, idx) => (
          <Paper key={idx} sx={{ p: 2, borderRadius: 3 }}>
            <Typography variant="body2" color="text.secondary">{m.label}</Typography>
            <Typography variant="h5" fontWeight="bold" color={`${m.color}.main`}>{m.value}</Typography>
          </Paper>
        ))}
      </Box>
    </Box>
  );
};

const AdminCatalogsPage: React.FC = () => {
  const [tab, setTab] = useState(0); // 0 specialties, 1 services
  const [specialties, setSpecialties] = useState<Specialty[]>([
    { id: 'sp1', name: 'Tim mạch' },
    { id: 'sp2', name: 'Nhi khoa' },
  ]);
  const [services, setServices] = useState<ServiceItem[]>([
    { id: 'sv1', name: 'Khám tổng quát', price: 200000 },
    { id: 'sv2', name: 'Siêu âm tim', price: 350000 },
  ]);
  const [input, setInput] = useState('');
  const [price, setPrice] = useState<number | ''>('');

  const addSpecialty = () => { if (!input.trim()) return; setSpecialties(s => [{ id: `sp${Date.now()}`, name: input.trim() }, ...s]); setInput(''); };
  const removeSpecialty = (id: string) => setSpecialties(s => s.filter(x => x.id !== id));
  const addService = () => { if (!input.trim()) return; setServices(s => [{ id: `sv${Date.now()}`, name: input.trim(), price: Number(price) || undefined }, ...s]); setInput(''); setPrice(''); };
  const removeService = (id: string) => setServices(s => s.filter(x => x.id !== id));

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <CategoryIcon color="primary" />
        <Typography variant="h5" fontWeight="bold">Danh mục hệ thống</Typography>
      </Stack>
      <Tabs value={tab} onChange={(_, v) => { setTab(v); setInput(''); setPrice(''); }} sx={{ mb: 2 }}>
        <Tab label="Chuyên khoa" />
        <Tab label="Dịch vụ" />
      </Tabs>
      {tab === 0 && (
        <Paper sx={{ p: 2, borderRadius: 3 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
            <TextField label="Thêm chuyên khoa" value={input} onChange={(e) => setInput(e.target.value)} />
            <Button variant="contained" startIcon={<AddIcon />} onClick={addSpecialty}>Thêm</Button>
          </Stack>
          <Stack spacing={1.5}>
            {specialties.map(s => (
              <Paper key={s.id} sx={{ p: 1.5, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography>{s.name}</Typography>
                <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => removeSpecialty(s.id)}>Xoá</Button>
              </Paper>
            ))}
          </Stack>
        </Paper>
      )}
      {tab === 1 && (
        <Paper sx={{ p: 2, borderRadius: 3 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
            <TextField label="Tên dịch vụ" value={input} onChange={(e) => setInput(e.target.value)} />
            <TextField label="Giá (VND)" type="number" value={price} onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))} />
            <Button variant="contained" startIcon={<AddIcon />} onClick={addService}>Thêm</Button>
          </Stack>
          <Stack spacing={1.5}>
            {services.map(s => (
              <Paper key={s.id} sx={{ p: 1.5, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography>{s.name}{s.price ? ` • ${s.price.toLocaleString()} VND` : ''}</Typography>
                <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => removeService(s.id)}>Xoá</Button>
              </Paper>
            ))}
          </Stack>
        </Paper>
      )}
    </Box>
  );
};

const ClinicProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<ClinicProfile>({
    name: 'Phòng khám ABC',
    address: '123 Đường Sức Khoẻ, Hà Nội',
    workingHours: '08:00 - 16:30',
    description: 'Phòng khám đa khoa chất lượng cao.',
    imageUrl: 'https://placehold.co/600x200/E0F2F1/00796B?text=Clinic',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      alert('Đã lưu hồ sơ phòng khám (mock)!');
    }, 800);
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight="bold">Hồ sơ Phòng khám</Typography>
      <Paper sx={{ p: 2, borderRadius: 3 }}>
        <Stack spacing={2}>
          <TextField label="Tên phòng khám" fullWidth value={profile.name} onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))} />
          <TextField label="Địa chỉ" fullWidth value={profile.address} onChange={(e) => setProfile(p => ({ ...p, address: e.target.value }))} />
          <TextField label="Giờ làm việc" fullWidth value={profile.workingHours} onChange={(e) => setProfile(p => ({ ...p, workingHours: e.target.value }))} />
          <TextField label="Mô tả" fullWidth multiline minRows={3} value={profile.description} onChange={(e) => setProfile(p => ({ ...p, description: e.target.value }))} />
          <TextField label="Ảnh cover (URL)" fullWidth value={profile.imageUrl} onChange={(e) => setProfile(p => ({ ...p, imageUrl: e.target.value }))} />
          {profile.imageUrl && <Card sx={{ borderRadius: 2 }}><CardMedia component="img" height="140" image={profile.imageUrl} /></Card>}
          <Box>
            <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? <CircularProgress size={22} /> : 'Lưu thay đổi'}</Button>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
};

const ManageDoctorsPage: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([
    { id: 'd1', fullName: 'BS. Nguyễn Văn A', specialty: 'Tim mạch', email: 'a@clinic.com', phone: '0901...', active: true },
    { id: 'd2', fullName: 'BS. Trần Thị B', specialty: 'Nhi khoa', email: 'b@clinic.com', phone: '0902...', active: true },
  ]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [form, setForm] = useState<Doctor>({ id: '', fullName: '', specialty: '', email: '', phone: '', active: true });

  const openAdd = () => { setEditing(null); setForm({ id: '', fullName: '', specialty: '', email: '', phone: '', active: true }); setOpenDialog(true); };
  const openEdit = (d: Doctor) => { setEditing(d); setForm(d); setOpenDialog(true); };
  const remove = (id: string) => setDoctors(ds => ds.filter(d => d.id !== id));
  const save = () => {
    if (editing) {
      setDoctors(ds => ds.map(d => d.id === editing.id ? { ...form, id: editing.id } : d));
    } else {
      setDoctors(ds => [{ ...form, id: `d${Date.now()}` }, ...ds]);
    }
    setOpenDialog(false);
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight="bold">Quản lý Bác sĩ</Typography>
        <Button startIcon={<AddIcon />} variant="contained" onClick={openAdd}>Thêm bác sĩ</Button>
      </Stack>

      <Stack spacing={1.5}>
        {doctors.map(doc => (
          <Paper key={doc.id} sx={{ p: 1.5, borderRadius: 2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack>
                <Typography fontWeight="600">{doc.fullName}</Typography>
                <Typography variant="body2" color="text.secondary">{doc.specialty} • {doc.email} • {doc.phone}</Typography>
              </Stack>
              <Stack direction="row" spacing={1}>
                <Button size="small" startIcon={<EditIcon />} onClick={() => openEdit(doc)}>Sửa</Button>
                <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => remove(doc.id)}>Xoá</Button>
              </Stack>
            </Stack>
          </Paper>
        ))}
      </Stack>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Sửa bác sĩ' : 'Thêm bác sĩ'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField label="Họ tên" fullWidth value={form.fullName} onChange={(e) => setForm(f => ({ ...f, fullName: e.target.value }))} />
            <TextField label="Chuyên khoa" fullWidth value={form.specialty} onChange={(e) => setForm(f => ({ ...f, specialty: e.target.value }))} />
            <TextField label="Email" fullWidth value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} />
            <TextField label="SĐT" fullWidth value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} />
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography>Hoạt động:</Typography>
              <Switch checked={form.active} onChange={() => setForm(f => ({ ...f, active: !f.active }))} />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Hủy</Button>
          <Button variant="contained" onClick={save}>Lưu</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const WorkingScheduleConfigPage: React.FC = () => {
  const [doctors] = useState<Doctor[]>([
    { id: 'd1', fullName: 'BS. Nguyễn Văn A', specialty: 'Tim mạch', email: 'a@clinic.com', active: true },
    { id: 'd2', fullName: 'BS. Trần Thị B', specialty: 'Nhi khoa', email: 'b@clinic.com', active: true },
  ]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('d1');
  const [patterns, setPatterns] = useState<WorkingPattern[]>([
    { id: 'wp1', doctorId: 'd1', weekdays: [1,3,5], startTime: '08:00', endTime: '16:30', note: 'Ca hành chính' },
  ]);
  const [newPattern, setNewPattern] = useState<WorkingPattern>({ id: '', doctorId: 'd1', weekdays: [2,4], startTime: '08:00', endTime: '11:30' });

  const addPattern = () => {
    setPatterns(ps => [{ ...newPattern, id: `wp${Date.now()}`, doctorId: selectedDoctorId }, ...ps]);
  };
  const removePattern = (id: string) => setPatterns(ps => ps.filter(p => p.id !== id));

  const weekdayLabel = (w: Weekday) => ['T2','T3','T4','T5','T6','T7','CN'][w-1];

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>Cấu hình lịch làm việc</Typography>
      <Paper sx={{ p: 2, borderRadius: 3 }}>
        <Stack spacing={2}>
          <FormControl fullWidth>
            <InputLabel>Bác sĩ</InputLabel>
            <Select label="Bác sĩ" value={selectedDoctorId} onChange={(e) => setSelectedDoctorId(e.target.value)}>
              {doctors.map(d => <MenuItem key={d.id} value={d.id}>{d.fullName} • {d.specialty}</MenuItem>)}
            </Select>
          </FormControl>
          <Divider />
          <Typography variant="subtitle1" fontWeight="600">Thêm mẫu làm việc</Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <FormControl sx={{ minWidth: 160 }}>
              <InputLabel>Thứ</InputLabel>
              <Select
                multiple
                label="Thứ"
                value={newPattern.weekdays as number[]}
                onChange={(e) => setNewPattern(p => ({ ...p, weekdays: e.target.value as Weekday[] }))}
                renderValue={(selected) => (selected as number[]).map(v => weekdayLabel(v as Weekday)).join(', ')}
              >
                {[1,2,3,4,5,6,7].map(v => <MenuItem key={v} value={v}>{weekdayLabel(v as Weekday)}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Bắt đầu" type="time" value={newPattern.startTime} onChange={(e) => setNewPattern(p => ({ ...p, startTime: e.target.value }))} />
            <TextField label="Kết thúc" type="time" value={newPattern.endTime} onChange={(e) => setNewPattern(p => ({ ...p, endTime: e.target.value }))} />
            <TextField label="Ghi chú" value={newPattern.note ?? ''} onChange={(e) => setNewPattern(p => ({ ...p, note: e.target.value }))} />
            <Button variant="contained" startIcon={<AddIcon />} onClick={addPattern}>Thêm</Button>
          </Stack>
          <Divider />
          <Typography variant="subtitle1" fontWeight="600">Mẫu hiện có</Typography>
          <Stack spacing={1.5}>
            {patterns.filter(p => p.doctorId === selectedDoctorId).map(p => (
              <Paper key={p.id} sx={{ p: 1.5, borderRadius: 2 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ md: 'center' }} justifyContent="space-between" spacing={1.5}>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    <Chip label={p.weekdays.map(weekdayLabel).join('-')} />
                    <Chip label={`${p.startTime} - ${p.endTime}`} color="primary" />
                    {p.note && <Chip label={p.note} variant="outlined" />}
                  </Stack>
                  <Button color="error" startIcon={<DeleteIcon />} onClick={() => removePattern(p.id)}>Xoá</Button>
                </Stack>
              </Paper>
            ))}
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
};

const ManageAppointmentsPage: React.FC = () => {
  const [appointments, setAppointments] = useState<AdminAppointment[]>([
    { id: 'ap1', patientName: 'Trần Văn B', doctorName: 'BS. Nguyễn Văn A', time: new Date().toISOString(), reason: 'Đau ngực', status: 'pending' },
    { id: 'ap2', patientName: 'Nguyễn Thị C', doctorName: 'BS. Trần Thị B', time: new Date(Date.now()+3600e3).toISOString(), reason: 'Sốt', status: 'confirmed' },
  ]);
  const [openRe, setOpenRe] = useState<AdminAppointment | null>(null);
  const [reDate, setReDate] = useState<string>('');
  const [reTime, setReTime] = useState<string>('');

  const fmt = (iso: string) => new Date(iso).toLocaleString();
  const updateStatus = (id: string, status: AdminAppointmentStatus) => setAppointments(a => a.map(x => x.id === id ? { ...x, status } : x));
  const openReschedule = (a: AdminAppointment) => { setOpenRe(a); setReDate(a.time.slice(0,10)); setReTime(a.time.slice(11,16)); };
  const doReschedule = () => {
    if (!openRe) return;
    const newIso = new Date(`${reDate}T${reTime}:00`).toISOString();
    setAppointments(a => a.map(x => x.id === openRe.id ? { ...x, status: 'rescheduled', time: newIso } : x));
    setOpenRe(null);
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>Quản lý Lịch hẹn</Typography>
      <Stack spacing={1.5}>
        {appointments.map(a => (
          <Paper key={a.id} sx={{ p: 1.5, borderRadius: 2 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ md: 'center' }} justifyContent="space-between" spacing={1}>
              <Stack>
                <Typography fontWeight="600">{a.patientName} • {a.doctorName}</Typography>
                <Typography variant="body2" color="text.secondary">{fmt(a.time)} • {a.reason}</Typography>
              </Stack>
              <Stack direction="row" spacing={1}>
                <Chip
                  label={a.status === 'pending' ? 'Chờ xác nhận' : a.status === 'confirmed' ? 'Đã xác nhận' : a.status === 'cancelled' ? 'Đã huỷ' : 'Đã xếp lại'}
                  color={a.status === 'confirmed' ? 'success' : a.status === 'cancelled' ? 'error' : a.status === 'rescheduled' ? 'warning' : 'default'}
                  variant="outlined"
                />
                <Button size="small" onClick={() => updateStatus(a.id, 'confirmed')}>Xác nhận</Button>
                <Button size="small" color="warning" onClick={() => openReschedule(a)}>Xếp lại</Button>
                <Button size="small" color="error" onClick={() => updateStatus(a.id, 'cancelled')}>Huỷ</Button>
              </Stack>
            </Stack>
          </Paper>
        ))}
      </Stack>

      <Dialog open={!!openRe} onClose={() => setOpenRe(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Xếp lại lịch hẹn</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField type="date" label="Ngày" value={reDate} onChange={(e) => setReDate(e.target.value)} InputLabelProps={{ shrink: true }} />
            <TextField type="time" label="Giờ" value={reTime} onChange={(e) => setReTime(e.target.value)} InputLabelProps={{ shrink: true }} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRe(null)}>Hủy</Button>
          <Button variant="contained" onClick={doReschedule}>Lưu</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const AdminLayout: React.FC = () => {
  const { logout, user } = useAuth();

  const drawer = (
    <div>
      <Toolbar />
      <Box sx={{ overflow: 'auto' }}>
        <List>
          <ListItem disablePadding component={Link} to="dashboard">
            <ListItemButton><ListItemIcon><BarChartIcon /></ListItemIcon><ListItemText primary="Bảng điều khiển" /></ListItemButton>
          </ListItem>
          <ListItem disablePadding component={Link} to="clinic-profile">
            <ListItemButton><ListItemIcon><SettingsIcon /></ListItemIcon><ListItemText primary="Hồ sơ Phòng khám" /></ListItemButton>
          </ListItem>
          <ListItem disablePadding component={Link} to="doctors">
            <ListItemButton><ListItemIcon><GroupIcon /></ListItemIcon><ListItemText primary="Quản lý Bác sĩ" /></ListItemButton>
          </ListItem>
          <ListItem disablePadding component={Link} to="working-schedule">
            <ListItemButton><ListItemIcon><ScheduleIcon /></ListItemIcon><ListItemText primary="Lịch làm việc" /></ListItemButton>
          </ListItem>
          <ListItem disablePadding component={Link} to="catalogs">
            <ListItemButton><ListItemIcon><CategoryIcon /></ListItemIcon><ListItemText primary="Danh mục" /></ListItemButton>
          </ListItem>
          <ListItem disablePadding component={Link} to="appointments">
            <ListItemButton><ListItemIcon><ListAltIcon /></ListItemIcon><ListItemText primary="Lịch hẹn" /></ListItemButton>
          </ListItem>
        </List>
      </Box>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }} elevation={1}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>ClinicBook (Admin BV)</Typography>
          <Typography sx={{ mr: 2 }}>Chào, {user?.username}</Typography>
          <IconButton color="inherit" onClick={logout}><LogoutIcon /></IconButton>
        </Toolbar>
      </AppBar>
      <Drawer variant="permanent" sx={{ width: drawerWidth, flexShrink: 0, [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' } }}>
        {drawer}
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Paper sx={{ p: 3 }}>
          <Routes>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="clinic-profile" element={<ClinicProfilePage />} />
            <Route path="doctors" element={<ManageDoctorsPage />} />
            <Route path="working-schedule" element={<WorkingScheduleConfigPage />} />
            <Route path="catalogs" element={<AdminCatalogsPage />} />
            <Route path="appointments" element={<ManageAppointmentsPage />} />
          </Routes>
        </Paper>
      </Box>
    </Box>
  );
}

// ==================================================================
// FILE: src/layouts/SuperAdminLayout.tsx (Đã gộp vào đây)
// ==================================================================

// (legacy placeholders removed; replaced by SuperAdminStats/ManageClinicsPage/CatalogsPage/SystemSettingsPage)

const SuperAdminLayout: React.FC = () => {
  const { logout, user } = useAuth();

  // --- Super Admin pages ---
  const SuperAdminStats: React.FC = () => {
    const metrics = [
      { label: 'Tổng phòng khám', value: 42, icon: <BusinessIcon color="primary" /> },
      { label: 'Tổng lượt đặt tháng', value: 1530, icon: <AnalyticsIcon color="success" /> },
      { label: 'Đang chờ duyệt', value: 5, icon: <LocalHospitalIcon color="warning" /> },
      { label: 'Bị khoá', value: 2, icon: <LockIcon color="error" /> },
    ];
    return (
      <Box>
        <Typography variant="h5" fontWeight="bold" gutterBottom>Tổng quan hệ thống</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
          {metrics.map((m, i) => (
            <Paper key={i} sx={{ p: 2, borderRadius: 3 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>{m.icon}<Typography variant="body2" color="text.secondary">{m.label}</Typography></Stack>
              <Typography variant="h5" fontWeight="bold">{m.value}</Typography>
            </Paper>
          ))}
        </Box>
      </Box>
    );
  };

  const ManageClinicsPage: React.FC = () => {
    const [clinics, setClinics] = useState<ClinicAccount[]>([
      { id: 'c1', name: 'PK Đa khoa A', ownerEmail: 'ownerA@clinic.com', status: 'approved' },
      { id: 'c2', name: 'PK Nhi B', ownerEmail: 'ownerB@clinic.com', status: 'pending' },
      { id: 'c3', name: 'PK Tim mạch C', ownerEmail: 'ownerC@clinic.com', status: 'locked' },
    ]);
    const [openAdd, setOpenAdd] = useState(false);
    const [form, setForm] = useState<ClinicAccount>({ id: '', name: '', ownerEmail: '', status: 'pending' });

    const approve = (id: string) => setClinics(cs => cs.map(c => c.id === id ? { ...c, status: 'approved' } : c));
    const lock = (id: string) => setClinics(cs => cs.map(c => c.id === id ? { ...c, status: 'locked' } : c));
    const remove = (id: string) => setClinics(cs => cs.filter(c => c.id !== id));
    const create = () => {
      setClinics(cs => [{ ...form, id: `c${Date.now()}` }, ...cs]);
      setOpenAdd(false);
    };

    const statusChip = (s: ClinicStatus) => (
      <Chip
        size="small"
        label={s === 'approved' ? 'Đã duyệt' : s === 'locked' ? 'Khoá' : 'Chờ duyệt'}
        color={s === 'approved' ? 'success' : s === 'locked' ? 'error' : 'warning'}
        variant="outlined"
      />
    );

    return (
      <Box>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="h5" fontWeight="bold">Quản lý Phòng khám</Typography>
          <Button startIcon={<AddIcon />} variant="contained" onClick={() => setOpenAdd(true)}>Tạo phòng khám</Button>
        </Stack>
        <Stack spacing={1.5}>
          {clinics.map(c => (
            <Paper key={c.id} sx={{ p: 1.5, borderRadius: 2 }}>
              <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ md: 'center' }} justifyContent="space-between">
                <Stack>
                  <Typography fontWeight="600">{c.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{c.ownerEmail}</Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  {statusChip(c.status)}
                  {c.status !== 'approved' && <Button size="small" onClick={() => approve(c.id)}>Duyệt</Button>}
                  {c.status !== 'locked' && <Button size="small" color="warning" onClick={() => lock(c.id)}>Khoá</Button>}
                  <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => remove(c.id)}>Xoá</Button>
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>

        <Dialog open={openAdd} onClose={() => setOpenAdd(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Tạo phòng khám</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2}>
              <TextField label="Tên phòng khám" fullWidth value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
              <TextField label="Email chủ sở hữu" fullWidth value={form.ownerEmail} onChange={(e) => setForm(f => ({ ...f, ownerEmail: e.target.value }))} />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenAdd(false)}>Hủy</Button>
            <Button variant="contained" onClick={create}>Tạo</Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  };

  // Catalogs page moved to Admin

  const SystemSettingsPage: React.FC = () => {
    const [settings, setSettings] = useState<SystemSetting[]>([
      { key: 'allowSelfSignup', label: 'Cho phép phòng khám tự đăng ký', enabled: true },
      { key: 'requireApproval', label: 'Yêu cầu duyệt trước khi hoạt động', enabled: true },
      { key: 'enablePayments', label: 'Bật thanh toán online', enabled: false },
    ]);
    const toggle = (key: string) => setSettings(ss => ss.map(s => s.key === key ? { ...s, enabled: !s.enabled } : s));

    const [roles] = useState<string[]>(['super_admin', 'admin_hospital', 'doctor', 'patient']);
    const [assign, setAssign] = useState({ email: '', role: 'admin_hospital' });

    const saveAssign = () => {
      alert(`Gán vai trò ${assign.role} cho ${assign.email} (mock)`);
      setAssign({ email: '', role: 'admin_hospital' });
    };

    return (
      <Box>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <SettingsApplicationsIcon color="primary" />
          <Typography variant="h5" fontWeight="bold">Cấu hình hệ thống</Typography>
        </Stack>
        <Paper sx={{ p: 2, borderRadius: 3, mb: 2 }}>
          <Typography variant="subtitle1" fontWeight="600" gutterBottom>Cờ cấu hình</Typography>
          <Stack spacing={1.5}>
            {settings.map(s => (
              <Paper key={s.key} variant="outlined" sx={{ p: 1.5, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography>{s.label}</Typography>
                <Switch checked={s.enabled} onChange={() => toggle(s.key)} />
              </Paper>
            ))}
          </Stack>
        </Paper>
        <Paper sx={{ p: 2, borderRadius: 3 }}>
          <Typography variant="subtitle1" fontWeight="600" gutterBottom>Phân quyền nhanh</Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
            <TextField label="Email người dùng" fullWidth value={assign.email} onChange={(e) => setAssign(a => ({ ...a, email: e.target.value }))} />
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Vai trò</InputLabel>
              <Select label="Vai trò" value={assign.role} onChange={(e) => setAssign(a => ({ ...a, role: e.target.value }))}>
                {roles.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
              </Select>
            </FormControl>
            <Button variant="contained" onClick={saveAssign}>Gán</Button>
          </Stack>
        </Paper>
      </Box>
    );
  };

  const drawer = (
    <div>
      <Toolbar />
      <Box sx={{ overflow: 'auto' }}>
        <List>
          <ListItem disablePadding component={Link} to="dashboard">
            <ListItemButton>
              <ListItemIcon><BarChartIcon /></ListItemIcon>
              <ListItemText primary="Bảng điều khiển" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding component={Link} to="clinics">
            <ListItemButton>
              <ListItemIcon><BusinessIcon /></ListItemIcon>
              <ListItemText primary="Quản lý Phòng khám" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding component={Link} to="settings">
            <ListItemButton>
              <ListItemIcon><SettingsApplicationsIcon /></ListItemIcon>
              <ListItemText primary="Cấu hình hệ thống" />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }} elevation={1}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>ClinicBook (Super Admin)</Typography>
          <Typography sx={{ mr: 2 }}>Chào, {user?.username}</Typography>
          <IconButton color="inherit" onClick={logout}><LogoutIcon /></IconButton>
        </Toolbar>
      </AppBar>
      <Drawer variant="permanent" sx={{ width: drawerWidth, flexShrink: 0, [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' } }}>
        {drawer}
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Paper sx={{ p: 3 }}>
          <Routes>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<SuperAdminStats />} />
            <Route path="clinics" element={<ManageClinicsPage />} />
            <Route path="settings" element={<SystemSettingsPage />} />
          </Routes>
        </Paper>
      </Box>
    </Box>
  );
};

// ==================================================================
// FILE: src/App.tsx (Phần logic chính)
// ==================================================================

/**
 * Component "Gác cổng". 
 * Nhiệm vụ: Check xem đã login chưa.
 * - Nếu chưa: Đá về /login
 * - Nếu rồi: Render đúng Layout dựa trên 'role'
 */
const AppGatekeeper: React.FC = () => {
  const { user, loading } = useAuth();

  // 1. Đang check token...
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // 2. Check xong, không có user
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        {/* Bất cứ đường dẫn nào khác, đá về /login */}
        <Route path="*" element={<Navigate to="/login" replace />} /> 
      </Routes>
    );
  }

  // 3. Check xong, có user
  // Rẽ nhánh dựa trên `user.role`
  return (
    <Routes>
      {user.role === 'patient' && (
        // `path="/*"` có nghĩa là PatientLayout sẽ xử lý tất cả các route con 
        // (ví dụ: /home, /search... nhưng PatientLayout này dùng State, không dùng route)
        <Route path="/*" element={<PatientLayout />} />
      )}
      
      {user.role === 'doctor' && (
        // `path="/*"` có nghĩa là DoctorLayout sẽ xử lý các route con
        // (ví dụ: /, /schedule)
        <Route path="/*" element={<DoctorLayout />} />
      )}
      
      {user.role === 'admin_hospital' && (
        // `path="/*"` có nghĩa là AdminLayout sẽ xử lý các route con
        // (ví dụ: /, /manage-doctors)
        <Route path="/*" element={<AdminLayout />} />
      )}
      
      {user.role === 'super_admin' && (
        // `path="/*"` có nghĩa là SuperAdminLayout sẽ xử lý các route con
        // (ví dụ: /, /manage-hospitals)
        <Route path="/*" element={<SuperAdminLayout />} />
      )}

      {/* Nếu 1 thằng đã login (ví dụ là patient) nhưng cố vào /login
        hoặc 1 thằng có role 'abc' (lạ)
        -> Đá nó về / (trang chủ của role nó) hoặc về /login
      */}
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Typography>Role không xác định!</Typography>} />
    </Routes>
  );
};

// --- Component App chính (bọc mọi thứ) ---
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
            <AppGatekeeper />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
