const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? ''

function simulatedResponse(message: string): string {
  const msg = message.toLowerCase()
  if (msg.includes('preç') || msg.includes('cot') || msg.includes('valor'))
    return 'Ótimo! Vou preparar uma cotação especial para você. Um momento, por favor.'
  if (msg.includes('olá') || msg.includes('oi') || msg.includes('bom dia') || msg.includes('boa tarde'))
    return 'Olá! Sou a Ana, assistente virtual da Km Zero Corretora. Como posso ajudar?'
  return 'Entendi! Estou aqui para ajudar. Pode me dar mais detalhes?'
}

export async function getEmbedding(text: string): Promise<number[] | null> {
  if (!GEMINI_API_KEY) return null
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'models/text-embedding-004', content: { parts: [{ text }] } }),
    })
    return (await res.json())?.embedding?.values || null
  } catch { return null }
}

export async function buscarContexto(supabase: any, userMessage: string): Promise<string> {
  const vec = await getEmbedding(userMessage)
  if (!vec) return ''
  const { data, error } = await supabase.rpc('buscar_documentos', { query_embedding: vec, match_threshold: 0.6, match_count: 2 })
  if (error || !data?.length) return ''
  return data.map((d: any) => `[PRODUTO: ${d.produto}]\n${d.conteudo}`).join('\n\n')
}

export function analyzeProduct(text: string, current: string): string {
  const t = (text ?? '').toLowerCase()
  if (t.includes('carro') || t.includes('auto') || t.includes('veiculo') || t.includes('veículo') || t.includes('moto')) return 'Auto'
  if (t.includes('consórcio') || t.includes('consorcio') || t.includes('carta') || t.includes('imóvel') || t.includes('casa')) return 'Consorcio'
  if (t.includes('vida') || t.includes('saúde') || t.includes('morte')) return 'Vida'
  if (t.includes('empresa') || t.includes('cnpj')) return 'Empresarial'
  if (t.includes('residên') || t.includes('residen') || t.includes('lar')) return 'Residencial'
  return current || 'Outro'
}

export async function generateAIResponse(
  customerMessage: string,
  history: { mensagem_cliente: string; mensagem_ia: string }[],
  contexto: string,
): Promise<string> {
  if (!GEMINI_API_KEY) return simulatedResponse(customerMessage)
  try {
    const hist = history?.length > 0
      ? [...history].reverse().map(h => `Cliente: ${h.mensagem_cliente}\nAna: ${h.mensagem_ia}`).join('\n') + '\n'
      : ''
    const prompt = `${hist}Cliente: ${customerMessage}\nAna:`
    const sys = `Você é a Ana, assistente virtual da Km Zero Corretora de Seguros e Consórcios. Qualifique leads de forma ágil e amigável.

BASE DE CONHECIMENTO:
${contexto || 'Nenhum documento técnico disponível.'}

REGRAS:
1. Leia o histórico para dar continuidade. NUNCA pergunte o que já foi respondido.
2. Faça apenas UMA pergunta por vez.
3. Seguro Auto: colete Nome, Placa e se é renovação.
4. Consórcio: colete valor do crédito e parcela.
5. LEAD QUENTE: urgência + dados → [CHAMAR_CORRETOR]
6. LEAD MORNO: ocupado → pergunte horário → [AGENDAR_CONTATO]
7. LEAD FRIO: sem interesse → despeça-se sem tags.
8. NUNCA adicione tags nas primeiras interações.`

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], systemInstruction: { parts: [{ text: sys }] } }),
    })
    return (await res.json())?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || simulatedResponse(customerMessage)
  } catch { return simulatedResponse(customerMessage) }
}
