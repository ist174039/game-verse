import type { Translations } from './en'

export const pt: Translations = {
  // App
  app: {
    name: 'GameVerse',
    tagline: 'Plataforma de Futebol Gaming',
    taglineShort: 'Constrói o teu império no futebol',
  },

  // Navigation / Common
  nav: {
    dashboard: 'Painel',
    club: 'Meu Clube',
    economy: 'Economia',
    rankings: 'Classificações',
    play: 'Jogar',
    tournaments: 'Torneios',
    market: 'Mercado',
    social: 'Social',
    signOut: 'Sair',
  },

  // Home / Landing
  home: {
    badge: 'A Melhor Experiência de Futebol Gaming',
    title: 'Constrói o Teu Império',
    titleHighlight: 'no Futebol',
    subtitle: 'Gere o teu clube, compete em torneios e sobe nas classificações.',
    cta: 'Começar Agora',
    signIn: 'Entrar',
    features: {
      title: 'Tudo o que precisas para dominar',
      club: {
        title: 'Gestão de Clube',
        desc: 'Constrói e gere o teu clube de sonho com estatísticas e táticas detalhadas.',
      },
      economy: {
        title: 'Economia do Jogo',
        desc: 'Compra, vende e troca jogadores e itens num mercado dinâmico.',
      },
      tournaments: {
        title: 'Torneios',
        desc: 'Competi em torneios globais e prova que és o melhor manager.',
      },
    },
  },

  // Auth - Login
  auth: {
    login: {
      title: 'Bem-vindo de volta',
      subtitle: 'Introduz as tuas credenciais para aceder à tua conta',
      emailLabel: 'Email',
      emailPlaceholder: 'manager@exemplo.com',
      passwordLabel: 'Palavra-passe',
      submit: 'Entrar',
      loading: 'A entrar...',
      noAccount: 'Não tens conta?',
      createAccount: 'Criar conta',
      orContinueWith: 'Ou continua com',
    },
    signUp: {
      title: 'Cria a tua conta',
      subtitle: 'Junta-te a milhares de managers em todo o mundo',
      emailLabel: 'Email',
      emailPlaceholder: 'manager@exemplo.com',
      passwordLabel: 'Palavra-passe',
      confirmPasswordLabel: 'Confirmar Palavra-passe',
      submit: 'Criar Conta',
      loading: 'A criar conta...',
      hasAccount: 'Já tens conta?',
      signIn: 'Entrar',
      passwordMismatch: 'As palavras-passe não coincidem',
      passwordTooShort: 'A palavra-passe deve ter pelo menos 6 caracteres',
      orContinueWith: 'Ou continua com',
    },
    error: {
      title: 'Erro de Autenticação',
      message: 'Ocorreu um erro durante a autenticação. O link pode ter expirado ou já foi usado. Por favor, tenta novamente.',
      backToLogin: 'Voltar ao Login',
      createNewAccount: 'Criar Nova Conta',
    },
    success: {
      title: 'Verifica o teu email',
      message: 'Enviámos-te um link de confirmação',
      description: 'Clica no link do email para verificar a tua conta e começar a construir o teu império no futebol. O link expira em 24 horas.',
      backToLogin: 'Voltar ao Login',
    },
    oauth: {
      google: 'Continuar com Google',
      facebook: 'Continuar com Facebook',
      microsoft: 'Continuar com Microsoft',
      connecting: 'A conectar...',
    },
    language: {
      label: 'Idioma',
    },
  },

  // Dashboard
  dashboard: {
    title: 'Painel',
    welcome: 'Bem-vindo de volta, {{name}}',
    stats: {
      matchesPlayed: 'Jogos Disputados',
      wins: 'Vitórias',
      winRate: 'Taxa de Vitórias',
      coins: 'Moedas',
    },
    quickActions: 'Ações Rápidas',
    recentActivity: 'Atividade Recente',
    noActivity: 'Sem atividade recente',
    viewAll: 'Ver tudo',
  },

  // Club
  club: {
    title: 'Meu Clube',
    overview: 'Visão Geral',
    stats: 'Estatísticas do Clube',
    infrastructure: 'Infraestrutura',
    rating: 'Classificação Geral',
    stadium: 'Estádio',
    level: 'Nível {{level}}',
    upgrade: 'Melhorar',
  },

  // Economy
  economy: {
    title: 'Economia',
    wallet: 'Minha Carteira',
    balance: 'Saldo',
    buyCoins: 'Comprar Moedas',
    transactions: 'Histórico de Transações',
    noTransactions: 'Nenhuma transação ainda',
    packages: {
      starter: 'Pack Inicial',
      pro: 'Pack Pro',
      elite: 'Pack Elite',
    },
  },

  // Rankings
  rankings: {
    title: 'Classificações',
    global: 'Classificações Globais',
    yourRank: 'Tua Classificação',
    player: 'Jogador',
    rating: 'Pontuação',
    matches: 'Jogos',
    winRate: 'Taxa de Vitórias',
    noData: 'Nenhum dado de classificação disponível',
  },

  // General
  general: {
    loading: 'A carregar...',
    error: 'Ocorreu um erro',
    save: 'Guardar',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    back: 'Voltar',
    next: 'Seguinte',
  },
}
