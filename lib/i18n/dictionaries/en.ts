export const en = {
  // App
  app: {
    name: 'GameVerse',
    tagline: 'Football Gaming Platform',
    taglineShort: 'Build your football empire',
  },

  // Navigation / Common
  nav: {
    dashboard: 'Dashboard',
    club: 'My Club',
    economy: 'Economy',
    rankings: 'Rankings',
    play: 'Play',
    tournaments: 'Tournaments',
    market: 'Market',
    social: 'Social',
    signOut: 'Sign Out',
  },

  // Home / Landing
  home: {
    badge: 'The Ultimate Football Gaming Experience',
    title: 'Build Your Football',
    titleHighlight: 'Empire',
    subtitle: 'Manage your club, compete in tournaments, and rise through the ranks.',
    cta: 'Get Started',
    signIn: 'Sign In',
    features: {
      title: 'Everything you need to dominate',
      club: {
        title: 'Club Management',
        desc: 'Build and manage your dream football club with detailed stats and tactics.',
      },
      economy: {
        title: 'In-Game Economy',
        desc: 'Buy, sell, and trade players and items in a dynamic marketplace.',
      },
      tournaments: {
        title: 'Tournaments',
        desc: 'Compete in global tournaments and prove you\'re the best manager.',
      },
    },
  },

  // Auth - Login
  auth: {
    login: {
      title: 'Welcome back',
      subtitle: 'Enter your credentials to access your account',
      emailLabel: 'Email',
      emailPlaceholder: 'manager@example.com',
      passwordLabel: 'Password',
      submit: 'Sign In',
      loading: 'Signing in...',
      noAccount: "Don't have an account?",
      createAccount: 'Create account',
      orContinueWith: 'Or continue with',
    },
    signUp: {
      title: 'Create your account',
      subtitle: 'Join thousands of managers worldwide',
      emailLabel: 'Email',
      emailPlaceholder: 'manager@example.com',
      passwordLabel: 'Password',
      confirmPasswordLabel: 'Confirm Password',
      submit: 'Create Account',
      loading: 'Creating account...',
      hasAccount: 'Already have an account?',
      signIn: 'Sign in',
      passwordMismatch: 'Passwords do not match',
      passwordTooShort: 'Password must be at least 6 characters',
      orContinueWith: 'Or continue with',
    },
    error: {
      title: 'Authentication Error',
      message: 'Something went wrong during authentication. The link may have expired or already been used. Please try again.',
      backToLogin: 'Back to Login',
      createNewAccount: 'Create New Account',
    },
    success: {
      title: 'Check your email',
      message: "We've sent you a confirmation link",
      description: 'Click the link in your email to verify your account and start building your football empire. The link will expire in 24 hours.',
      backToLogin: 'Back to Login',
    },
    oauth: {
      google: 'Continue with Google',
      facebook: 'Continue with Facebook',
      microsoft: 'Continue with Microsoft',
      connecting: 'Connecting...',
    },
    language: {
      label: 'Language',
    },
  },

  // Dashboard
  dashboard: {
    title: 'Dashboard',
    welcome: 'Welcome back, {{name}}',
    stats: {
      matchesPlayed: 'Matches Played',
      wins: 'Wins',
      winRate: 'Win Rate',
      coins: 'Coins',
    },
    quickActions: 'Quick Actions',
    recentActivity: 'Recent Activity',
    noActivity: 'No recent activity',
    viewAll: 'View all',
  },

  // Club
  club: {
    title: 'My Club',
    overview: 'Club Overview',
    stats: 'Club Stats',
    infrastructure: 'Infrastructure',
    rating: 'Overall Rating',
    stadium: 'Stadium',
    level: 'Level {{level}}',
    upgrade: 'Upgrade',
  },

  // Economy
  economy: {
    title: 'Economy',
    wallet: 'My Wallet',
    balance: 'Balance',
    buyCoins: 'Buy Coins',
    transactions: 'Transaction History',
    noTransactions: 'No transactions yet',
    packages: {
      starter: 'Starter Pack',
      pro: 'Pro Pack',
      elite: 'Elite Pack',
    },
  },

  // Rankings
  rankings: {
    title: 'Rankings',
    global: 'Global Rankings',
    yourRank: 'Your Rank',
    player: 'Player',
    rating: 'Rating',
    matches: 'Matches',
    winRate: 'Win Rate',
    noData: 'No rankings data available',
  },

  // General
  general: {
    loading: 'Loading...',
    error: 'An error occurred',
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    back: 'Back',
    next: 'Next',
  },
}

export type Translations = typeof en
