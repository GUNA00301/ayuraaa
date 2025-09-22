import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI, Chat } from "@google/genai";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';


// --- MOCK BACKEND API SERVICE --- //

const apiService = {
  // Initialize with a default user if none exist
  _initializeDB: () => {
    if (!localStorage.getItem('users')) {
      const defaultUser = {
        mobileNumber: '1234567890',
        password: 'password',
        details: {
          name: 'Mr Guna',
          age: 45,
          email: 'mr.guna@example.com',
          condition: 'Chronic Back Pain',
        },
        medicalHistory: {
          pastConditions: 'Sciatica, Mild Hypertension',
          previousTreatments: 'Physical Therapy',
          allergies: 'None',
        },
        appointments: [],
        analytics: {
            treatmentCompletion: 75,
            totalSessions: 12,
            completedSessions: 9,
            remainingSessions: 3,
            weeklyPerformance: [
                { name: 'Week 1', progress: 30 },
                { name: 'Week 2', progress: 50 },
                { name: 'Week 3', progress: 40 },
                { name: 'Week 4', progress: 60 },
            ],
            vitals: {
                wellnessScore: 82,
                bloodPressure: '120/80',
                heartRate: '72 bpm',
                sleepQuality: '7h 30m',
            }
        }
      };
      localStorage.setItem('users', JSON.stringify({ '1234567890': defaultUser }));
    }
  },

  // Simulates a network delay
  _delay: (ms: number) => new Promise(res => setTimeout(res, ms)),

  // --- User Management --- //
  async login(mobileNumber: string, password: string): Promise<{ success: boolean; user?: any; message: string }> {
    await this._delay(1000);
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    const user = users[mobileNumber];
    if (user && user.password === password) {
      sessionStorage.setItem('currentUser', mobileNumber);
      return { success: true, user: { name: user.details.name, mobileNumber: user.mobileNumber }, message: 'Login successful.' };
    }
    return { success: false, message: 'Invalid mobile number or password.' };
  },

  async createAccount(userData: any): Promise<{ success: boolean; user?: any; message: string }> {
    await this._delay(1500);
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    if (users[userData.mobileNumber]) {
        return { success: false, message: 'A user with this mobile number already exists.' };
    }

    const newUser = {
        mobileNumber: userData.mobileNumber,
        password: userData.password,
        details: {
            name: userData.name,
            age: userData.age,
            email: userData.email,
            condition: userData.condition,
        },
        medicalHistory: {
            pastConditions: userData.pastConditions,
            previousTreatments: userData.previousTreatments,
            allergies: userData.allergies,
        },
        appointments: [],
        analytics: { // Default analytics for new user
            treatmentCompletion: 0,
            totalSessions: 0,
            completedSessions: 0,
            remainingSessions: 0,
            weeklyPerformance: [],
             vitals: {
                wellnessScore: 70,
                bloodPressure: 'N/A',
                heartRate: 'N/A',
                sleepQuality: 'N/A',
            }
        }
    };

    users[userData.mobileNumber] = newUser;
    localStorage.setItem('users', JSON.stringify(users));
    sessionStorage.setItem('currentUser', userData.mobileNumber); // Auto-login

    return { success: true, user: { name: newUser.details.name, mobileNumber: newUser.mobileNumber }, message: 'Account created successfully!' };
  },

  logout() {
    sessionStorage.removeItem('currentUser');
  },

  getCurrentUserMobileNumber(): string | null {
      return sessionStorage.getItem('currentUser');
  },

  // --- Data Fetching & Updating --- //
  async getPatientDetails(): Promise<any> {
    await this._delay(800);
    const mobileNumber = this.getCurrentUserMobileNumber();
    if (!mobileNumber) return null;
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    const user = users[mobileNumber];
    return { ...user.details, medicalHistory: user.medicalHistory };
  },

  async updatePatientDetails(updatedDetails: any): Promise<boolean> {
      await this._delay(1000);
      const mobileNumber = this.getCurrentUserMobileNumber();
      if (!mobileNumber) return false;
      const users = JSON.parse(localStorage.getItem('users') || '{}');
      users[mobileNumber].details = {
          name: updatedDetails.name,
          age: updatedDetails.age,
          email: updatedDetails.email,
          condition: updatedDetails.condition,
      };
      users[mobileNumber].medicalHistory = updatedDetails.medicalHistory;
      localStorage.setItem('users', JSON.stringify(users));
      return true;
  },
  
  async getAppointments(): Promise<any[]> {
    await this._delay(500);
    const mobileNumber = this.getCurrentUserMobileNumber();
    if (!mobileNumber) return [];
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    return users[mobileNumber]?.appointments || [];
  },

  async bookAppointment(appointment: any): Promise<boolean> {
      await this._delay(1000);
      const mobileNumber = this.getCurrentUserMobileNumber();
      if (!mobileNumber) return false;
      const users = JSON.parse(localStorage.getItem('users') || '{}');
      const newAppointmentWithMeta = {
          ...appointment,
          id: Date.now(),
          status: 'upcoming' as const,
      };
      users[mobileNumber].appointments.push(newAppointmentWithMeta);
      localStorage.setItem('users', JSON.stringify(users));
      return true;
  },
    
  async updateAppointmentStatus(appointmentId: number, status: 'confirmed' | 'completed'): Promise<boolean> {
      await this._delay(500);
      const mobileNumber = this.getCurrentUserMobileNumber();
      if (!mobileNumber) return false;
      const users = JSON.parse(localStorage.getItem('users') || '{}');
      const user = users[mobileNumber];
      if (!user || !user.appointments) return false;

      const appointmentIndex = user.appointments.findIndex((app: any) => app.id === appointmentId);
      if (appointmentIndex === -1) return false;

      user.appointments[appointmentIndex].status = status;
      localStorage.setItem('users', JSON.stringify(users));
      return true;
  },

  async getAnalyticsData(): Promise<any> {
      await this._delay(1200);
      const mobileNumber = this.getCurrentUserMobileNumber();
      if (!mobileNumber) return null;
      const users = JSON.parse(localStorage.getItem('users') || '{}');
      return users[mobileNumber]?.analytics || {};
  }
};

// Initialize DB on script load
apiService._initializeDB();


// --- TYPE DEFINITIONS --- //
type Page = 'Home' | 'Analysis' | 'Schedule' | 'History' | 'Settings' | 'Profile';
type AuthStatus = 'welcome' | 'login' | 'createAccount' | 'loggedIn';

interface Appointment {
  id: number;
  therapies: Therapy[];
  date: string;
  time: string;
  bookedAt: string;
  centerRating?: number;
  status?: 'upcoming' | 'confirmed' | 'completed';
}

interface Therapy {
  name: string;
  duration: number;
  image: string;
}

// --- MOCK DATA --- //
const ALL_THERAPIES: Therapy[] = [
    { name: 'KARAMA', duration: 45, image: 'https://img.freepik.com/free-photo/ayurveda-spa-treatment-still-life_23-2150910087.jpg' },
    { name: 'ENEMA', duration: 60, image: 'https://img.freepik.com/free-photo/beautiful-spa-composition-wooden-background_1150-19253.jpg' },
    { name: 'VIRECHANA', duration: 40, image: 'https://img.freepik.com/free-photo/spa-treatment-with-herbal-compress-balls-rose-petals-oil_1150-13793.jpg' },
    { name: 'VAMANA', duration: 25, image: 'https://img.freepik.com/free-photo/ayurveda-spa-treatment-still-life_23-2150910085.jpg' },
    { name: 'BASTI', duration: 50, image: 'https://img.freepik.com/free-photo/natural-ayurvedic-medicine-still-life_23-2150910129.jpg' },
    { name: 'VASTI', duration: 55, image: 'https://img.freepik.com/free-photo/ayurveda-spa-treatment-still-life_23-2150910091.jpg' }
];


// --- UTILITY COMPONENTS --- //
const PhoneFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="phone-frame">{children}</div>
);

const MobileHeader: React.FC<{ title: string; onBack?: () => void }> = ({ title, onBack }) => (
  <header className="mobile-header">
    {onBack && <button onClick={onBack} className="back-button">{'<'}</button>}
    <h1>{title}</h1>
  </header>
);

const HomeHeader: React.FC<{ userName: string; onProfileClick: () => void; onSosClick: () => void; }> = ({ userName, onProfileClick, onSosClick }) => (
  <header className="home-header">
      <div className="header-top">
          <div className="header-greeting">
              <button className="menu-button">☰</button>
              <span>Hi, {userName}</span>
          </div>
          <div className="header-icons">
              <button className="icon-button" onClick={onSosClick}>🆘</button>
              <button className="icon-button">🔔</button>
              <button className="icon-button" onClick={onProfileClick}>👤</button>
          </div>
      </div>
      <div className="search-bar-container">
          <input type="text" placeholder="Search" className="search-input" />
          <span className="search-icon">🔍</span>
          <span className="mic-icon">🎤</span>
      </div>
  </header>
);

const BottomNavBar: React.FC<{ activePage: Page; onNavigate: (page: Page) => void }> = ({ activePage, onNavigate }) => {
  const navItems: { page: Page; label: string; icon: string }[] = [
    { page: 'Home', label: 'Home', icon: '🏠' },
    { page: 'Analysis', label: 'Analysis', icon: '📊' },
    { page: 'Schedule', label: 'Schedule', icon: '➕' },
    { page: 'History', label: 'History', icon: '📜' },
    { page: 'Settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map(({ page, label, icon }) => (
        <button
          key={page}
          className={`nav-item ${activePage === page ? 'active' : ''} ${page === 'Schedule' ? 'nav-item-add' : ''}`}
          onClick={() => onNavigate(page)}
        >
          <div className="nav-icon">{icon}</div>
          <div className="nav-label">{label}</div>
        </button>
      ))}
    </nav>
  );
};

const ConfirmationModal: React.FC<{ show: boolean; onConfirm: () => void; onCancel: () => void; appointmentDetails: { therapies: Therapy[], date: string, time: string } }> = ({ show, onConfirm, onCancel, appointmentDetails }) => {
    if (!show) return null;
    return (
        <div className="modal-overlay">
            <div className="confirmation-modal">
                <h2>Confirm Appointment</h2>
                <div className="modal-content">
                    <p><strong>Therapies:</strong> {appointmentDetails.therapies.map(t => t.name).join(', ')}</p>
                    <p><strong>Date:</strong> {appointmentDetails.date}</p>
                    <p><strong>Time:</strong> {appointmentDetails.time}</p>
                </div>
                <div className="modal-actions">
                    <button onClick={onCancel} className="btn-secondary">Cancel</button>
                    <button onClick={onConfirm} className="btn-primary">Confirm</button>
                </div>
            </div>
        </div>
    );
};

const StarRating: React.FC<{ count: number; rating: number; onRating: (rate: number) => void; readOnly?: boolean }> = ({ count, rating, onRating, readOnly = false }) => {
    return (
        <div className={`star-rating ${readOnly ? 'read-only' : ''}`}>
            {[...Array(count)].map((_, i) => (
                <span key={i} onClick={() => !readOnly && onRating(i + 1)}>
                    {i < rating ? <span className="star-filled">★</span> : <span className="star-empty">☆</span>}
                </span>
            ))}
        </div>
    );
};

const AppointmentReminder: React.FC<{
    appointment: Appointment;
    onConfirm: () => void;
    onReschedule: () => void;
    onDismiss: () => void;
}> = ({ appointment, onConfirm, onReschedule, onDismiss }) => {
    const therapyNames = appointment.therapies.map(t => t.name).join(', ');
    const appointmentDate = new Date(appointment.date.replace(/-/g, '/')).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    
    return (
        <div className="appointment-reminder-banner">
            <div className="reminder-content">
                <h4>🔔 Appointment Reminder</h4>
                <p>You have an upcoming session for <strong>{therapyNames}</strong> on {appointmentDate} at {appointment.time}.</p>
            </div>
            <div className="reminder-actions">
                <button onClick={onConfirm} className="btn-confirm">Confirm</button>
                <button onClick={onReschedule} className="btn-reschedule">Reschedule</button>
            </div>
            <button onClick={onDismiss} className="dismiss-button">&times;</button>
        </div>
    );
};


// --- AUTHENTICATION PAGES --- //

const WelcomePage: React.FC<{ onNavigateToLogin: () => void; onNavigateToCreateAccount: () => void }> = ({ onNavigateToLogin, onNavigateToCreateAccount }) => {
    return (
        <div className="welcome-page">
            <div className="logo-container">
                <svg width="60" height="60" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H8v-2h3V7h2v4h3v2h-3v4h-2z" fill="none"/>
                    <path d="M17.68,8.19c-0.27,-1.23 -0.88,-2.32 -1.74,-3.18c-0.86,-0.86 -1.95,-1.47 -3.18,-1.74c-0.45,-0.1 -0.91,-0.15 -1.37,-0.15c-1.38,0 -2.69,0.56 -3.65,1.52c-0.96,0.96 -1.52,2.27 -1.52,3.65c0,0.45 0.05,0.92 0.15,1.37c0.27,1.23 0.88,2.32 1.74,3.18c0.86,0.86 1.95,1.47 3.18,1.74c0.45,0.1 0.91,0.15 1.37,0.15c1.38,0 2.69,-0.56 3.65,-1.52c0.96,-0.96 1.52,-2.27 1.52,-3.65c0,-0.45 -0.05,-0.92 -0.15,-1.37zM12,14.5c-1.38,0 -2.5,-1.12 -2.5,-2.5s1.12,-2.5 2.5,-2.5s2.5,1.12 2.5,2.5s-1.12,2.5 -2.5,2.5z" fill="none"/>
                    <path d="M12 22C6.48 22 2 17.52 2 12C2 6.48 6.48 2 12 2s10 4.48 10 10c0 5.52-4.48 10-10 10zm0-18c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8zm-3.6 5.52c-1.12 1.12-1.12 2.92 0 4.04s2.92 1.12 4.04 0L12 12l-3.6-3.48zM12.8 15.2l3.6 3.6c1.12-1.12 1.12-2.92 0-4.04s-2.92-1.12-4.04 0L12 12l.8.8z" fill="#FFFFFF" />
                </svg>
                <h1>AYURA</h1>
            </div>
            <div className="welcome-content">
                <h2>Welcome to Ayura</h2>
                <p>Discover Natural Healing and Balance with Authentic Ayura!</p>
            </div>
            <div className="welcome-actions">
                <button onClick={onNavigateToLogin} className="btn-primary">Login</button>
                <a href="#" onClick={(e) => { e.preventDefault(); onNavigateToCreateAccount(); }}>Create an Account</a>
            </div>
        </div>
    );
};

const LoginPage: React.FC<{ onLoginSuccess: (user: any) => void; onBack: () => void; }> = ({ onLoginSuccess, onBack }) => {
    const [mobileNumber, setMobileNumber] = useState('1234567890');
    const [password, setPassword] = useState('password');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        const result = await apiService.login(mobileNumber, password);
        if (result.success) {
            onLoginSuccess(result.user);
        } else {
            setError(result.message);
        }
        setIsLoading(false);
    };

    return (
        <div className="login-page">
            <MobileHeader title="Login" onBack={onBack} />
            <form className="login-form" onSubmit={handleLogin}>
                <div className="form-group">
                    <label htmlFor="mobile">Mobile Number</label>
                    <input id="mobile" type="text" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                {error && <p className="error-message">{error}</p>}
                <button type="submit" className="btn-primary" disabled={isLoading}>{isLoading ? 'Logging in...' : 'Login'}</button>
                <a href="#" className="forgot-password">Forgot your login details?</a>
            </form>
        </div>
    );
};

const CreateAccountPage: React.FC<{ onCreateSuccess: (user: any) => void; onBack: () => void; }> = ({ onCreateSuccess, onBack }) => {
    const [formData, setFormData] = useState({
        name: '', age: '', email: '', mobileNumber: '', password: '', condition: '',
        pastConditions: '', previousTreatments: '', allergies: '',
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCreateAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        // Simple validation
        for (const key in formData) {
            if (formData[key as keyof typeof formData].trim() === '') {
                setError(`Please fill out the ${key} field.`);
                return;
            }
        }
        setIsLoading(true);
        setError('');
        const result = await apiService.createAccount(formData);
        if (result.success) {
            onCreateSuccess(result.user);
        } else {
            setError(result.message);
        }
        setIsLoading(false);
    };

    return (
        <div className="create-account-page">
            <MobileHeader title="Create Account" onBack={onBack} />
            <form className="create-account-form" onSubmit={handleCreateAccount}>
                 <div className="form-group">
                    <label>Full Name</label>
                    <input name="name" type="text" value={formData.name} onChange={handleChange} />
                </div>
                 <div className="form-group">
                    <label>Age</label>
                    <input name="age" type="number" value={formData.age} onChange={handleChange} />
                </div>
                 <div className="form-group">
                    <label>Email</label>
                    <input name="email" type="email" value={formData.email} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label>Mobile Number</label>
                    <input name="mobileNumber" type="text" value={formData.mobileNumber} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label>Password</label>
                    <input name="password" type="password" value={formData.password} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label>Primary Health Condition</label>
                    <input name="condition" type="text" value={formData.condition} onChange={handleChange} />
                </div>
                 <div className="form-group">
                    <label>Past Conditions</label>
                    <input name="pastConditions" type="text" value={formData.pastConditions} onChange={handleChange} />
                </div>
                 <div className="form-group">
                    <label>Previous Treatments</label>
                    <input name="previousTreatments" type="text" value={formData.previousTreatments} onChange={handleChange} />
                </div>
                 <div className="form-group">
                    <label>Allergies</label>
                    <input name="allergies" type="text" value={formData.allergies} onChange={handleChange} />
                </div>
                {error && <p className="error-message">{error}</p>}
                <button type="submit" className="btn-primary" disabled={isLoading}>{isLoading ? 'Creating Account...' : 'Create Account'}</button>
            </form>
        </div>
    );
};


// --- MAIN APPLICATION PAGES --- //

const HomePage: React.FC<{ userName: string; onNavigate: (page: Page) => void; onLaunchChat: () => void; }> = ({ userName, onNavigate, onLaunchChat }) => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAppointments = async () => {
            const data = await apiService.getAppointments();
            setAppointments(data);
            setLoading(false);
        };
        fetchAppointments();
    }, []);

    const handleSos = () => {
        // This would be handled by the main App component's notification system
        // For now, we can just log it.
        console.log("SOS Clicked!");
    };

    return (
        <div className="mobile-content">
            <h3 className="section-title">Upcoming Schedulings</h3>
            {loading ? <p>Loading appointments...</p> : (
                appointments.length > 0 ? (
                    <div className="appointments-carousel">
                        {appointments.slice(0, 4).map((app, index) => (
                            <div key={index} className="appointment-preview-card">
                                <img src={app.therapies[0]?.image || ''} alt={app.therapies[0]?.name}/>
                                <h4>{app.therapies.map(t => t.name).join(', ')}</h4>
                                <p className="appointment-date">{new Date(app.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: '2-digit' })}</p>
                                <p>{app.time}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="discover-therapies-container">
                        <p className="no-appointments-message">No upcoming schedulings. Discover our therapies!</p>
                        <div className="discover-carousel">
                            {ALL_THERAPIES.slice(0, 4).map(therapy => (
                                <div key={therapy.name} className="discover-therapy-card" onClick={() => onNavigate('Schedule')}>
                                    <img src={therapy.image} alt={therapy.name}/>
                                    <h4>{therapy.name}</h4>
                                    <p>{therapy.duration} min</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            )}

            <div className="promo-banner">
                <div className="promo-content">
                    <p>Panchakarma Treatment for Weight Management</p>
                </div>
                <img src="https://plus.unsplash.com/premium_photo-1661281397737-9b5d75b52beb?q=80&w=2070&auto=format&fit=crop" alt="Promo"/>
            </div>
             <button className="floating-ai-button" onClick={onLaunchChat}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8-8zM8.5 12.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5zm7 0c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5zM12 8c-1.66 0-3 1.34-3 3h2c0-.55.45-1 1-1s1 .45 1 1h2c0-1.66-1.34-3-3-3z"/>
                </svg>
            </button>
        </div>
    );
};

const AnalysisPageContent = () => {
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(true);

     useEffect(() => {
        const fetchAnalytics = async () => {
            const data = await apiService.getAnalyticsData();
            setAnalytics(data);
            setLoading(false);
        };
        fetchAnalytics();
    }, []);

    if (loading) {
        return <div className="mobile-content"><p>Loading analytics...</p></div>;
    }

    if (!analytics) {
         return <div className="mobile-content"><p>No analytics data available.</p></div>;
    }

    return (
        <div className="analysis-page mobile-content">
            <div className="analysis-card">
                <h3>Overall Progress</h3>
                <p>Treatment Completion: {analytics.treatmentCompletion}%</p>
                <div className="progress-bar-container">
                    <div className="progress-bar" style={{ width: `${analytics.treatmentCompletion}%` }}></div>
                </div>
            </div>

            <div className="analysis-card">
                <h3>Key Metrics</h3>
                <div className="metrics-container">
                    <div className="metric-box">
                        <h4>{analytics.totalSessions}</h4>
                        <p>Total Sessions</p>
                    </div>
                     <div className="metric-box">
                        <h4>{analytics.completedSessions}</h4>
                        <p>Completed</p>
                    </div>
                     <div className="metric-box">
                        <h4>{analytics.remainingSessions}</h4>
                        <p>Remaining</p>
                    </div>
                </div>
            </div>

             <div className="analysis-card">
                <h3>Patient Vitals</h3>
                <div className="vitals-grid">
                    <div className="vital-item">
                        <h4>{analytics.vitals.wellnessScore}</h4>
                        <p>Wellness Score</p>
                    </div>
                     <div className="vital-item">
                        <h4>{analytics.vitals.bloodPressure}</h4>
                        <p>Blood Pressure</p>
                    </div>
                     <div className="vital-item">
                        <h4>{analytics.vitals.heartRate}</h4>
                        <p>Heart Rate</p>
                    </div>
                     <div className="vital-item">
                        <h4>{analytics.vitals.sleepQuality}</h4>
                        <p>Sleep Quality</p>
                    </div>
                </div>
            </div>

            <div className="analysis-card">
                <h3>Overall Week Performance</h3>
                <div className="chart-container" style={{ width: '100%', height: 200 }}>
                    <ResponsiveContainer>
                        <LineChart data={analytics.weeklyPerformance}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="progress" stroke="#0A4F43" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};


const SchedulingPage: React.FC<{ onBookingComplete: () => void }> = ({ onBookingComplete }) => {
    const [step, setStep] = useState(1);
    const [selectedTherapies, setSelectedTherapies] = useState<Therapy[]>([]);
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [selectedTime, setSelectedTime] = useState<string>('');
    const [centerRating, setCenterRating] = useState(0);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [isBooking, setIsBooking] = useState(false);

    const toggleTherapy = (therapy: Therapy) => {
        setSelectedTherapies(prev =>
            prev.find(t => t.name === therapy.name)
                ? prev.filter(t => t.name !== therapy.name)
                : [...prev, therapy]
        );
    };

    const handleDateSelect = (day: number) => {
        // Simple date construction for example purposes
        const date = new Date(2025, 8, day).toISOString().split('T')[0]; // September 2025
        setSelectedDate(date);
    };

    const handleNextStep = () => {
        if (step === 1 && selectedTherapies.length > 0) setStep(2);
    };
    
    const handleBookNow = () => {
        if (selectedDate && selectedTime) {
            setShowConfirmation(true);
        } else {
            alert('Please select a date and time.');
        }
    };
    
    const handleConfirmBooking = () => {
        setShowConfirmation(false);
        setStep(3); // Proceed to rating step
    };

    const handleFinishBooking = async () => {
        setIsBooking(true);
        const newAppointment = {
            therapies: selectedTherapies,
            date: selectedDate,
            time: selectedTime,
            bookedAt: new Date().toISOString(),
            centerRating: centerRating,
        };
        const success = await apiService.bookAppointment(newAppointment);
        if (success) {
            onBookingComplete();
        } else {
            alert('Failed to book appointment.');
        }
        setIsBooking(false);
    };
    
    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div>
                        <h3>Therapy Types</h3>
                        <div className="therapy-grid">
                            {ALL_THERAPIES.map(therapy => (
                                <div key={therapy.name} className={`therapy-card ${selectedTherapies.find(t=>t.name === therapy.name) ? 'selected' : ''}`} onClick={() => toggleTherapy(therapy)}>
                                    <img src={therapy.image} alt={therapy.name} />
                                    <h4>{therapy.name}</h4>
                                    <p>{therapy.duration} min</p>
                                    <button className="add-button">+</button>
                                </div>
                            ))}
                        </div>
                        <button onClick={handleNextStep} className="btn-primary" disabled={selectedTherapies.length === 0}>Next</button>
                    </div>
                );
            case 2:
                 return (
                    <div>
                        <h3>September 2025</h3>
                        <div className="calendar-grid">
                            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => <div key={d} className="calendar-header">{d}</div>)}
                            {[...Array(30)].map((_, i) => <button key={i} className={`calendar-day ${new Date(2025, 8, i + 1).toISOString().split('T')[0] === selectedDate ? 'selected' : ''}`} onClick={() => handleDateSelect(i + 1)}>{i + 1}</button>)}
                        </div>
                        <h3 style={{marginTop: '1rem'}}>Time Slots Available</h3>
                        <div className="time-slot-grid">
                            {['8:00am', '10:00am', '12:00pm', '1:00pm', '3:00pm', '5:00pm'].map(time => (
                                <button key={time} className={`time-slot ${selectedTime === time ? 'selected' : ''}`} onClick={() => setSelectedTime(time)}>{time}</button>
                            ))}
                        </div>
                        <button onClick={handleBookNow} className="btn-primary" style={{marginTop: '1rem'}} disabled={!selectedDate || !selectedTime}>Book Now</button>
                    </div>
                );
             case 3:
                return (
                    <div className="rating-step-container">
                        <h3>Rate the Therapy Center</h3>
                        <StarRating count={5} rating={centerRating} onRating={setCenterRating} />
                        <button onClick={handleFinishBooking} className="btn-primary" disabled={isBooking || centerRating === 0}>
                            {isBooking ? 'Saving...' : 'Finish Booking'}
                        </button>
                    </div>
                );
            default:
                return null;
        }
    };
    
    return (
        <div className="scheduling-page mobile-content">
            {renderStep()}
             <ConfirmationModal 
                show={showConfirmation} 
                onCancel={() => setShowConfirmation(false)} 
                onConfirm={handleConfirmBooking}
                appointmentDetails={{ therapies: selectedTherapies, date: selectedDate, time: selectedTime }}
            />
        </div>
    );
};

const CalendarView: React.FC<{ appointments: Appointment[] }> = ({ appointments }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

    const appointmentsByDate = appointments.reduce((acc, app) => {
        // Correctly parse date string to avoid timezone issues by replacing hyphens with slashes
        const date = new Date(app.date.replace(/-/g, '/'));
        const dateKey = date.toDateString();
        if (!acc[dateKey]) {
            acc[dateKey] = [];
        }
        acc[dateKey].push(app);
        return acc;
    }, {} as Record<string, Appointment[]>);

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const days = [];
    let dayIterator = new Date(startOfMonth);
    dayIterator.setDate(dayIterator.getDate() - startOfMonth.getDay()); // Rewind to the first Sunday of the week

    // Create a 6-week (42 days) grid for a consistent layout
    for (let i = 0; i < 42; i++) {
        days.push(new Date(dayIterator));
        dayIterator.setDate(dayIterator.getDate() + 1);
    }

    const changeMonth = (offset: number) => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
    };

    const selectedAppointments = selectedDate ? appointmentsByDate[selectedDate.toDateString()] || [] : [];

    return (
        <div className="calendar-view-container">
            <div className="calendar-header">
                <button onClick={() => changeMonth(-1)}>&lt;</button>
                <h3>{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                <button onClick={() => changeMonth(1)}>&gt;</button>
            </div>
            <div className="calendar-grid-header">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
            </div>
            <div className="calendar-grid-view">
                {days.map((d, i) => {
                    const isCurrentMonth = d.getMonth() === currentDate.getMonth();
                    const isSelected = selectedDate?.toDateString() === d.toDateString();
                    const hasAppointment = !!appointmentsByDate[d.toDateString()];
                    const isToday = new Date().toDateString() === d.toDateString();

                    return (
                        <div
                            key={i}
                            className={`calendar-day-cell ${!isCurrentMonth ? 'other-month' : ''} ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                            onClick={() => setSelectedDate(d)}
                        >
                            <span>{d.getDate()}</span>
                            {hasAppointment && <div className="appointment-dot"></div>}
                        </div>
                    );
                })}
            </div>
             <div className="selected-day-appointments">
                {selectedDate && <h4>Appointments for {selectedDate.toDateString()}</h4>}
                {selectedAppointments.length > 0 ? selectedAppointments.map((app, index) => (
                    <div key={index} className="appointment-card-small">
                        <h5>{app.therapies.map(t => t.name).join(', ')}</h5>
                        <p>{app.time}</p>
                    </div>
                )) : selectedDate ? <p>No appointments on this day.</p> : <p>Select a date to see appointments.</p>}
            </div>
        </div>
    );
};


const HistoryPage: React.FC = () => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

    useEffect(() => {
        const fetchAppointments = async () => {
            const data = await apiService.getAppointments();
            data.sort((a, b) => new Date(b.bookedAt).getTime() - new Date(a.bookedAt).getTime());
            setAppointments(data);
            setLoading(false);
        };
        fetchAppointments();
    }, []);

    if (loading) {
        return <div className="mobile-content"><p>Loading history...</p></div>;
    }

    return (
        <div className="history-page mobile-content">
            <div className="view-toggle">
                <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')}>List</button>
                <button className={viewMode === 'calendar' ? 'active' : ''} onClick={() => setViewMode('calendar')}>Calendar</button>
            </div>
            
            {viewMode === 'list' ? (
                appointments.length > 0 ? appointments.map((app, index) => (
                    <div key={index} className="appointment-card">
                        <h4>{app.therapies.map(t => t.name).join(', ')}</h4>
                        <p className="appointment-details">Scheduled for: {new Date(app.date.replace(/-/g, '/')).toDateString()} at {app.time}</p>
                        <p className="booking-details">Booked on: {new Date(app.bookedAt).toLocaleString()}</p>
                        {app.centerRating && app.centerRating > 0 && (
                            <div className="rating-display">
                                <p>Your Rating:</p>
                                <StarRating count={5} rating={app.centerRating} onRating={() => {}} readOnly={true} />
                            </div>
                        )}
                    </div>
                )) : <p>No appointment history found.</p>
            ) : (
                <CalendarView appointments={appointments} />
            )}
        </div>
    );
};

const SettingsPage: React.FC = () => {
    return (
        <div className="settings-page">
            <ul className="settings-list">
                <li className="settings-item">Account <span>&gt;</span></li>
                <li className="settings-item">Notifications <span>&gt;</span></li>
                <li className="settings-item">Privacy <span>&gt;</span></li>
                <li className="settings-item">Security <span>&gt;</span></li>
                <li className="settings-item">Language <span>&gt;</span></li>
                <li className="settings-item">Help <span>&gt;</span></li>
                <li className="settings-item">About <span>&gt;</span></li>
            </ul>
        </div>
    );
};

const ProfilePage: React.FC<{ onBack: () => void; addNotification: (message: string) => void }> = ({ onBack, addNotification }) => {
    const [details, setDetails] = useState<any>(null);
    const [editableDetails, setEditableDetails] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            const data = await apiService.getPatientDetails();
            setDetails(data);
            setEditableDetails(JSON.parse(JSON.stringify(data))); // Deep copy
            setIsLoading(false);
        };
        fetchDetails();
    }, []);

    const handleEdit = () => setIsEditing(true);
    const handleCancel = () => {
        setEditableDetails(JSON.parse(JSON.stringify(details))); // Reset changes
        setIsEditing(false);
    };

    const handleSave = async () => {
        setIsLoading(true);
        const success = await apiService.updatePatientDetails(editableDetails);
        if (success) {
            setDetails(JSON.parse(JSON.stringify(editableDetails)));
            addNotification('Profile saved successfully!');
            setIsEditing(false);
        } else {
            addNotification('Failed to save profile.');
        }
        setIsLoading(false);
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, section: 'details' | 'medicalHistory') => {
        const { name, value } = e.target;
        if (section === 'details') {
            setEditableDetails((prev: any) => ({ ...prev, [name]: value }));
        } else {
             setEditableDetails((prev: any) => ({
                ...prev,
                medicalHistory: { ...prev.medicalHistory, [name]: value }
            }));
        }
    };

    if (isLoading && !details) {
        return <div className="mobile-content"><p>Loading profile...</p></div>;
    }
    
    return (
        <div className="profile-page">
            <div className="profile-header">
                <div className="profile-avatar">{details?.name?.charAt(0)}</div>
                <h2>{details?.name}</h2>
                <p>{details?.email}</p>
            </div>
            <div className="profile-details-section">
                <h3>Personal Details</h3>
                {isEditing ? (
                    <>
                        <div className="form-group"><label>Name</label><input type="text" name="name" value={editableDetails.name} onChange={(e) => handleChange(e, 'details')} /></div>
                        <div className="form-group"><label>Age</label><input type="number" name="age" value={editableDetails.age} onChange={(e) => handleChange(e, 'details')} /></div>
                        <div className="form-group"><label>Email</label><input type="email" name="email" value={editableDetails.email} onChange={(e) => handleChange(e, 'details')} /></div>
                        <div className="form-group"><label>Condition</label><input type="text" name="condition" value={editableDetails.condition} onChange={(e) => handleChange(e, 'details')} /></div>
                    </>
                ) : (
                    <>
                        <p><strong>Age:</strong> {details.age}</p>
                        <p><strong>Primary Condition:</strong> {details.condition}</p>
                    </>
                )}
            </div>
             <div className="profile-details-section">
                <h3>Medical History</h3>
                {isEditing ? (
                    <>
                        <div className="form-group"><label>Past Conditions</label><textarea name="pastConditions" value={editableDetails.medicalHistory.pastConditions} onChange={(e) => handleChange(e, 'medicalHistory')} /></div>
                        <div className="form-group"><label>Previous Treatments</label><textarea name="previousTreatments" value={editableDetails.medicalHistory.previousTreatments} onChange={(e) => handleChange(e, 'medicalHistory')} /></div>
                        <div className="form-group"><label>Allergies</label><textarea name="allergies" value={editableDetails.medicalHistory.allergies} onChange={(e) => handleChange(e, 'medicalHistory')} /></div>
                    </>
                ) : (
                    <>
                        <div className="medical-history-item">
                            <h4>Past Conditions</h4>
                            <p>{details.medicalHistory.pastConditions}</p>
                        </div>
                        <div className="medical-history-item">
                            <h4>Previous Treatments</h4>
                            <p>{details.medicalHistory.previousTreatments}</p>
                        </div>
                        <div className="medical-history-item">
                            <h4>Allergies</h4>
                            <p>{details.medicalHistory.allergies}</p>
                        </div>
                    </>
                )}
            </div>
            <div className="profile-actions">
                {isEditing ? (
                    <>
                        <button onClick={handleCancel} className="btn-secondary">Cancel</button>
                        <button onClick={handleSave} className="btn-primary" disabled={isLoading}>{isLoading ? 'Saving...' : 'Save Changes'}</button>
                    </>
                ) : (
                    <button onClick={handleEdit} className="btn-primary">Edit Profile</button>
                )}
            </div>
        </div>
    );
};


// --- AI CHATBOT COMPONENTS --- //
const Chatbot: React.FC = () => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatWindowRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function initializeChat() {
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
                // Get patient condition to add to system instruction
                const patientDetails = await apiService.getPatientDetails();
                const condition = patientDetails?.condition || 'general wellness';
                
                const chatInstance = ai.chats.create({
                    model: 'gemini-2.5-flash',
                    config: {
                         systemInstruction: `You are a helpful assistant for AyurSutra, an Ayurvedic wellness app. Provide advice relevant to Panchakarma treatments and general Ayurvedic wellness. The patient's primary condition is '${condition}'. Always remind patients to consult their practitioner for serious concerns or before making any changes to their treatment plan. Keep your answers concise and helpful for a mobile app context.`,
                    }
                });
                setChat(chatInstance);
            } catch (error) {
                console.error("Failed to initialize AI Chat:", error);
                setMessages([{ role: 'model', text: 'Sorry, the AI assistant could not be initialized.' }]);
            }
        }
        initializeChat();
    }, []);

    useEffect(() => {
        // Scroll to bottom when new messages are added
        if (chatWindowRef.current) {
            chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
        }
    }, [messages]);

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !chat || isLoading) return;

        const userMessage = { role: 'user' as const, text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await chat.sendMessage({ message: input });
            const modelMessage = { role: 'model' as const, text: response.text };
            setMessages(prev => [...prev, modelMessage]);
        } catch (error) {
            console.error("AI Chat Error:", error);
            setMessages(prev => [...prev, { role: 'model', text: 'Sorry, I encountered an error. Please try again.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="chatbot-container">
            <div className="chat-window" ref={chatWindowRef}>
                {messages.map((msg, index) => (
                    <div key={index} className={`chat-message ${msg.role === 'user' ? 'user-message' : 'model-message'}`}>
                        {msg.text}
                    </div>
                ))}
                {isLoading && <div className="chat-message model-message">Thinking...</div>}
            </div>
            <form onSubmit={sendMessage} className="chat-input-form">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about your therapy..."
                    disabled={!chat || isLoading}
                />
                <button type="submit" disabled={!chat || isLoading}>Send</button>
            </form>
        </div>
    );
};

const ChatbotModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
        <div className="chatbot-modal-overlay" onClick={onClose}>
            <div className="chatbot-modal" onClick={(e) => e.stopPropagation()}>
                <header className="chatbot-header">
                    <h2>AI Health Assistant</h2>
                    <button onClick={onClose} className="close-button">&times;</button>
                </header>
                <Chatbot />
            </div>
        </div>
    );
};


// --- MAIN APP COMPONENT --- //
const App = () => {
    const [authStatus, setAuthStatus] = useState<AuthStatus>('welcome');
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState<Page>('Home');
    const [previousPage, setPreviousPage] = useState<Page>('Home');
    const [isChatbotOpen, setIsChatbotOpen] = useState(false);
    const [notifications, setNotifications] = useState<{ id: number; message: string }[]>([]);
    const [reminderAppointment, setReminderAppointment] = useState<Appointment | null>(null);

    useEffect(() => {
        if (authStatus === 'loggedIn') {
            const checkUpcomingAppointments = async () => {
                const appointments = await apiService.getAppointments();
                const now = new Date();

                // Find the first upcoming appointment that hasn't been reminded
                const upcoming = appointments.find(app => {
                    const appDate = new Date(app.date.replace(/-/g, '/'));
                    const reminded = sessionStorage.getItem(`reminded_${app.id}`);
                    return app.status === 'upcoming' && appDate > now && !reminded;
                });

                if (upcoming) {
                    setReminderAppointment(upcoming);
                }
            };
            checkUpcomingAppointments();
        }
    }, [authStatus]);
    
    const addNotification = (message: string) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 3000);
    };

    const handleLoginSuccess = (user: any) => {
        setCurrentUser(user);
        setAuthStatus('loggedIn');
    };
    
    const handleCreateSuccess = (user: any) => {
        addNotification(`Welcome, ${user.name}!`);
        setCurrentUser(user);
        setAuthStatus('loggedIn');
    }

    const handleNavigate = (page: Page) => {
        if (page !== currentPage) {
            setPreviousPage(currentPage);
            setCurrentPage(page);
        }
    };
    
    const handleNavigateBack = () => {
        setCurrentPage(previousPage);
    };

    const handleSosClick = () => {
        addNotification('SOS Alert Sent! A practitioner has been notified.');
    };

    const handleConfirmReminder = async () => {
        if (!reminderAppointment) return;
        await apiService.updateAppointmentStatus(reminderAppointment.id, 'confirmed');
        sessionStorage.setItem(`reminded_${reminderAppointment.id}`, 'true');
        addNotification('Appointment Confirmed!');
        setReminderAppointment(null);
    };

    const handleRescheduleReminder = () => {
        if (!reminderAppointment) return;
        sessionStorage.setItem(`reminded_${reminderAppointment.id}`, 'true');
        handleNavigate('Schedule');
        setReminderAppointment(null);
    };
    
    const handleDismissReminder = () => {
        if (!reminderAppointment) return;
        sessionStorage.setItem(`reminded_${reminderAppointment.id}`, 'true');
        setReminderAppointment(null);
    };

    const renderPage = () => {
        switch (currentPage) {
            case 'Home':
                return <HomePage userName={currentUser?.name || 'Guest'} onNavigate={handleNavigate} onLaunchChat={() => setIsChatbotOpen(true)} />;
            case 'Analysis':
                return <AnalysisPageContent />;
            case 'Schedule':
                return <SchedulingPage onBookingComplete={() => { addNotification('Appointment booked successfully!'); setCurrentPage('History'); }} />;
            case 'History':
                return <HistoryPage />;
            case 'Settings':
                return <SettingsPage />;
            case 'Profile':
                return <ProfilePage onBack={handleNavigateBack} addNotification={addNotification} />;
            default:
                return <HomePage userName={currentUser?.name || 'Guest'} onNavigate={handleNavigate} onLaunchChat={() => setIsChatbotOpen(true)} />;
        }
    };
    
    if (authStatus === 'welcome') {
        return (
             <PhoneFrame>
                <WelcomePage 
                    onNavigateToLogin={() => setAuthStatus('login')} 
                    onNavigateToCreateAccount={() => setAuthStatus('createAccount')}
                />
            </PhoneFrame>
        );
    }
    
    if (authStatus === 'login') {
         return (
             <PhoneFrame>
                <LoginPage onLoginSuccess={handleLoginSuccess} onBack={() => setAuthStatus('welcome')}/>
            </PhoneFrame>
        );
    }
    
    if (authStatus === 'createAccount') {
         return (
             <PhoneFrame>
                <CreateAccountPage onCreateSuccess={handleCreateSuccess} onBack={() => setAuthStatus('welcome')} />
            </PhoneFrame>
        );
    }

    return (
        <PhoneFrame>
             <div className="notification-container">
                {notifications.map(n => <div key={n.id} className="notification-toast">{n.message}</div>)}
            </div>
            {reminderAppointment && (
                <AppointmentReminder 
                    appointment={reminderAppointment}
                    onConfirm={handleConfirmReminder}
                    onReschedule={handleRescheduleReminder}
                    onDismiss={handleDismissReminder}
                />
            )}
            <div className="page-container">
                 {currentPage === 'Home' ? (
                    <HomeHeader userName={currentUser?.name || 'Guest'} onProfileClick={() => handleNavigate('Profile')} onSosClick={handleSosClick} />
                ) : (
                    <MobileHeader title={currentPage} onBack={handleNavigateBack} />
                )}
                {renderPage()}
            </div>
            <BottomNavBar activePage={currentPage} onNavigate={handleNavigate} />
            <ChatbotModal isOpen={isChatbotOpen} onClose={() => setIsChatbotOpen(false)} />
        </PhoneFrame>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);