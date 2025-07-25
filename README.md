# EmergencyCare - Real-Time Ambulance Dispatch & Telemedicine Platform


  
  
  [![React Native](https://imgps://img.shields.io/pt](https://img.shields.io/badge/mg.shields.ionse](https://img.
    A comprehensive healthcare mobile application enabling real-time ambulance dispatch, patient-doctor consultations, and emergency response coordination.
  


## 📱 Demo

### Video Demo

[📺 Watch Demo Video (2 minutes)](https://youtu.be/your-demo-video-link)  //TO BE UPLOADED

### Screenshots

  
  
  
  


*Click on images to view full size*

## 🚀 Features

### For Patients
- 🚨 **Emergency Ambulance Requests** - Request ambulance with priority levels
- 📍 **Live GPS Tracking** - Real-time ambulance location tracking
- 👨‍⚕️ **Doctor Consultations** - Browse and request consultations with doctors
- 📊 **Medical Profile** - Manage medical history, allergies, and emergency contacts
- 📱 **Direct Communication** - Call ambulance drivers and doctors directly

### For Ambulance Drivers
- 🚑 **Request Management** - Accept/decline emergency requests
- 🗺️ **Route Navigation** - Integrated GPS navigation to patient locations
- 📋 **Status Updates** - Update request status (en-route, arrived, completed)
- 🔄 **Availability Toggle** - Control online/offline status
- 👤 **Profile Management** - Manage vehicle details and credentials

### For Doctors
- 📅 **Appointment Scheduling** - Manage patient appointments
- 🏥 **Hospital Integration** - Link with hospital/clinic information
- 💼 **Professional Profile** - Showcase specialties and experience
- 📋 **Patient Requests** - Review and respond to consultation requests
- 💰 **Fee Management** - Set consultation fees and availability

### Cross-Platform Features
- 🔐 **Secure Authentication** - Role-based access control
- 🔄 **Real-time Updates** - Live data synchronization
- 📸 **Image Upload** - Profile pictures and medical documents
- 🌍 **Offline Support** - Basic functionality without internet
- 🔔 **Push Notifications** - Emergency alerts and status updates

## 🛠️ Tech Stack

### Frontend
- **Framework**: React Native 0.73+
- **Development Platform**: Expo 50.x
- **Language**: TypeScript 5.x
- **Navigation**: Expo Router (File-based routing)
- **State Management**: React Context API
- **UI Components**: React Native Elements, Custom Components
- **Maps**: React Native Maps with Google Maps

### Backend & Database
- **Backend-as-a-Service**: Supabase
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth with Row Level Security (RLS iis not enable now due to testing purposes)
- **File Storage**: Supabase Storage
- **Real-time**: Supabase Realtime subscriptions

### External Services
- **Maps & Location**: Google Maps API, Expo Location
- **Image Handling**: Expo Image Picker, Expo File System
- **Communication**: React Native Linking (Phone calls)
- **Push Notifications**: Expo Notifications

### Development Tools
- **Package Manager**: npm/yarn
- **Code Quality**: ESLint, Prettier
- **Version Control**: Git
- **Environment**: Expo CLI, EAS CLI

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.x or higher)
- **npm** or **yarn**
- **Git**
- **Expo CLI**: `npm install -g @expo/cli`
- **EAS CLI**: `npm install -g eas-cli` (for building)

### Platform-Specific Requirements

#### For iOS Development
- **macOS** (required for iOS builds)
- **Xcode** 14+ (from Mac App Store)
- **iOS Simulator** (comes with Xcode)

#### For Android Development
- **Android Studio** (for Android emulator)
- **Java Development Kit (JDK)** 11 or higher

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/sahilforkshere/HealthApp.git
cd HealthcareApp
```

### 2. Install Dependencies
```bash
# Using npm
npm install

# Using yarn
yarn install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_expo_maps_key
```

### 4. Supabase Setup



#### 4.3. Storage Buckets
1. Go to Storage in Supabase Dashboard
2. Create a bucket named `avatars`
3. Set it to public access for profile pictures

### 5. Google Maps Setup

#### 5.1. Get API Keys
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable APIs:
   - Maps SDK for Android
   - Maps SDK for iOS
   - Places API
   - Geocoding API
4. Create credentials and restrict by platform

#### 5.2. Configure API Keys
Update your `app.config.js`:

```javascript
import 'dotenv/config';

export default {
  expo: {
    name: "HealthcareApp",
    slug: "healthcare-app",
    // ... other config
    android: {
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY_ANDROID
        }
      }
    },
    ios: {
      config: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY_IOS
      }
    }
  }
};
```

## 🏃‍♂️ Running the App

### Development Mode
```bash
# Start Expo development server
npx expo start

# For specific platforms
npx expo start --android
npx expo start --ios
npx expo start --web
```

### Building for Production

#### Using EAS Build (Recommended)
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure EAS
eas build:configure

# Build for both platforms
eas build --platform all

# Build for specific platform
eas build --platform ios
eas build --platform android
```

#### Local Builds
```bash
# Android APK
npx expo run:android --variant release

# iOS (macOS only)
npx expo run:ios --configuration Release
```

## 📁 Project Structure

```
HealthcareApp-RN/
├── app/                          # Expo Router pages
│   ├── (auth)/                   # Authentication screens
│   ├── (patient-tabs)/           # Patient role screens
│   ├── (doctor-tabs)/            # Doctor role screens
│   ├── (driver-tabs)/            # Driver role screens
│   └── _layout.tsx               # Root layout
├── components/                   # Reusable components
│   ├── patient/                  # Patient-specific components
│   ├── doctor/                   # Doctor-specific components
│   ├── driver/                   # Driver-specific components
│   └── common/                   # Shared components
├── contexts/                     # React Context providers
│   ├── AuthContext.tsx           # Authentication state
│   ├── AmbulanceContext.tsx      # Ambulance data
│   └── ...
├── services/                     # API and external services
│   ├── supabase.ts               # Supabase client
│   ├── ambulance.service.ts      # Ambulance operations
│   ├── auth.service.ts           # Authentication
│   └── ...
├── constants/                    # App constants
├── types/                        # TypeScript type definitions
├── assets/                       # Images, fonts, etc.
├── screenshots/                  # App screenshots
├── .env                          # Environment variables
├── app.config.js                 # Expo configuration
└── package.json                  # Dependencies
```

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test User Accounts
For testing purposes, you can create accounts with these roles:

- **Patient**: Test emergency requests and doctor consultations
- **Doctor**: Test appointment management and patient interactions  
- **Driver**: Test ambulance request acceptance and tracking

## 🔧 Troubleshooting

### Common Issues

#### Metro Bundler Issues
```bash
# Clear Metro cache
npx expo start --clear

# Reset Metro cache completely
npx expo start -c
```

#### Android Build Issues
```bash
# Clean Android build
cd android && ./gradlew clean && cd ..

# Rebuild
npx expo run:android
```

#### iOS Build Issues
```bash
# Clean iOS build
cd ios && xcodebuild clean && cd ..

# Rebuild
npx expo run:ios
```

#### Supabase Connection Issues
1. Verify your `.env` file has correct URLs and keys
2. Check if your Supabase project is active
3. Ensure RLS policies are properly configured

#### Google Maps Not Loading
1. Verify API keys are correctly set
2. Check if required APIs are enabled in Google Cloud Console
3. Ensure billing is enabled for your Google Cloud project

### Getting Help
- Check the [Expo Documentation](https://docs.expo.dev/)
- Visit [Supabase Documentation](https://supabase.com/docs)
- Create an issue in this repository

## 📄 API Documentation

### Authentication Endpoints
- `POST /auth/sign-up` - User registration
- `POST /auth/sign-in` - User login  
- `POST /auth/sign-out` - User logout

### Ambulance Service Endpoints
- `GET /ambulances/available` - Get available ambulances
- `POST /ambulances/request` - Create emergency request
- `PUT /ambulances/accept` - Accept request (driver)
- `PUT /ambulances/status` - Update request status

### User Management
- `GET /profiles/me` - Get current user profile
- `PUT /profiles/me` - Update user profile
- `DELETE /profiles/me` - Delete user account

*Full API documentation available in `/docs/api.md`*

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License







## 🙏 Acknowledgments

- **Expo Team** for the amazing development platform
- **Supabase** for the backend infrastructure
- **React Native Community** for the ecosystem
- **Google Maps** for location services
- **Healthcare Professionals** who provided domain expertise

## 📈 Roadmap

### Phase 1 (Current)
- [x] User authentication and role management
- [x] Basic ambulance dispatch functionality
- [x] Real-time location tracking
- [x] Doctor-patient consultation booking




  Built with ❤️ for emergency healthcare services
  

