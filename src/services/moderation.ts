export interface SocialComment {
  id: string
  author: string
  text: string
  status: 'respondido' | 'deletado' | 'neutro'
}

export interface SocialPost {
  id: string
  platform: 'instagram' | 'facebook'
  content: string
  comments: SocialComment[]
}

export const mockSocialPosts: SocialPost[] = [
  {
    id: '1',
    platform: 'instagram',
    content: 'Seguro Auto com ate 20% de desconto!',
    comments: [
      { id: '1', author: 'Joao Silva', text: 'Como faco para cotar?', status: 'respondido' },
      { id: '2', author: 'Maria Santos', text: 'Preco absurdo!', status: 'neutro' },
    ],
  },
  {
    id: '2',
    platform: 'facebook',
    content: 'Consorcio imobiliario com parcelas fixas',
    comments: [
      { id: '3', author: 'Pedro Costa', text: 'Tenho interesse!', status: 'respondido' },
      { id: '4', author: 'Spam Bot', text: 'Clique: spam.com', status: 'deletado' },
    ],
  },
  {
    id: '3',
    platform: 'instagram',
    content: 'Seguro de Vida para proteger sua familia',
    comments: [{ id: '5', author: 'Ana Lima', text: 'Qual o valor mensal?', status: 'neutro' }],
  },
]
