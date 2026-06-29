export interface Lead {
  id: string
  name: string
  phone: string
  product: string
  status: 'Novo' | 'Em Atendimento' | 'Morno' | 'Ganho' | 'Perdido'
  seller: string
  date: string
  score: number
  value?: string
  lastMessage?: string
}

export const mockLeads: Lead[] = [
  {
    id: '1',
    name: 'Carlos Santos',
    phone: '(11) 98765-4321',
    product: 'Seguro Auto',
    status: 'Novo',
    seller: 'Não Atribuído',
    date: 'Hoje',
    score: 85,
    value: 'R$ 80.000 (Jeep Compass)',
    lastMessage: 'Gostaria de cotar seguro para meu Jeep',
  },
  {
    id: '2',
    name: 'Mariana Costa',
    phone: '(11) 91234-5678',
    product: 'Consórcio',
    status: 'Em Atendimento',
    seller: 'Adriana',
    date: 'Ontem',
    score: 92,
    value: 'R$ 300.000 (Imóvel)',
    lastMessage: 'Qual o valor da parcela?',
  },
  {
    id: '3',
    name: 'João Silva',
    phone: '(11) 99999-8888',
    product: 'Seguro de Vida',
    status: 'Ganho',
    seller: 'Gabriel',
    date: '2 dias atrás',
    score: 78,
    value: 'R$ 500.000 (Cobertura)',
    lastMessage: 'Fechado!',
  },
  {
    id: '4',
    name: 'Ana Oliveira',
    phone: '(11) 97777-6666',
    product: 'Plano de Saúde',
    status: 'Perdido',
    seller: 'Adriana',
    date: 'Semana passada',
    score: 45,
    value: 'Familiar',
    lastMessage: 'Achei caro, obrigado.',
  },
  {
    id: '5',
    name: 'Pedro Henrique',
    phone: '(11) 96666-5555',
    product: 'Seguro Auto',
    status: 'Morno',
    seller: 'Gabriel',
    date: 'Semana passada',
    score: 60,
    value: 'R$ 150.000 (BMW X1)',
    lastMessage: 'Vou pensar mais um pouco',
  },
]

export const mockActivities = [
  { id: '1', lead: 'Carlos Santos', action: 'Ana qualificou como Auto', time: '10 min atrás' },
  {
    id: '2',
    lead: 'Mariana Costa',
    action: 'Ana enviou simulação de consórcio',
    time: '1 hora atrás',
  },
  { id: '3', lead: 'Pedro Henrique', action: 'Lead visualizou proposta', time: '3 horas atrás' },
]

export const mockSellers = [
  {
    id: '1',
    name: 'Adriana',
    role: 'Gerente Comercial',
    avatar: 'AD',
    goal: 500000,
    current: 350000,
  },
  {
    id: '2',
    name: 'Gabriel',
    role: 'Vendedor Sênior',
    avatar: 'GA',
    goal: 300000,
    current: 280000,
  },
  { id: '3', name: 'Lucas', role: 'Vendedor Junior', avatar: 'LU', goal: 150000, current: 80000 },
]

export const leadPerformanceData = [
  { day: '01/10', leads: 12, converted: 2 },
  { day: '05/10', leads: 15, converted: 4 },
  { day: '10/10', leads: 22, converted: 6 },
  { day: '15/10', leads: 18, converted: 5 },
  { day: '20/10', leads: 25, converted: 8 },
  { day: '25/10', leads: 30, converted: 12 },
  { day: '30/10', leads: 28, converted: 10 },
]

export const productDistributionData = [
  { name: 'Seguro Auto', value: 450, fill: 'var(--color-auto)' },
  { name: 'Consórcio', value: 300, fill: 'var(--color-consorcio)' },
  { name: 'Seguro de Vida', value: 150, fill: 'var(--color-vida)' },
  { name: 'Plano de Saúde', value: 100, fill: 'var(--color-saude)' },
]
