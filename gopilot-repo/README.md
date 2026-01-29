# GoPilot

**School Dismissal Management System**

Safe, simple dismissal for K-8 schools. Real-time parent check-in, instant teacher notifications, and verified pickups.

![GoPilot](https://img.shields.io/badge/version-0.1.0-blue)
![React](https://img.shields.io/badge/react-18.2.0-61dafb)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Features

- **Multiple Check-in Methods** - App, SMS, or QR code
- **Real-time Queue** - Parents see position and wait time
- **Instant Teacher Alerts** - One-tap dismiss from any device
- **Verified Pickups** - Authorized pickup lists and custody alerts
- **Bus & Walker Support** - Manage all dismissal types
- **Google Workspace Integration** - Import students instantly

---

## Project Structure

```
gopilot/
├── src/
│   ├── pages/
│   │   ├── GoPilotMarketing.jsx    # Marketing/pricing page
│   │   ├── SchoolSetupWizard.jsx   # School onboarding (5 steps)
│   │   ├── ParentOnboarding.jsx    # First-time parent setup
│   │   ├── ParentApp.jsx           # Daily parent app
│   │   ├── TeacherView.jsx         # Teacher dismissal view
│   │   ├── DismissalDashboard.jsx  # Front office dashboard
│   │   └── GoPilot.jsx             # Full prototype (all roles)
│   ├── components/
│   │   ├── RosterManagement.jsx    # Student roster & CSV import
│   │   └── GoogleWorkspaceIntegration.jsx  # Google setup
│   └── App.js
├── public/
├── package.json
└── README.md
```

---

## Pages Overview

| Page | Purpose | Users |
|------|---------|-------|
| **GoPilotMarketing** | Public marketing page with pricing calculator | Website visitors |
| **SchoolSetupWizard** | 5-step school onboarding flow | School Admin |
| **ParentOnboarding** | First-time parent account setup | New Parents |
| **ParentApp** | Daily check-in, queue status, change requests | Parents |
| **TeacherView** | Called students, one-tap dismiss, class roster | Teachers |
| **DismissalDashboard** | Live queue, buses, walkers, emergency controls | Front Office |

---

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/gopilot.git

# Navigate to project
cd gopilot

# Install dependencies
npm install

# Start development server
npm start
```

The app will open at `http://localhost:3000`

---

## Usage

### For Schools

1. **Setup** - Connect Google Workspace or upload CSV
2. **Create Homerooms** - Add teachers and grade levels
3. **Assign Students** - Place students in homerooms
4. **Set Dismissal Types** - Car, bus, walker, after-school
5. **Invite Parents** - Send signup links

### For Parents

1. **Sign In** - Google, Apple, or email
2. **Link Children** - Auto-match or enter student code
3. **Add Authorized Pickups** - Grandparents, caregivers, etc.
4. **Check In Daily** - Tap "I'm Here" when you arrive

### For Teachers

1. **View Dashboard** - See class roster and dismissal types
2. **Receive Alerts** - Get notified when parents arrive
3. **Dismiss Students** - One tap to send student to pickup zone

---

## Pricing

**$400 base + $2.00/student annually**

| Students | Annual Price | Monthly |
|----------|--------------|---------|
| 100 | $600 | $50 |
| 300 | $1,000 | $83 |
| 500 | $1,400 | $117 |
| 1,000 | $2,400 | $200 |

- Unlimited teacher accounts
- All check-in methods included
- Parent app for iOS & Android
- Google Workspace integration
- Email & chat support

---

## Tech Stack

- **Frontend**: React 18
- **Styling**: Tailwind CSS (utility classes)
- **Icons**: Lucide React
- **Auth**: Google OAuth (planned)
- **Backend**: TBD

---

## Roadmap

- [ ] Backend API development
- [ ] Database schema (PostgreSQL)
- [ ] Google Workspace OAuth integration
- [ ] iOS/Android parent apps
- [ ] SMS check-in via Twilio
- [ ] QR code generation
- [ ] Real-time websockets
- [ ] Analytics dashboard

---

## Contributing

Contributions are welcome! Please read our contributing guidelines first.

---

## License

MIT License - see LICENSE file for details.

---

## Contact

Questions? Email hello@gopilot.com

---

Built with ❤️ for safer school dismissals.
