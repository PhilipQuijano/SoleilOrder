# Soleil Order System

A custom charm bracelet ordering system built with React and Vite, allowing customers to design personalized bracelets with various charms and configurations. This project was requested
by the company owners of SoleilPh.

## Features

- **Interactive Bracelet Designer**: Visual bracelet builder with drag-and-drop charm selection
- **Charm Categories**: Organized charm selection (Cars/Boy Stuff, Animals, Characters, Evil Eye, Flowers/Hearts/Girl Stuff, Text, Places, Gold Letters, Plain, Numbers)
- **Customizable Options**: Multiple sizes and starting charm materials (Silver, Gold, etc.)
- **Shopping Cart**: Add multiple bracelets with different configurations
- **Order Management**: Complete checkout process with customer details
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: React 19, Vite
- **Routing**: React Router DOM
- **Database**: Supabase
- **Styling**: CSS with Motion library for animations
- **Analytics**: Vercel Analytics

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd SoleilOrder
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to `http://localhost:3000` to see the application.

### Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
soleilordersystem/
├── src/
│   ├── components/          # Reusable UI components
│   ├── pages/              # Main application pages
│   ├── utils/              # Helper functions and utilities
│   ├── assets/             # Images, icons, and static files
│   └── styles/             # CSS and styling files
├── public/                 # Public assets
├── .env                    # Environment variables
├── package.json           # Dependencies and scripts
└── README.md              # Project documentation
```

## Available Scripts

- `npm run dev` - Start development server

## Deployment

The application is configured for deployment on Vercel.

### Environment Variables for Production

Make sure to set these environment variables in your deployment platform:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Contributing

### Branch Strategy

- `main` - Production branch (auto-deploys)
- `dev` - Development branch (staging)
- `feature/*` - Feature branches
- `bugfix/*` - Bug fix branches

### Development Workflow

1. **Create a feature branch from dev**
   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes and commit**
   ```bash
   git add .
   git commit -m "feat(component): add new feature description"
   ```

3. **Push and create pull request**
   ```bash
   git push -u origin feature/your-feature-name
   ```
   Create a pull request targeting the `dev` branch.

4. **Code review and merge**
   After approval, merge into `dev` for testing, then `main` for production.


## Key Components

- **Bracelet Designer**: Main customization interface
- **Charm Selector**: Category-based charm selection
- **Cart System**: Order management and checkout
- **Payment Integration**: Checkout process handling


### Common Issues

1. **Development server won't start**
   - Ensure Node.js version is 16+
   - Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`

2. **Supabase connection issues**
   - Verify environment variables are set correctly
   - Check Supabase project settings and API keys

3. **Build errors**
   - Run `npm run lint` to check for code issues
   - Ensure all imports are correct and dependencies are installed

## License

This project is proprietary software for Soleil.

---

**Note**: This project uses Supabase for backend services. Ensure your Supabase project is properly configured with the necessary tables and authentication settings.