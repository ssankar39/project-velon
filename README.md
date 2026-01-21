# Velon - Fitness Tracking Dashboard

A modern, full-stack fitness tracking web application built with Next.js 14, TypeScript, and MongoDB. Track your calories, workouts, fasting sessions, and health metrics all in one beautiful glassmorphic interface.

![Velon Dashboard](https://img.shields.io/badge/Status-Active-success)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8)

## ✨ Features

### 🍽️ **Calorie Tracking**
- Log meals with custom calorie counts
- Categorize by meal type (breakfast, lunch, dinner, snacks)
- View daily calorie totals and progress toward goals
- Visual progress indicators

### ⏱️ **Intermittent Fasting Timer**
- Multiple fasting protocols (16:8, 18:6, 20:4, 24-hour, custom)
- Real-time fasting progress tracking
- Active session monitoring
- Fasting history and analytics

### 💪 **Workout Logger**
- Search 1300+ exercises from integrated exercise database
- Log sets, reps, and weight (lbs/kg)
- Track exercises by body part and target muscles
- Display format: "Dumbbell Curls, 3×10 @ 35lbs"
- Automatic calorie burn calculation
- Workout history with date filtering

### 📊 **Health Metrics**
- Track weight, body fat percentage, BMI
- Calculate BMR (Basal Metabolic Rate)
- Calculate TDEE (Total Daily Energy Expenditure)
- Visual progress charts and graphs

### 🧮 **Health Calculators**
- BMI Calculator
- BMR Calculator (with activity level multipliers)
- TDEE Calculator
- Body Fat Percentage calculator

### 📱 **Responsive Design**
- Mobile-first approach
- Hamburger menu navigation on mobile
- Touch-friendly interface
- Optimized for all screen sizes (mobile, tablet, desktop)

### 🎨 **Modern UI/UX**
- Glassmorphic design
- Smooth animations and transitions
- Dark theme with purple/violet accents
- Live activity cards
- Real-time data updates

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** TailwindCSS
- **Icons:** Lucide React
- **State Management:** React Hooks

### Backend
- **API:** Next.js API Routes
- **Database:** MongoDB with Mongoose
- **Authentication:** Custom JWT-based auth
- **External API:** ExerciseDB API integration

### Development
- **Package Manager:** npm
- **Linting:** ESLint
- **Code Quality:** TypeScript strict mode

## 📦 Installation

### Prerequisites
- Node.js 18+ installed
- MongoDB instance (local or cloud)
- npm or yarn package manager

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd FitnessWebsite
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🚀 Build & Deploy

### Production Build
```bash
npm run build
npm start
```

### Development Mode
```bash
npm run dev
```

### Linting
```bash
npm run lint
```

## 📁 Project Structure

```
FitnessWebsite/
├── app/
│   ├── api/                    # API routes
│   │   ├── auth/              # Authentication endpoints
│   │   ├── workouts/          # Workout CRUD operations
│   │   ├── meals/             # Meal tracking endpoints
│   │   ├── fasting/           # Fasting session management
│   │   ├── metrics/           # Health metrics endpoints
│   │   ├── exercises/         # Exercise search API
│   │   └── user/              # User preferences & stats
│   ├── components/            # React components
│   │   ├── Dashboard/         # Dashboard module
│   │   ├── Calories/          # Calorie tracker
│   │   ├── Workouts/          # Workout logger
│   │   ├── Fasting/           # Fasting timer
│   │   ├── Metrics/           # Metrics tracker
│   │   ├── Calculators/       # Health calculators
│   │   ├── Profile/           # User profile
│   │   └── Settings/          # Settings page
│   ├── types/                 # TypeScript type definitions
│   ├── utils/                 # Utility functions
│   ├── landing/               # Landing page
│   ├── login/                 # Login page
│   ├── signup/                # Signup page
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Main dashboard
│   └── globals.css            # Global styles
├── lib/
│   └── mongodb.ts             # MongoDB connection
├── public/                     # Static assets
└── package.json
```

## 🔌 API Routes

### Authentication
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - User login

### Workouts
- `GET /api/workouts` - Get user workouts (with date filter)
- `POST /api/workouts` - Create new workout
- `DELETE /api/workouts/[id]` - Delete workout

### Meals
- `GET /api/meals` - Get user meals (with date filter)
- `POST /api/meals` - Create new meal
- `DELETE /api/meals/[id]` - Delete meal

### Fasting
- `GET /api/fasting` - Get user fasting sessions
- `POST /api/fasting` - Create/start fasting session
- `DELETE /api/fasting/[id]` - Delete fasting session

### Metrics
- `GET /api/metrics` - Get user health metrics
- `POST /api/metrics` - Create new metric entry

### User
- `GET /api/user/profile` - Get user profile
- `GET /api/user/stats` - Get user statistics
- `GET /api/user/preferences` - Get user preferences
- `POST /api/user/preferences` - Update user preferences

### Exercises
- `GET /api/exercises/search?q={query}` - Search exercises

## 🎯 Key Features Explained

### Responsive Design
- **Mobile (<768px):** Hamburger menu, stacked layouts, hidden sidebars
- **Tablet (768px-1024px):** Optimized grid layouts, collapsible sidebars
- **Desktop (>1024px):** Full sidebar navigation, multi-column layouts

### Workout Weight Tracking
Workouts now support weight tracking with unit selection:
```typescript
{
  name: "Dumbbell Curls",
  sets: 3,
  reps: 10,
  weight: 35,
  weightUnit: "lbs"
}
```
Display format: "3×10 @ 35lbs"

### Glassmorphic UI
Custom glass effects using Tailwind utilities:
```css
.glass {
  background: rgba(20, 20, 35, 0.7);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

## 🎨 Color Scheme

- **Primary Purple:** `#8b5cf6`
- **Secondary Violet:** `#a78bfa`
- **Accent Yellow:** `#fbbf24`
- **Background Dark:** `#0a0a0f`
- **Glass Overlay:** `rgba(20, 20, 35, 0.7)`

## 📱 Responsive Breakpoints

```javascript
// Tailwind breakpoints
sm: '640px'   // Small devices
md: '768px'   // Medium devices (tablets)
lg: '1024px'  // Large devices (desktops)
xl: '1280px'  // Extra large devices
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- Exercise data powered by [ExerciseDB API](https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb)
- Icons by [Lucide React](https://lucide.dev/)
- UI inspiration from modern fitness apps

## 📞 Support

For support, email sarveshwarsankar39@gmail.com or open an issue in the repository.

---

**Built with ❤️ using Next.js and TailwindCSS**
