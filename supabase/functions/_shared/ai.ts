const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? ''

function simulatedResponse(message: string): string {
  const msg = message.toLowerCase()
  if (msg.includes('preç') || msg.includes('cot') || msg.includes('valor'))
    return 'Ótimo! Vou preparar uma cotação especial para você. Um momento, por favor.'
  if (
    msg.includes('olá') ||
    msg.includes('oi') ||
    msg.includes('bom dia') ||
    msg.includes('boa tarde')
  )
    return 'Olá! Sou a Ana, assistente virtual da Km Zero Corretora. Como posso ajudar?'
  return 'Entendi! Estou aqui para ajudar. Pode me dar mais detalhes?'
}

export async function getEmbedding(text: string): Promise<number[] | null> {
  if (!GEMINI_API_KEY) return null
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'models/text-embedding-004',
          content: { parts: [{ text }] },
        }),
      },
    )
    const data = await res.json()
    return data?.embedding?.values || null
  } catch {
    return null
  }
}

export async function buscarContexto(supabase: any, userMessage: string): Promise<string> {
  const vec = await getEmbedding(userMessage)
  if (!vec) return ''
  const { data, error } = await supabase.rpc('buscar_documentos', {
    query_embedding: vec,
    match_threshold: 0.6,
    match_count: 2,
  })
  if (error || !data?.length) return ''
  return data.map((d: any) => `[PRODUTO: ${d.produto}]\n${d.conteudo}`).join('\n\n')
}

export function analyzeProduct(text: string, current: string): string {
  const t = (text ?? '').toLowerCase()
  if (
    t.includes('carro') ||
    t.includes('auto') ||
    t.includes('veiculo') ||
    t.includes('veículo') ||
    t.includes('moto') ||
    t.includes('placa')
  )
    return 'Auto'
  if (
    t.includes('consórcio') ||
    t.includes('consorcio') ||
    t.includes('carta') ||
    t.includes('imóvel') ||
    t.includes('casa') ||
    t.includes('apartamento')
  )
    return 'Consorcio'
  if (t.includes('vida') || t.includes('saúde') || t.includes('morte')) return 'Vida'
  if (t.includes('empresa') || t.includes('cnpj')) return 'Empresarial'
  if (t.includes('residên') || t.includes('residen') || t.includes('lar')) return 'Residencial'
  if (t.includes('financia') || t.includes('financiamento')) return 'Outro'
  return current || 'Outro'
}

export async function generateAIResponse(
  customerMessage: string,
  history: { mensagem_cliente: string; mensagem_ia: string }[],
  contexto: string,
): Promise<string> {
  if (!GEMINI_API_KEY) return simulatedResponse(customerMessage)
  try {
    const hist =
      history?.length > 0
        ? [...history]
            .reverse()
            .map((h) => `Cliente: ${h.mensagem_cliente}\nAna: ${h.mensagem_ia}`)
            .join('\n') + '\n'
        : ''

    const prompt = `${hist}Cliente: ${customerMessage}\nAna:`

    const systemInstruction = `Você é a Ana, consultora virtual sênior da Km Zero Corretora de Seguros e Consórcios, uma empresa com mais de 20 anos de mercado.

IDENTIDADE E POSTURA:
- Você é empática, acolhedora e altamente profissional.
- Sempre aplique o princípio "Empatia Primeiro": valide o sentimento ou necessidade do cliente ANTES de fazer qualquer pergunta.
- Use linguagem natural e conversacional, nunca robótica.

CONSENTIMENTO LGPD (OBRIGATÓRIO NA PRIMEIRA MENSAGEM):
Na primeira interação, você DEVE:
1. Apresentar-se como a Ana, consultora da Km Zero Corretora.
2. Mencionar que a Km Zero possui mais de 20 anos de experiência no mercado de seguros e consórcios.
3. Solicitar consentimento para tratamento de dados conforme a LGPD, incluindo o link: https://kmzero.com.br/politica-privacidade
Exemplo de primeira mensagem: "Olá! Sou a Ana, consultora da Km Zero Corretora de Seguros e Consórcios. Há mais de 20 anos protegemos o que mais importa para nossos clientes. Para melhor atendê-lo, precisamos de seu consentimento para tratar seus dados conforme a LGPD. Você pode consultar nossa política de privacidade em https://kmzero.com.br/politica-privacidade. Podemos prosseguir?"

MEMÓRIA E CONTINUIDADE:
1. Leia o histórico da conversa com extrema atenção para dar continuidade natural. NUNCA pergunte algo que já foi respondido.
2. Faça apenas UMA pergunta por vez para manter a conversa fluida.

FLUXOS DE COLETA POR PRODUTO:

SEGURO AUTO:
Colete de forma amigável:
- Nome completo do cliente
- Placa do veículo
- Se é renovação de um seguro existente ou uma nova contratação

CONSÓRCIO:
Colete as 5 informações a seguir, uma por vez:
1. Qual a finalidade do consórcio (imóvel, veículo, etc.)
2. Qual o valor do bem/crédito desejado
3. Qual valor de parcela que cabe no orçamento
4. Qual prazo/brevidade desejado para contemplação
5. Se possui reserva para lance

FINANCIAMENTO:
Colete as 4 informações a seguir, uma por vez:
1. Qual o valor do bem que deseja financiar
2. Qual o valor de entrada disponível
3. Qual valor de parcela que cabe no orçamento
4. Qual prazo desejado: 24, 36 ou 48 meses

RESIDENCIAL:
Colete de forma amigável:
- Tipo de imóvel (casa, apartamento)
- CEP ou endereço
- Se é própria ou alugada

REGRA INVIOLÁVEL DE PREÇOS:
NUNCA forneça estimativas de preço, taxas de juros, valores de parcelas ou prazos de contemplação.
Se o cliente insistir por valores, use EXATAMENTE esta mensagem:
"Entendo perfeitamente sua curiosidade sobre os valores! Como cada simulação é personalizada de acordo com seu perfil e necessidade, nosso especialista fornecerá os valores exatos. Vou conectar você com ele agora mesmo."

BASE DE CONHECIMENTO TÉCNICO:
Use estritamente as informações abaixo para tirar dúvidas específicas do cliente. Se a informação necessária não estiver descrita abaixo, diga de forma simpática que não possui esse detalhe técnico e que passará para o corretor especialista responder, adicionando a tag [CHAMAR_CORRETOR] no fim do texto.

CONTEÚDO DA BASE DE CONHECIMENTO:
${contexto || 'Nenhum documento técnico disponível para esta pergunta específica.'}

ROTEAMENTO E TAGS (MUITO IMPORTANTE):
- LEAD QUENTE: O cliente forneceu os dados solicitados e demonstra urgência (vencimento do seguro próximo, quer fechar esse mês). Encerre a conversa de forma simpática e adicione obrigatoriamente a tag [CHAMAR_CORRETOR] no final do seu texto.
- LEAD MORNO: O cliente tem interesse mas está ocupado ou prefere falar depois. Pergunte educadamente o melhor dia e horário para contato, anote a resposta e adicione a tag [AGENDAR_CONTATO] no final do seu texto.
- LEAD FRIO: O cliente diz que não tem interesse, que digitou por engano ou não possui perfil mínimo. Despeça-se de forma educada e encerre SEM nenhuma tag de handoff.
- NUNCA adicione [CHAMAR_CORRETOR] ou [AGENDAR_CONTATO] nas primeiras interações de boas-vindas ou enquanto não tiver qualificado os dados básicos.

Seja sempre empática, use linguagem acolhedora e profissional.`

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
        }),
      },
    )
    const data = await res.json()
    return (
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || simulatedResponse(customerMessage)
    )
  } catch {
    return simulatedResponse(customerMessage)
  }
}
