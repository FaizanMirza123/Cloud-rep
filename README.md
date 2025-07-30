# 🎙️ EmployAI - Complete Voice AI Application

A comprehensive web application that integrates with Vapi's API to provide advanced voice AI capabilities with authentication, agent management, and telephony features.

![EmployAI Banner](https://via.placeholder.com/800x200/1e40af/ffffff?text=EmployAI+Voice+AI+Platform)

## ✨ Features

### 🔐 Advanced Authentication

- **Email/Password Authentication** with secure validation
- **Google OAuth Integration** ("Continue with Google")
- **Email Verification** for new registrations
- **International Phone Number Support** for registration
- **Password Security** (8+ chars, uppercase, special characters)
- **Forgot Password** with email reset functionality
- **SQLite Database** for persistent user management

### 🌟 Premium UI/UX

- **Framer Motion Animations** for smooth page transitions
- **Beautiful Loading States** with custom spinners
- **Responsive Design** for all devices
- **Toast Notifications** for user feedback
- **Optimized Performance** with React memoization
- **Local Caching** to prevent unnecessary API calls

### 🤖 Comprehensive Agent Management

- **Full CRUD Operations** for voice agents
- **Real-time Vapi API Integration** for agent creation
- **Live Agent Editing** with instant Vapi updates
- **Agent Deletion** synced with Vapi dashboard
- **Per-user Agent Ownership** and access control
- **Agent Analytics** and performance tracking

### 📞 Advanced Telephony Dashboard

- **Active Calls Monitoring** with live updates
- **Call Queue Management** with priority sorting
- **Call Recordings Library** with playback functionality
- **Missed Calls Tracking** and notifications
- **Post-Call Analytics** with detailed metrics
- **Real-time Data** from Vapi API

### 📱 Phone Number Management

- **Number Provisioning** via Vapi API
- **International Number Support** with area codes
- **Smooth Transitions** without UI glitches
- **User-specific Numbers** with ownership control

## 🚀 Quick Start

### Prerequisites

- **Python 3.8+** for backend
- **Node.js 16+** for frontend
- **Vapi API Key** (get from [Vapi Dashboard](https://dashboard.vapi.ai))

### 1. Clone & Setup

```bash
git clone <repository-url>
cd Cloud-rep
```

### 2. Backend Setup

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your VAPI_API_KEY
```

### 3. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env if needed
```

### 4. Quick Start (Windows)

```bash
# From project root
start.bat
```

### 4. Quick Start (Linux/Mac)

```bash
# From project root
chmod +x start.sh
./start.sh
```

### 5. Manual Start

```bash
# Terminal 1: Backend
cd backend && python main.py

# Terminal 2: Frontend
cd frontend && npm run dev
```

## 🌐 Access Points

- **Frontend Application**: https://cloud-rep-ten.vercel.app
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Interactive API**: http://localhost:8000/redoc

## ⚙️ Configuration

### Backend Environment (.env)

```env
# Required
VAPI_API_KEY=your_vapi_api_key_here
JWT_SECRET=your_super_secret_jwt_key

# Optional Features
SMTP_SERVER=smtp.gmail.com
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

### Frontend Environment (.env)

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

## 📋 API Endpoints

### Authentication

- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/google` - Google OAuth
- `POST /auth/forgot-password` - Password reset request
- `POST /auth/reset-password` - Password reset
- `POST /auth/verify-email` - Email verification

### Agent Management

- `GET /agents` - List user agents
- `POST /agents` - Create new agent
- `GET /agents/{id}` - Get agent details
- `PUT /agents/{id}` - Update agent
- `DELETE /agents/{id}` - Delete agent

### Phone Numbers

- `GET /phone-numbers` - List user phone numbers
- `POST /phone-numbers` - Create phone number
- `DELETE /phone-numbers/{id}` - Delete phone number

### Telephony

- `GET /calls` - All calls
- `GET /calls/active` - Active calls
- `GET /calls/missed` - Missed calls
- `GET /calls/recordings` - Call recordings
- `POST /calls` - Create outbound call

## 🏗️ Architecture

### Backend Stack

- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - Database ORM
- **SQLite** - Development database
- **JWT** - Authentication tokens
- **Bcrypt** - Password hashing
- **HTTPX** - Async HTTP client for Vapi API

### Frontend Stack

- **React 18** - UI framework
- **React Router** - Navigation
- **Framer Motion** - Animations
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **React Hot Toast** - Notifications

### Database Schema

```sql
Users (id, name, email, phone, password_hash, is_verified, ...)
Agents (id, vapi_id, user_id, name, industry, role, ...)
Phone_Numbers (id, vapi_id, user_id, number, name, ...)
Calls (id, vapi_id, user_id, agent_id, duration, cost, ...)
```

## 🔧 Development

### Running Tests

```bash
cd backend
python test_setup.py
```

### Code Structure

```
backend/
├── main.py              # FastAPI application
├── database.py          # SQLAlchemy models
├── auth_utils.py        # Authentication utilities
└── requirements.txt     # Python dependencies

frontend/
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/          # Page components
│   ├── contexts/       # React contexts
│   ├── hooks/          # Custom hooks
│   ├── services/       # API services
│   └── utils/          # Utility functions
└── package.json        # Node.js dependencies
```

## 🚀 Deployment

### Production Environment

1. **Database**: Upgrade to PostgreSQL
2. **Environment**: Set production environment variables
3. **SSL**: Configure HTTPS certificates
4. **Domain**: Update CORS settings for your domain
5. **Email**: Configure production SMTP service

### Docker Deployment

```dockerfile
# Example Dockerfile for backend
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "main.py"]
```

## 🔐 Security Features

- **JWT Authentication** with secure token handling
- **Password Hashing** using Bcrypt
- **Input Validation** on client and server
- **SQL Injection Protection** via SQLAlchemy ORM
- **CORS Protection** for API endpoints
- **Email Verification** for account security

## 📱 Mobile Support

- **Responsive Design** works on all screen sizes
- **Touch-friendly** interface for mobile devices
- **Progressive Web App** ready (can be installed)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

### Common Issues

**Backend won't start?**

- Check if all Python packages are installed: `pip install -r requirements.txt`
- Verify your `.env` file has the required variables

**Frontend errors?**

- Install dependencies: `npm install`
- Check Node.js version: `node --version` (needs 16+)

**Vapi API errors?**

- Verify your `VAPI_API_KEY` in the `.env` file
- Check Vapi API status at https://status.vapi.ai

### Getting Help

- 📖 Check the [Setup Guide](SETUP_GUIDE.md)
- 🐛 Report issues in the GitHub Issues tab
- 💬 Join our community discussions

## 🎉 Credits

Built with ❤️ using:

- [Vapi.ai](https://vapi.ai) for voice AI capabilities
- [FastAPI](https://fastapi.tiangolo.com/) for the backend API
- [React](https://reactjs.org/) for the frontend interface
- [Framer Motion](https://www.framer.com/motion/) for animations
- [Tailwind CSS](https://tailwindcss.com/) for styling

---

**Ready to build amazing voice AI applications? Get started now! 🚀**
