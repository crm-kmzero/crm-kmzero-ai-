import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const VERIFY_TOKEN = Deno.env.get('META_WHATSAPP_VERIFY_TOKEN') ?? ''
const ACCESS_TOKEN = Deno.env.get('META_WHATSAPP_ACCESS_TOKEN') ?? ''
const PHONE_NUMBER_ID = Deno.env.get('META_WHATSAPP_PHONE_NUMBER_ID') ?? ''
const APP_SECRET = Deno.env.get('META_APP_SECRETS') ?? ''
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE_KEY =
  Deno.env.get('SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const REGRA_DISTRIBUICAO = {
  GABRIEL: {
    email: 'gabrielaraujo@kmzero.com.br',
    telefone: '5534992000300',
    link: 'https://wa.me/5534992000300',
  },
  ADRIANA: {
    email: 'adriana.araujo@kmzero.com.br',
    telefone: '5534984080220',
    link: 'https://wa.me/5534984080220',
  },
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

function obterContatoCorretor(produto: string) {
  const prod = (produto ?? '').toLowerCase().trim()
  if (prod === 'auto' || prod === 'automóvel' || prod === 'automovel' || prod === 'seguro auto') {
    return REGRA_DISTRIBUICAO.GABRIEL
  }
  return REGRA_DISTRIBUICAO.ADRIANA
}

function analisarProdutoPorMensagem(texto: string, produtoAtual: string): string {
  const txt = (texto ?? '').toLowerCase()
  if (
    txt.includes('carro') ||
    txt.includes('auto') ||
    txt.includes('veiculo') ||
    txt.includes('veículo') ||
    txt.includes('moto') ||
    txt.includes('placa') ||
    txt.includes('cotação de seguro auto')
  ) {
    return 'Auto'
  }
  if (
    txt.includes('consórcio') ||
    txt.includes('consorcio') ||
    txt.includes('carta de crédito') ||
    txt.includes('imóvel') ||
    txt.includes('casa') ||
    txt.includes('apartamento')
  ) {
    return 'Consórcio'
  }
  if (
    txt.includes('vida') ||
    txt.includes('saúde') ||
    txt.includes('odonto') ||
    txt.includes('morte')
  ) {
    return 'Vida'
  }
  if (txt.includes('empresa') || txt.includes('empresarial') || txt.includes('cnpj')) {
    return 'Empresarial'
  }
  if (
    txt.includes('residência') ||
    txt.includes('residencial') ||
    txt.includes('lar') ||
    txt.includes('seguro residencial')
  ) {
    return 'Residencial'
  }
  return produtoAtual || 'Outro'
}

function simulatedResponse(message: string): string {
  const msg = message.toLowerCase()
  if (msg.includes('preç') || msg.includes('cot') || msg.includes('valor')) {
    return 'Ótimo! Vou preparar uma cotação especial para você. Um momento, por favor.'
  }
  if (
    msg.includes('olá') ||
    msg.includes('oi') ||
    msg.includes('bom dia') ||
    msg.includes('boa tarde')
  ) {
    return 'Olá! Sou a Ana, assistente virtual da Km Zero Corretora. Como posso ajudar você hoje?'
  }
  return 'Entendi! Estou aqui para ajudar. Pode me dar mais detalhes sobre o que você procura?'
}

async function getEmbedding(text: string): Promise<number[] | null> {
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
  } catch (err) {
    console.error('[embedding] Erro ao gerar vetor:', err)
    return null
  }
}

async function buscarContextoBaseConhecimento(supabase: any, userMessage: string): Promise<string> {
  const queryVector = await getEmbedding(userMessage)
  if (!queryVector) return ''

  const { data, error } = await supabase.rpc('buscar_documentos', {
    query_embedding: queryVector,
    match_threshold: 0.6,
    match_count: 2,
  })

  if (error) {
    console.error('[rag] Erro na busca semântica:', JSON.stringify(error))
    return ''
  }

  if (!data || data.length === 0) return ''

  return data.map((doc: any) => `[PRODUTO: ${doc.produto}]\n${doc.conteudo}`).join('\n\n')
}

async function generateAIResponse(
  customerMessage: string,
  history: { mensagem_cliente: string; mensagem_ia: string }[],
  contextoSeguro: string,
): Promise<string> {
  if (!GEMINI_API_KEY) return simulatedResponse(customerMessage)
  try {
    let historyPrompt = ''
    if (history && history.length > 0) {
      const chronologicalHistory = [...history].reverse()
      historyPrompt =
        chronologicalHistory
          .map((h) => `Cliente: ${h.mensagem_cliente}\nAna: ${h.mensagem_ia}`)
          .join('\n') + '\n'
    }

    const prompt = `${historyPrompt}Cliente: ${customerMessage}\nAna:`

    const systemInstruction = `Você é a Ana, assistente virtual inteligente da Km Zero Corretora de Seguros e Consórcios.
Seu objetivo é qualificar leads de forma altamente ágil, amigável e focada.

BASE DE CONHECIMENTO TÉCNICA E REGRAS:
Use estritamente as informações abaixo para tirar dúvidas específicas do cliente sobre taxas, seguros e prazos. Se a informação necessária não estiver descrita abaixo, diga de forma simpática que não possui esse detalhe técnico e que passará para o corretor especialista responder, adicionando a tag [CHAMAR_CORRETOR] no fim do texto.

CONTEÚDO DA BASE DE CONHECIMENTO:
${contextoSeguro || 'Nenhum documento técnico disponível para esta pergunta específica.'}

REGRAS CRÍTICAS DE CONVERSAÇÃO E MEMÓRIA:
1. Leia com extrema atenção o histórico da conversa para dar continuidade natural. NUNCA pergunte o que o cliente quer se ele já explicou anteriormente na conversa.
2. Faça apenas UMA pergunta por vez para manter a conversa fluida.
3. Se o produto for Seguro Auto, colete de forma amigável: Nome completo, Placa do veículo e se é uma renovação.
4. Se o produto for Consórcio, colete: Valor do crédito desejado e parcela confortável.
5. REGRAS DE ROTEAMENTO (MUITO IMPORTANTE):
   - LEAD QUENTE: O cliente tem urgência de fechamento (vencimento do seguro próximo ou quer fechar consórcio esse mês) e forneceu os dados solicitados. Neste caso, encerre a conversa de forma simpática e adicione obrigatoriamente a tag [CHAMAR_CORRETOR] no final do seu texto.
   - LEAD MORNO: O cliente tem interesse, mas diz que está ocupado agora, que prefere falar depois ou quer apenas pesquisar por enquanto. Pergunte educadamente: "Qual seria o melhor dia e horário para nossa equipe te ligar?". Anote a resposta dele e encerre com a tag [AGENDAR_CONTATO] no final do seu texto.
   - LEAD FRIO: O cliente diz que não tem interesse, que digitou por engano ou não possui perfil mínimo. Despeça-se de forma educada e encerre sem nenhuma tag de handoff.
6. NUNCA adicione [CHAMAR_CORRETOR] ou [AGENDAR_CONTATO] nas primeiras interações de boas-vindas ou enquanto não tiver qualificado os dados básicos.`

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

async function sendWhatsAppMessage(to: string, text: string) {
  if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) return
  try {
    await fetch(`https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text },
      }),
    })
  } catch {
    // silently fail
  }
}

function verifySignature(payload: string, signature: string | null): boolean {
  if (!APP_SECRET || !signature) return true
  try {
    const encoder = new TextEncoder()
    const key = encoder.encode(APP_SECRET)
    const data = encoder.encode(payload)
    return crypto.subtle
      .importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
      .then((cryptoKey) => crypto.subtle.sign('HMAC', cryptoKey, data))
      .then((sig) => {
        const hashArray = Array.from(new Uint8Array(sig))
        const expected = 'sha256=' + hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
        return expected === signature
      })
  } catch {
    return false
  }
}

async function safeIncrementMetric(supabase: any, column: 'leads_novos' | 'leads_contatados') {
  const today = new Date().toISOString().split('T')[0]
  try {
    const { error: rpcError } = await supabase.rpc('increment_metric', {
      metric_date: today,
      metric_column: column,
    })

    if (!rpcError) return

    console.warn(
      `[whatsapp-webhook] RPC 'increment_metric' falhou, executando fallback: ${rpcError.message}`,
    )

    const { data: metricRow, error: selectError } = await supabase
      .from('metricas_diarias')
      .select(`id, ${column}`)
      .eq('data', today)
      .maybeSingle()

    if (selectError) {
      console.error(
        '[whatsapp-webhook] Erro no select de fallback de métricas:',
        JSON.stringify(selectError),
      )
      return
    }

    if (metricRow) {
      await supabase
        .from('metricas_diarias')
        .update({ [column]: (metricRow[column] ?? 0) + 1 })
        .eq('id', metricRow.id)
    } else {
      await supabase.from('metricas_diarias').insert({ data: today, [column]: 1 })
    }
  } catch (err) {
    console.error('[whatsapp-webhook] Metric increment error:', JSON.stringify(err))
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method === 'GET') {
    const url = new URL(req.url)
    const mode = url.searchParams.get('hub.mode')
    const token = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      return new Response(challenge ?? '', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      })
    }
    return new Response('Forbidden', { status: 403 })
  }

  const rawBody = await req.text()

  try {
    const signature = req.headers.get('X-Hub-Signature-256')
    if (APP_SECRET) {
      const isValid = await verifySignature(rawBody, signature)
      if (!isValid) {
        console.error('[whatsapp-webhook] Invalid signature')
        return new Response('OK', { status: 200, headers: corsHeaders })
      }
    }

    const body = JSON.parse(rawBody)
    const entry = body?.entry?.[0]
    const changes = entry?.changes?.[0]?.value
    const messages = changes?.messages

    if (!messages || messages.length === 0) {
      return new Response('OK', { status: 200, headers: corsHeaders })
    }

    const msg = messages[0]
    const fromPhone = msg.from
    const messageText = msg.text?.body ?? ''
    const contactName = changes?.contacts?.[0]?.profile?.name ?? 'Lead WhatsApp'
    const waId = changes?.contacts?.[0]?.wa_id ?? fromPhone
    const normalizedIncoming = normalizePhone(waId).slice(-11)

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // BUSCA DE ALTA PERFORMANCE: Filtra no banco antes de trazer para a memória
    const { data: matchedLeads, error: selectLeadError } = await supabase
      .from('leads')
      .select(
        'id, telefone, produto_interesse, vendedor_id, estagio, prioridade, proxima_acao, ia_ativa',
      ) // CORREÇÃO: Puxa o estado da ia_ativa [2]
      .ilike('telefone', `%${normalizePhone(waId).slice(-8)}%`)

    if (selectLeadError) {
      console.error(
        '[whatsapp-webhook] Erro ao buscar lead existente:',
        JSON.stringify(selectLeadError),
      )
    }

    let lead = matchedLeads?.find((l: any) =>
      normalizePhone(l.telefone).endsWith(normalizedIncoming),
    )
    let isNewLead = false

    if (!lead) {
      const { data: newLead, error: insertLeadError } = await supabase
        .from('leads')
        .insert({
          nome: contactName,
          telefone: fromPhone,
          estagio: 'novo',
          origem: 'whatsapp',
          prioridade: 2,
          produto_interesse: 'Outro',
          score_sdr: 0,
          ia_ativa: true, // Novo lead sempre nasce com a IA ligada por padrão [2]
        })
        .select()
        .single()

      if (insertLeadError) {
        console.error(
          '[whatsapp-webhook] Erro ao cadastrar novo lead:',
          JSON.stringify(insertLeadError),
        )
      }
      lead = newLead
      isNewLead = true
    }

    if (!lead) {
      console.error('[whatsapp-webhook] Failed to find or create lead')
      return new Response('OK', { status: 200, headers: corsHeaders })
    }

    // CORREÇÃO CRÍTICA (MODO COPILOTO): Se a IA do lead estiver desativada (humano assumiu), apenas registra a mensagem e não responde [2]
    if (lead.ia_ativa === false) {
      await supabase.from('interacoes_sdr').insert({
        lead_id: lead.id,
        mensagem_cliente: messageText,
        mensagem_ia: null, // Indica que o corretor humano é o responsável pela resposta ativa
        intencao_detectada: 'atendimento_humano',
        sentimento: 'neutro',
      })

      // Atualiza o timestamp de último contato, mas não consome API do Gemini nem dispara mensagem [2]
      await supabase
        .from('leads')
        .update({ ultimo_contato: new Date().toISOString() })
        .eq('id', lead.id)

      return new Response('OK', { status: 200, headers: corsHeaders })
    }

    const { data: chatHistory, error: historyError } = await supabase
      .from('interacoes_sdr')
      .select('mensagem_cliente, message:mensagem_ia')
      .eq('lead_id', lead.id)
      .order('data_hora', { ascending: false })
      .limit(6)

    const mappedHistory =
      chatHistory?.map((h: any) => ({
        mensagem_cliente: h.mensagem_cliente,
        mensagem_ia: h.message || h.mensagem_ia || '',
      })) || []

    if (historyError) {
      console.error(
        '[whatsapp-webhook] Erro ao buscar histórico de interações:',
        JSON.stringify(historyError),
      )
    }

    const inputProduct = analisarProdutoPorMensagem(messageText, lead.produto_interesse || 'Outro')
    const contatoCorretor = obterContatoCorretor(inputProduct)

    let vendedorId = lead.vendedor_id
    if (!vendedorId || inputProduct !== lead.produto_interesse) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', contatoCorretor.email)
        .maybeSingle()

      if (profileData) {
        vendedorId = profileData.id
      }
    }

    const contextoSeguro = await buscarContextoBaseConhecimento(supabase, messageText)
    const aiResponse = await generateAIResponse(messageText, mappedHistory, contextoSeguro)

    const indicaHandoff = aiResponse.includes('[CHAMAR_CORRETOR]')
    const indicaAgendamento = aiResponse.includes('[AGENDAR_CONTATO]')
    let finalResponse = aiResponse

    let estagioAtualizado = lead.estagio || 'novo'
    let prioridadeAtualizada = lead.prioridade || 2
    let proximaAcaoAtualizada = lead.proxima_acao || null
    let iaAtivaAtualizada = true // Mantém ligada a menos que ocorra o handoff [2]

    if (indicaHandoff) {
      finalResponse = finalResponse.replace('[CHAMAR_CORRETOR]', '').trim()
      estagioAtualizado = 'qualificado'
      prioridadeAtualizada = 1
      iaAtivaAtualizada = false // Desliga a IA automaticamente ao transferir para Gabriel ou Adriana! [2]

      const primeiroNomeCorretor =
        contatoCorretor.email === 'gabrielaraujo@kmzero.com.br' ? 'Gabriel' : 'Adriana'
      const textoIntro = encodeURIComponent(
        `Olá, ${primeiroNomeCorretor}! Fui atendido pela Ana no sistema e gostaria de receber minha simulação de ${inputProduct}.`,
      )
      const linkWhatsApp = `${contatoCorretor.link}?text=${textoIntro}`

      finalResponse += `\n\nO especialista que cuidará do seu atendimento é o *${primeiroNomeCorretor} Araújo*. Você pode falar diretamente com ele agora mesmo clicando no link abaixo:\n👉 ${linkWhatsApp}`
    } else if (indicaAgendamento) {
      finalResponse = finalResponse.replace('[AGENDAR_CONTATO]', '').trim()
      estagioAtualizado = 'contato'
      prioridadeAtualizada = 2
      proximaAcaoAtualizada = 'Ligar para agendamento - Horário sugerido na conversa.'
    }

    const { error: insertInteractionError } = await supabase.from('interacoes_sdr').insert({
      lead_id: lead.id,
      mensagem_cliente: messageText,
      mensagem_ia: finalResponse,
      intencao_detectada: messageText.toLowerCase().includes('preç') ? 'cotacao' : 'duvida',
      sentimento: 'neutro',
    })

    if (insertInteractionError) {
      console.error(
        '[whatsapp-webhook] Erro ao inserir interação sdr:',
        JSON.stringify(insertInteractionError),
      )
    }

    await supabase
      .from('leads')
      .update({
        produto_interesse: inputProduct,
        vendedor_id: vendedorId,
        estagio: estagioAtualizado,
        prioridade: prioridadeAtualizada,
        proxima_acao: proximaAcaoAtualizada,
        ia_ativa: iaAtivaAtualizada, // Atualiza se a IA deve silenciar [2]
        ultimo_contato: new Date().toISOString(),
      })
      .eq('id', lead.id)

    await safeIncrementMetric(supabase, isNewLead ? 'leads_novos' : 'leads_contatados')
    await sendWhatsAppMessage(fromPhone, finalResponse)

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (err) {
    console.error('[whatsapp-webhook] Unexpected error:', err)
    return new Response('OK', { status: 200, headers: corsHeaders })
  }
})
