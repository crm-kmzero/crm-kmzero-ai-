export interface CampaignKPI {
  label: string
  value: string
  trend: string
}

export const mockCampaignKPIs: CampaignKPI[] = [
  { label: 'CPA', value: 'R$ 12,50', trend: '-8%' },
  { label: 'Cliques', value: '1.847', trend: '+15%' },
  { label: 'Impressoes', value: '45.230', trend: '+22%' },
]

export interface AdPreview {
  titulo: string
  texto: string
  cta: string
}

export function generateAdPreview(objective: string): AdPreview {
  const previews: Record<string, AdPreview> = {
    awareness: {
      titulo: 'KMZERO.AI - Seguros e Consorcios',
      texto: 'Proteja o que importa com a Km Zero Corretora. Ha mais de 20 anos no mercado.',
      cta: 'Saiba Mais',
    },
    leads: {
      titulo: 'Cote seu Seguro Auto Gratis',
      texto: 'Proteja seu veiculo com a Km Zero! Cotacao rapida e ate 20% de desconto.',
      cta: 'Cotar Agora',
    },
    engagement: {
      titulo: 'Qual seguro e ideal para voce?',
      texto: 'Descubra a melhor opcao para seu perfil. Fale com nossos especialistas!',
      cta: 'Quero Saber',
    },
    sales: {
      titulo: 'Consorcio Imobiliario KMZERO.AI',
      texto: 'Realize o sonho da casa propria. Parcelas fixas e sem juros.',
      cta: 'Comprar Agora',
    },
  }
  return previews[objective] || previews.leads
}
