export type ProdutoInteresse = 'Auto' | 'Residencial' | 'Vida' | 'Consórcio' | 'Empresarial'
export type Estagio = 'novo' | 'contato' | 'qualificado' | 'fechado' | 'perdido'
export type Origem = 'whatsapp' | 'site' | 'indicacao' | 'formulario' | 'presencial'
export type Sentimento = 'positivo' | 'neutro' | 'negativo'

export interface Lead {
  id: string
  nome: string
  telefone: string
  email: string | null
  produto_interesse: ProdutoInteresse | null
  estagio: Estagio
  prioridade: number
  origem: Origem
  valor_estimado: number | null
  vendedor_id: string | null
  ultimo_contato: string | null
  proxima_acao: string | null
  data_criacao: string
  data_atualizacao: string
}

export interface InteracaoSDR {
  id: string
  lead_id: string
  mensagem_ia: string | null
  mensagem_cliente: string | null
  intencao_detectada: string | null
  sentimento: Sentimento
  data_hora: string
}

export interface MetricaDiaria {
  id: string
  data: string
  leads_novos: number
  leads_contatados: number
  leads_qualificados: number
  leads_fechados: number
  total_whatsapp_ativos: number
  taxa_conversao: number
  atendimentos_ana: number
  qualificados_ana: number
}
