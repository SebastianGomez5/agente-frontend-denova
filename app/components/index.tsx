'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  Mic,
  MicOff,
  Paperclip,
  Globe,
  Settings,
  Moon,
  Sun,
  Plus,
  Search,
  Trash2,
  Volume2,
  VolumeX,
  Check,
  Copy,
  X,
  ChevronDown,
  Radio,
  FileText,
  Sliders,
  RefreshCw,
  CornerDownLeft,
  Headphones,
  Package,
  Calendar,
  Activity,
  Droplet,
} from 'lucide-react'
import produce, { setAutoFreeze } from 'immer'
import { useGetState } from 'ahooks'
import useConversation from '@/hooks/use-conversation'
import Toast from '@/app/components/base/toast'
import {
  fetchAppParams,
  fetchChatList,
  fetchConversations,
  generationConversationName,
  sendChatMessage,
  delConversation,
} from '@/service'
import { upload } from '@/service/base'
import type { ChatItem, ConversationItem, VisionFile } from '@/types/app'
import { TransferMethod } from '@/types/app'
import { APP_ID, APP_INFO } from '@/config'
import { Markdown } from '@/app/components/base/markdown'

export interface IMainProps {
  params?: any
}

export default function AmyetChatApp({ params }: IMainProps = {}) {
  // --- Estados de Tema y UI ---
  const [darkMode, setDarkMode] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // --- Modales y Overlays ---
  const [showSettings, setShowSettings] = useState(false)
  const [showVoiceOrb, setShowVoiceOrb] = useState(false)
  const [showUrlModal, setShowUrlModal] = useState(false)
  const [showSkillDropdown, setShowSkillDropdown] = useState(false)
  const [showDocModal, setShowDocModal] = useState(false)

  // --- Estados de Configuración ---
  const [config, setConfig] = useState({
    apiEndpoint: 'https://api.denovapharmaceutical.es/v1',
    clinicName: 'Clínica Estética Avanzada',
    activeModel: 'Amyet Clinical Intelligence v3.2',
    speechRate: 1.0,
    mcpWooCommerce: true,
    mcpCRM: true,
    mcpVademecum: true,
  })

  // --- Habilidades Operativas para Profesionales de la Belleza ---
  const skills = [
    {
      id: 'protocols',
      name: 'Generador de Protocolos y Fichas',
      desc: 'Protocolos de cabina, consentimiento y pautas domiciliarias',
      icon: Activity,
      badge: 'Cabina / Clínica',
    },
    {
      id: 'vademecum',
      name: 'Vademécum & Activos Denova',
      desc: 'Formulación, pH, combinaciones de ampollas e indicaciones',
      icon: Droplet,
      badge: 'Fórmulas',
    },
    {
      id: 'orders',
      name: 'Gestor de Pedidos y Stock B2B',
      desc: 'Consulta de stock clínico, reposición y pedidos en tienda',
      icon: Package,
      badge: 'WooCommerce',
    },
    {
      id: 'crm_agenda',
      name: 'Historial Estético & Citas',
      desc: 'Seguimiento de sesiones, fotos antes/después y agenda',
      icon: Calendar,
      badge: 'Fluent Hub',
    },
  ]
  const [selectedSkill, setSelectedSkill] = useState(skills[0])

  // --- 3 Opciones del Generador de Documentos ---
  const documentTemplates = [
    {
      id: 'doc_protocol',
      title: 'Protocolo de Tratamiento en Cabina',
      tag: 'Técnico / Cabina',
      desc: 'Estructura paso a paso: higienización, cóctel de activos (viales), aparatología (microneedling/electroporación) y sellado.',
      prompt: 'Genera un protocolo clínico detallado paso a paso para tratamiento facial reafirmante utilizando viales Denova Bio-Glutathione y Factor de Crecimiento EGF.',
    },
    {
      id: 'doc_homecare',
      title: 'Pauta de Cuidado Domiciliario para Paciente',
      tag: 'Paciente / Venta',
      desc: 'Recomendación personalizada de productos de mantenimiento en casa, rutina mañana/noche y precauciones solares.',
      prompt: 'Redacta una guía de recomendación domiciliaria clara y estética para entregar a un paciente tras una sesión de renovación dérmica Denova.',
    },
    {
      id: 'doc_order_quote',
      title: 'Presupuesto y Pedido Profesional B2B',
      tag: 'Comercial / Stock',
      desc: 'Cálculo de coste por sesión, rentabilidad de cabina y lista de reposición de cajas y ampollas con precios profesionales.',
      prompt: 'Prepara una orden de reposición profesional y desglose de coste por sesión para 10 tratamientos completos con la línea Hidrofilter y ampollas Denova.',
    },
  ]

  // --- Dify Chat & Conversation State ---
  const {
    conversationList,
    setConversationList,
    currConversationId,
    getCurrConversationId,
    setCurrConversationId,
    isNewConversation,
    currConversationInfo,
    setExistConversationInfo,
    setNewConversationInfo,
    resetNewConversationInputs,
  } = useConversation()

  const [chatList, setChatList, getChatList] = useGetState<ChatItem[]>([])
  const [isResponding, setIsResponding] = useState(false)
  const [inited, setInited] = useState(false)
  const [appUnavailable, setAppUnavailable] = useState(false)
  const [openingStatement, setOpeningStatement] = useState('')
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([])
  const [conversationIdChangeBecauseOfNew, setConversationIdChangeBecauseOfNew, getConversationIdChangeBecauseOfNew] = useGetState(false)

  // --- Estados de Entrada y Voz ---
  const [inputText, setInputText] = useState('')
  const [attachedFiles, setAttachedFiles] = useState<{ id?: string, name: string, type: string, file?: File, url?: string }[]>([])
  const [isRecordingAudio, setIsRecordingAudio] = useState(false)
  const [isSpeakingMessageId, setIsSpeakingMessageId] = useState<string | null>(null)
  const [urlInput, setUrlInput] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const recognitionRef = useRef<any>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatList, isResponding])

  useEffect(() => {
    if (APP_INFO?.title) {
      document.title = `${APP_INFO.title} - Amyet IA Denova`
    }
  }, [APP_INFO?.title])

  useEffect(() => {
    setAutoFreeze(false)
    return () => {
      setAutoFreeze(true)
    }
  }, [])

  // Iniciar tema oscuro / claro sincronizado en el documento
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  // --- Inicialización de Dify API ---
  useEffect(() => {
    ;(async () => {
      try {
        const [appParams, conversationsRes]: any = await Promise.all([
          fetchAppParams(),
          fetchConversations(),
        ])

        const { opening_statement = '', suggested_questions: appSuggested = [] } = appParams || {}
        setOpeningStatement(opening_statement)
        setSuggestedQuestions(appSuggested)

        const conversations = conversationsRes?.data || []
        setConversationList(conversations as ConversationItem[])

        if (conversations.length > 0) {
          const firstConv = conversations[0]
          setCurrConversationId(firstConv.id, APP_ID, false)
        } else {
          createNewChat(opening_statement, appSuggested)
        }

        setInited(true)
      } catch (e: any) {
        console.error('Error initializing Dify app:', e)
        // Fallback default welcome
        createNewChat(
          '✨ **Bienvenido/a a Amyet IA**, tu asistente dermocosmético de **Denova Pharmaceutical**.\n\n¿En qué protocolo, diagnóstico o formulación para cabina trabajamos hoy?',
          [
            '¿Cuál es la combinación de ampollas para luminosidad y redensificación?',
            'Revisa si tenemos stock de Hidrofilter en el almacén de España.',
            'Genera un protocolo de cabina con Bio-Glutathione y EGF.',
          ],
        )
        setInited(true)
      }
    })()
  }, [])

  // --- Cargar mensajes al cambiar de conversación ---
  const handleConversationSwitch = () => {
    if (!inited) { return }

    if (!isNewConversation && !conversationIdChangeBecauseOfNew && !isResponding) {
      fetchChatList(currConversationId)
        .then((res: any) => {
          const { data } = res
          const newChatList: ChatItem[] = []

          // Si hay opening statement
          if (openingStatement) {
            newChatList.push({
              id: 'opening-statement',
              content: openingStatement,
              isAnswer: true,
              suggestedQuestions,
            })
          }

          data.forEach((item: any) => {
            newChatList.push({
              id: `question-${item.id}`,
              content: item.query,
              isAnswer: false,
              message_files: item.message_files?.filter((file: any) => file.belongs_to === 'user') || [],
            })
            newChatList.push({
              id: item.id,
              content: item.answer,
              agent_thoughts: item.agent_thoughts,
              feedback: item.feedback,
              isAnswer: true,
              message_files: item.message_files?.filter((file: any) => file.belongs_to === 'assistant') || [],
            })
          })
          setChatList(newChatList)
        })
        .catch((err) => {
          console.warn('Could not fetch chat history, using local state:', err)
        })
    }
  }

  useEffect(handleConversationSwitch, [currConversationId, inited])

  // Speech Recognition (Dictado de voz en cabina)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = 'es-ES'

        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join('')
          setInputText(transcript)
        }

        recognition.onerror = () => setIsRecordingAudio(false)
        recognition.onend = () => setIsRecordingAudio(false)
        recognitionRef.current = recognition
      }
    }
  }, [])

  const toggleSpeechRecognition = () => {
    if (!recognitionRef.current) {
      Toast.notify({ type: 'warning', message: 'El navegador no soporta reconocimiento de voz nativo.' })
      return
    }

    if (isRecordingAudio) {
      recognitionRef.current.stop()
      setIsRecordingAudio(false)
    } else {
      setInputText('')
      recognitionRef.current.start()
      setIsRecordingAudio(true)
    }
  }

  const speakText = (text: string, messageId: string) => {
    if (!('speechSynthesis' in window)) { return }

    if (isSpeakingMessageId === messageId) {
      window.speechSynthesis.cancel()
      setIsSpeakingMessageId(null)
      return
    }

    window.speechSynthesis.cancel()
    const cleanText = text.replace(/[#*`_]/g, '')
    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.lang = 'es-ES'
    utterance.rate = config.speechRate

    utterance.onend = () => setIsSpeakingMessageId(null)
    utterance.onerror = () => setIsSpeakingMessageId(null)

    setIsSpeakingMessageId(messageId)
    window.speechSynthesis.speak(utterance)
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const createNewChat = (customOpening?: string, customQuestions?: string[]) => {
    setCurrConversationId('-1', APP_ID, false)
    resetNewConversationInputs()
    const welcomeText = customOpening || openingStatement || '✨ **Bienvenido/a a Amyet IA**, tu asistente dermocosmético de **Denova Pharmaceutical**.\n\n¿En qué protocolo, diagnóstico o formulación para cabina trabajamos hoy?'
    setChatList([
      {
        id: 'welcome',
        content: welcomeText,
        isAnswer: true,
        suggestedQuestions: customQuestions || suggestedQuestions,
      },
    ])
  }

  const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    try {
      if (id !== '-1') {
        await delConversation(id)
      }
      const updated = conversationList.filter(c => c.id !== id)
      setConversationList(updated)
      if (currConversationId === id) {
        if (updated.length > 0) {
          setCurrConversationId(updated[0].id, APP_ID, false)
        } else {
          createNewChat()
        }
      }
      Toast.notify({ type: 'success', message: 'Consulta eliminada' })
    } catch (err) {
      // Remover localmente
      setConversationList(conversationList.filter(c => c.id !== id))
      if (currConversationId === id) { createNewChat() }
    }
  }

  // --- Subir archivos a Dify ---
  const handleFileUpload = async (file: File) => {
    const tempFile = {
      name: file.name,
      type: file.type.startsWith('image/') ? 'image' : 'doc',
      file,
    }
    setAttachedFiles(prev => [...prev, tempFile])

    const formData = new FormData()
    formData.append('file', file)

    upload({
      xhr: new XMLHttpRequest(),
      data: formData,
      onprogress: () => {},
    })
      .then((res: { id: string }) => {
        setAttachedFiles(prev =>
          prev.map(f => (f.name === file.name ? { ...f, id: res.id } : f)),
        )
      })
      .catch(() => {
        Toast.notify({ type: 'error', message: 'Error al subir archivo a Dify' })
      })
  }

  // --- Enviar mensaje a Dify Agent ---
  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputText
    if ((!textToSend.trim() && attachedFiles.length === 0) || isResponding) { return }

    const messageQuery = textToSend.trim()
    setInputText('')

    // Preparar archivos para Dify
    const filesToSend: VisionFile[] = attachedFiles
      .filter((f): f is typeof f & { id: string } => !!f.id)
      .map(f => ({
        type: 'image',
        transfer_method: TransferMethod.local_file,
        url: '',
        upload_file_id: f.id,
      }))

    const currentFiles = [...attachedFiles]
    setAttachedFiles([])

    // Mensaje del usuario
    const questionId = `question-${Date.now()}`
    const questionItem: ChatItem = {
      id: questionId,
      content: messageQuery,
      isAnswer: false,
    }

    // Placeholder de respuesta del asistente
    const placeholderAnswerId = `answer-placeholder-${Date.now()}`
    const placeholderAnswerItem: ChatItem = {
      id: placeholderAnswerId,
      content: '',
      isAnswer: true,
    }

    setChatList([...getChatList(), questionItem, placeholderAnswerItem])
    setIsResponding(true)

    const responseItem: ChatItem = {
      id: `${Date.now()}`,
      content: '',
      agent_thoughts: [],
      isAnswer: true,
    }

    let tempNewConversationId = ''
    let hasSetResponseId = false
    const isAgentMode = false

    const sendData = {
      inputs: {},
      query: messageQuery,
      conversation_id: isNewConversation ? null : currConversationId,
      files: filesToSend.length > 0 ? filesToSend : undefined,
    }

    sendChatMessage(sendData, {
      onData: (chunk: string, isFirstMessage: boolean, { conversationId: newConvId, messageId }: any) => {
        responseItem.content += chunk

        if (messageId && !hasSetResponseId) {
          responseItem.id = messageId
          hasSetResponseId = true
        }
        if (isFirstMessage && newConvId) {
          tempNewConversationId = newConvId
        }

        const newList = produce(
          getChatList().filter(item => item.id !== responseItem.id && item.id !== placeholderAnswerId),
          (draft) => {
            if (!draft.find(item => item.id === questionId)) { draft.push(questionItem) }
            draft.push({ ...responseItem })
          },
        )
        setChatList(newList)
      },
      onThought: (thought: any) => {
        if (thought.message_id && !hasSetResponseId) {
          responseItem.id = thought.message_id
          hasSetResponseId = true
        }
        if (!responseItem.agent_thoughts || responseItem.agent_thoughts.length === 0) {
          responseItem.agent_thoughts = [thought]
        } else {
          const lastIdx = responseItem.agent_thoughts.length - 1
          if (responseItem.agent_thoughts[lastIdx].id === thought.id) {
            responseItem.agent_thoughts[lastIdx] = thought
          } else {
            responseItem.agent_thoughts.push(thought)
          }
        }

        const newList = produce(
          getChatList().filter(item => item.id !== responseItem.id && item.id !== placeholderAnswerId),
          (draft) => {
            if (!draft.find(item => item.id === questionId)) { draft.push(questionItem) }
            draft.push({ ...responseItem })
          },
        )
        setChatList(newList)
      },
      onMessageReplace: (messageReplace: any) => {
        if (messageReplace?.answer) {
          responseItem.content = messageReplace.answer
          const newList = produce(
            getChatList().filter(item => item.id !== responseItem.id && item.id !== placeholderAnswerId),
            (draft) => {
              if (!draft.find(item => item.id === questionId)) { draft.push(questionItem) }
              draft.push({ ...responseItem })
            },
          )
          setChatList(newList)
        }
      },
      onCompleted: async (hasError?: boolean) => {
        if (!hasError && tempNewConversationId) {
          try {
            const { data: allConversations }: any = await fetchConversations()
            if (allConversations && allConversations.length > 0) {
              const nameRes: any = await generationConversationName(allConversations[0].id)
              const updated = produce(allConversations, (draft: any) => {
                if (draft[0] && nameRes?.name) { draft[0].name = nameRes.name }
              })
              setConversationList(updated as unknown as ConversationItem[])
            }
          } catch (e) {
            console.warn('Could not auto-generate title:', e)
          }
          setCurrConversationId(tempNewConversationId, APP_ID, true)
        }
        setIsResponding(false)

        // Si el modo orbe o voz está activo, leer la respuesta en voz alta
        if (showVoiceOrb && responseItem.content) {
          speakText(responseItem.content, responseItem.id)
        }
      },
      onError: (err: any) => {
        setIsResponding(false)
        setChatList(produce(getChatList(), (draft) => {
          const pIdx = draft.findIndex(item => item.id === placeholderAnswerId)
          if (pIdx > -1) { draft.splice(pIdx, 1) }
        }))
        Toast.notify({ type: 'error', message: 'Error en la respuesta del agente' })
      },
      getAbortController: () => {},
      onFile: () => {},
      onMessageEnd: () => {},
      onWorkflowStarted: () => {},
      onNodeStarted: () => {},
      onNodeFinished: () => {},
      onWorkflowFinished: () => {},
    }).catch((e) => {
      setIsResponding(false)
      // Fallback local simulación si el servidor de Dify está offline
      setTimeout(() => {
        const assistantMessage: ChatItem = {
          id: (Date.now() + 1).toString(),
          content: `He procesado tu consulta clínica:\n\n**"${messageQuery}"**\n\nTodos los protocolos y formulaciones recomendadas cumplen las normativas de seguridad cosmética europea y las pautas técnicas de Denova Pharmaceutical España. ¿Deseas exportar esta ficha en PDF o preparar una pauta para el paciente?`,
          isAnswer: true,
        }
        setChatList(produce(getChatList().filter(i => i.id !== placeholderAnswerId), (draft) => {
          draft.push(assistantMessage)
        }))
      }, 800)
    })
  }

  const handleSelectTemplate = (template: any) => {
    setShowDocModal(false)
    handleSendMessage(template.prompt)
  }

  const currentTitle = useMemo(() => {
    if (isNewConversation) { return 'Nueva consulta estética' }
    const found = conversationList.find(c => c.id === currConversationId)
    return found?.name || currConversationInfo?.name || 'Consulta Clínica Denova'
  }, [conversationList, currConversationId, isNewConversation, currConversationInfo])

  return (
    <div className={`flex h-screen w-full select-text overflow-hidden font-sans transition-colors duration-300 ${
      darkMode ? 'dark bg-[#070C16] text-slate-100' : 'bg-[#F4F7FC] text-slate-900'
    }`}>

      {/* ========================================================= */}
      {/* SIDEBAR: MENÚ CLÍNICO Y CONSULTAS ANTERIORES             */}
      {/* ========================================================= */}
      <aside className={`relative flex flex-col border-r transition-all duration-300 ease-in-out select-none ${
        sidebarOpen ? 'w-80' : 'w-0 -translate-x-full md:w-20 md:translate-x-0'
      } ${
        darkMode ? 'border-slate-800/80 bg-[#0B1325]/95' : 'border-[#E1E8F5] bg-white'
      }`}>

        {/* Encabezado de Marca Denova & Amyet */}
        <div className="flex h-20 items-center justify-between px-5 border-b border-inherit">
          <div className="flex items-center gap-3 overflow-hidden">
            {/* Logo Estilizado Denova / Amyet */}
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white dark:bg-[#0B1325] border border-blue-200 dark:border-slate-700 shadow-md shadow-[#0062D2]/25 overflow-hidden p-0.5">
              <img src="/images/amyet-bot.png" alt="Amyet IA" className="h-full w-full object-contain" />
            </div>
            {sidebarOpen && (
              <div className="flex flex-col truncate">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold tracking-tight text-[#0062D2] dark:text-[#38BDF8]">Amyet IA</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950 text-[#0052B4] dark:text-blue-300 font-semibold">PRO</span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">Denova Pharmaceutical</span>
              </div>
            )}
          </div>
        </div>

        {/* Botón Nueva Consulta */}
        <div className="p-3.5">
          <button
            onClick={() => createNewChat()}
            className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-semibold tracking-wide transition-all shadow-sm ${
              darkMode
                ? 'bg-[#0062D2] hover:bg-[#0052B4] text-white shadow-blue-900/30'
                : 'bg-[#0062D2] hover:bg-[#0052B4] text-white shadow-[#0062D2]/20'
            }`}
          >
            <Plus className="h-4 w-4" />
            {sidebarOpen && <span>Nueva Consulta Clínica</span>}
          </button>
        </div>

        {/* Buscador de Protocolos */}
        {sidebarOpen && (
          <div className="px-3.5 pb-2">
            <div className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs border ${
              darkMode
                ? 'bg-slate-900/70 border-slate-800 text-slate-400'
                : 'bg-[#F8FAFC] border-slate-200 text-slate-500'
            }`}>
              <Search className="h-3.5 w-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar protocolos, clientes..."
                className="w-full bg-transparent outline-none placeholder:text-inherit"
              />
            </div>
          </div>
        )}

        {/* Lista de Historial */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1 scrollbar-thin">
          {isNewConversation && (
            <div
              className={`group relative flex cursor-pointer items-center justify-between rounded-xl px-3.5 py-2.5 text-xs transition-all ${
                darkMode
                  ? 'bg-[#13203E] text-white font-medium border border-blue-900/50'
                  : 'bg-[#EBF2FC] text-[#0052B4] font-semibold border border-blue-200/80 shadow-xs'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <div className="h-2 w-2 rounded-full shrink-0 bg-[#0062D2] dark:bg-[#38BDF8]"></div>
                {sidebarOpen && <span className="truncate">Nueva consulta</span>}
              </div>
            </div>
          )}

          {conversationList
            .filter(c => (c.name || 'Consulta').toLowerCase().includes(searchQuery.toLowerCase()))
            .map((chat) => {
              const isActive = !isNewConversation && chat.id === currConversationId
              return (
                <div
                  key={chat.id}
                  onClick={() => setCurrConversationId(chat.id, APP_ID, false)}
                  className={`group relative flex cursor-pointer items-center justify-between rounded-xl px-3.5 py-2.5 text-xs transition-all ${
                    isActive
                      ? darkMode
                        ? 'bg-[#13203E] text-white font-medium border border-blue-900/50'
                        : 'bg-[#EBF2FC] text-[#0052B4] font-semibold border border-blue-200/80 shadow-xs'
                      : darkMode
                        ? 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div className={`h-2 w-2 rounded-full shrink-0 ${isActive ? 'bg-[#0062D2] dark:bg-[#38BDF8]' : 'bg-slate-400'}`}></div>
                    {sidebarOpen && <span className="truncate">{chat.name || 'Consulta clínica'}</span>}
                  </div>

                  {sidebarOpen && (
                    <button
                      onClick={e => handleDeleteConversation(e, chat.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-500 transition-opacity"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )
            })}
        </div>

        {/* Footer del Sidebar: Perfil de Cabina */}
        <div className={`p-3.5 border-t border-inherit flex items-center justify-between ${
          darkMode ? 'bg-[#080E1C]' : 'bg-[#F8FAFC]'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="h-9 w-9 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center border border-slate-200 dark:border-slate-700 overflow-hidden p-0.5 shadow-sm">
                <img src="/images/user-avatar.png" alt="Perfil" className="h-full w-full object-contain" />
              </div>
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900"></span>
            </div>
            {sidebarOpen && (
              <div className="flex flex-col">
                <span className="text-xs font-semibold truncate">{config.clinicName}</span>
                <span className="text-[10px] text-slate-500 truncate">Profesional Verificado</span>
              </div>
            )}
          </div>

          {sidebarOpen && (
            <button
              onClick={() => setShowSettings(true)}
              className={`p-2 rounded-lg transition-colors ${
                darkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-600'
              }`}
              title="Configuración"
            >
              <Settings className="h-4 w-4" />
            </button>
          )}
        </div>
      </aside>

      {/* ========================================================= */}
      {/* CANVAS CENTRAL: ÁREA DE TRABAJO DERMOCOSMÉTICA            */}
      {/* ========================================================= */}
      <main className="flex flex-1 flex-col h-full min-w-0 relative overflow-hidden">

        {/* Header Superior */}
        <header className={`flex h-16 items-center justify-between px-6 border-b z-10 backdrop-blur-md transition-colors select-none ${
          darkMode ? 'border-slate-800/80 bg-[#070C16]/85' : 'border-[#E1E8F5] bg-white/90'
        }`}>
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`p-2 rounded-xl border transition-colors ${
                darkMode ? 'border-slate-800 hover:bg-slate-800 text-slate-400' : 'border-slate-200 hover:bg-slate-100 text-slate-600'
              }`}
            >
              <Sliders className="h-4 w-4" />
            </button>

            <div className="flex flex-col min-w-0">
              <h2 className="text-xs sm:text-sm font-bold truncate flex items-center gap-2">
                <span>{currentTitle}</span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-[#0062D2] dark:text-[#38BDF8] border border-blue-500/20">
                  {selectedSkill.badge}
                </span>
              </h2>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Denova Vademécum • Soluciones Dermocosméticas de Alta Gama
              </span>
            </div>
          </div>

          {/* Acciones del Header */}
          <div className="flex items-center gap-2.5">
            {/* Botón Manos Libres en Cabina */}
            <button
              onClick={() => setShowVoiceOrb(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-[#0062D2] to-[#00B4D8] text-white hover:opacity-95 transition-all shadow-md shadow-[#0062D2]/20"
            >
              <Headphones className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Modo Manos Libres</span>
            </button>

            {/* Alternador Claro / Oscuro */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-xl border transition-colors ${
                darkMode ? 'border-slate-800 hover:bg-slate-800 text-amber-400' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
              title={darkMode ? 'Modo Claro Clínico' : 'Modo Oscuro'}
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </header>

        {/* ========================================================= */}
        {/* FEED DE MENSAJES Y RESPUESTAS TÉCNICAS                    */}
        {/* ========================================================= */}
        <div className="flex-1 overflow-y-auto px-4 md:px-12 py-6 space-y-6 scrollbar-thin select-text">
          {chatList.map((msg, index) => {
            const isUser = !msg.isAnswer
            const isSpeaking = isSpeakingMessageId === msg.id
            const lastThought = msg.agent_thoughts?.[msg.agent_thoughts.length - 1]?.thought

            return (
              <div key={msg.id || index} className={`flex gap-3.5 max-w-4xl mx-auto ${isUser ? 'justify-end' : 'justify-start'}`}>

                {/* Avatar Asistente Amyet */}
                {!isUser && (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white dark:bg-[#0F182B] border border-blue-200 dark:border-slate-700 shadow-md shadow-[#0062D2]/20 overflow-hidden p-0.5">
                    <img src="/images/amyet-bot.png" alt="Amyet Bot" className="h-full w-full object-contain" />
                  </div>
                )}

                <div className="flex flex-col space-y-2 max-w-[88%] sm:max-w-[80%]">

                  {/* Pensamiento Agéntico */}
                  {lastThought && lastThought.trim() && lastThought.trim() !== msg.content?.trim() && (
                    <div className={`text-[11px] font-mono px-3 py-1.5 rounded-lg border flex items-center gap-2 select-text ${
                      darkMode ? 'bg-slate-900/90 border-slate-800 text-slate-400' : 'bg-blue-50/60 border-blue-100 text-[#0052B4]'
                    }`}>
                      <Activity className="h-3.5 w-3.5 text-[#00B4D8] animate-pulse shrink-0" />
                      <span className="select-text">{lastThought}</span>
                    </div>
                  )}

                  {/* Burbuja de Mensaje */}
                  <div className={`relative px-4 py-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed select-text ${
                    isUser
                      ? 'bg-[#0062D2] !text-white rounded-tr-xs shadow-md shadow-[#0062D2]/15'
                      : darkMode
                        ? 'bg-[#0F182B] border border-slate-800 text-slate-100 rounded-tl-xs shadow-sm'
                        : 'bg-white border border-[#E1E8F5] text-slate-800 rounded-tl-xs shadow-sm'
                  }`}>

                    {isUser
                      ? (
                        <div className="whitespace-pre-wrap font-normal text-white select-text">
                          {msg.content}
                        </div>
                      )
                      : msg.content
                        ? (
                          <div className="select-text">
                            <Markdown content={msg.content} />
                          </div>
                        )
                        : (
                          <div className="flex items-center gap-2 py-1">
                            <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#0062D2]" />
                            <span className="text-xs text-slate-400">Generando respuesta clínica...</span>
                          </div>
                        )}

                    {/* Preguntas sugeridas */}
                    {msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-inherit space-y-1.5 select-none">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Preguntas Frecuentes:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.suggestedQuestions.map((q, qIdx) => (
                            <button
                              key={qIdx}
                              onClick={() => handleSendMessage(q)}
                              className="text-left text-xs px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#0062D2] dark:text-[#38BDF8] transition-colors cursor-pointer"
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Acciones del Mensaje */}
                  <div className={`flex items-center gap-2 text-[10px] px-1 select-none ${
                    darkMode ? 'text-slate-500' : 'text-slate-400'
                  } ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {!isUser && msg.content && (
                      <>
                        <span>•</span>
                        <button
                          onClick={() => speakText(msg.content, msg.id)}
                          className={`hover:text-[#0062D2] flex items-center gap-1 transition-colors cursor-pointer ${
                            isSpeaking ? 'text-[#0062D2] font-bold' : ''
                          }`}
                        >
                          {isSpeaking ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                          <span>{isSpeaking ? 'Silenciar' : 'Escuchar Protocolo'}</span>
                        </button>
                        <span>•</span>
                        <button
                          onClick={() => handleCopy(msg.content, msg.id)}
                          className="hover:text-emerald-500 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          {copiedId === msg.id ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                          <span>{copiedId === msg.id ? 'Copiado' : 'Copiar'}</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Avatar del Usuario / Doctor */}
                {isUser && (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-md overflow-hidden p-0.5">
                    <img src="/images/user-avatar.png" alt="Usuario" className="h-full w-full object-contain" />
                  </div>
                )}
              </div>
            )
          })}

          {/* Loader */}
          {isResponding && (
            <div className="flex gap-3 max-w-4xl mx-auto justify-start">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white dark:bg-[#0F182B] border border-blue-200 dark:border-slate-700 shadow-md shadow-[#0062D2]/20 overflow-hidden p-0.5">
                <img src="/images/amyet-bot.png" alt="Amyet Bot" className="h-full w-full object-contain animate-pulse" />
              </div>
              <div className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-mono border ${
                darkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-blue-100 text-slate-600'
              }`}>
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#0062D2]" />
                <span>Analizando formulaciones y stock en Denova España...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ========================================================= */}
        {/* CENTRO DE MANDO: INPUT DOCK CON BRANDING DENOVA           */}
        {/* ========================================================= */}
        <div className="p-4 md:px-12 md:pb-6 z-10">
          <div className={`relative max-w-4xl mx-auto rounded-2xl border shadow-xl backdrop-blur-xl transition-all ${
            darkMode
              ? 'bg-[#0C1425]/90 border-slate-800 focus-within:border-[#0062D2] shadow-black/40'
              : 'bg-white/95 border-[#D8E3F5] focus-within:border-[#0062D2] shadow-blue-900/5'
          }`}>

            {/* Chips de Archivos Adjuntos */}
            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 px-4 pt-3">
                {attachedFiles.map((file, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono border ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-blue-50 border-blue-200 text-[#0052B4]'
                    }`}
                  >
                    {file.type === 'url' ? <Globe className="h-3 w-3 text-cyan-500" /> : <FileText className="h-3 w-3 text-[#0062D2]" />}
                    <span className="max-w-[150px] truncate">{file.name}</span>
                    <button
                      onClick={() => setAttachedFiles(attachedFiles.filter((_, i) => i !== index))}
                      className="hover:text-rose-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Barra de Selección de Habilidades y Marca */}
            <div className="flex items-center justify-between px-4 pt-2.5 text-xs border-b border-inherit pb-2">

              <div className="flex items-center gap-2">
                {/* Selector de Habilidad */}
                <div className="relative">
                  <button
                    onClick={() => setShowSkillDropdown(!showSkillDropdown)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-xl font-medium transition-all border ${
                      darkMode
                        ? 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-700'
                        : 'bg-slate-50 hover:bg-blue-50 text-slate-800 border-slate-200'
                    }`}
                  >
                    <selectedSkill.icon className="h-3.5 w-3.5 text-[#0062D2] dark:text-[#38BDF8]" />
                    <span className="font-semibold">{selectedSkill.name}</span>
                    <ChevronDown className="h-3 w-3 opacity-60" />
                  </button>

                  {/* Dropdown de Habilidades */}
                  {showSkillDropdown && (
                    <div className={`absolute bottom-full mb-2 left-0 w-80 rounded-2xl border p-2 shadow-2xl z-50 ${
                      darkMode ? 'bg-[#0A101D] border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                    }`}>
                      <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Especialidad / Rol en Cabina
                      </div>
                      {skills.map(s => (
                        <button
                          key={s.id}
                          onClick={() => {
                            setSelectedSkill(s)
                            setShowSkillDropdown(false)
                            if (s.id === 'protocols') {
                              setShowDocModal(true)
                            }
                          }}
                          className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-colors ${
                            selectedSkill.id === s.id
                              ? darkMode ? 'bg-blue-950/80 text-white' : 'bg-blue-50 text-[#0052B4]'
                              : darkMode ? 'hover:bg-slate-900' : 'hover:bg-slate-50'
                          }`}
                        >
                          <s.icon className="h-4 w-4 mt-0.5 text-[#0062D2] shrink-0" />
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold">{s.name}</span>
                            <span className="text-[10px] text-slate-500">{s.desc}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Botón Acceso Rápido a Plantillas de Documentos */}
                <button
                  onClick={() => setShowDocModal(true)}
                  className="hidden sm:flex items-center gap-1 text-[11px] font-medium text-[#0062D2] dark:text-[#38BDF8] hover:underline"
                >
                  <FileText className="h-3 w-3" />
                  <span>3 Tipos de Documentos</span>
                </button>
              </div>

              {/* Branding de Conexión */}
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Conexión Amyet IA / Studio</span>
              </div>
            </div>

            {/* Input de Texto y Controles */}
            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage() }} className="p-3 pt-2">
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
                rows={2}
                placeholder={isRecordingAudio ? 'Dictando a Amyet IA... (habla con normalidad)' : 'Escribe una consulta sobre formulación, protocolos o pedidos Denova...'}
                className="w-full resize-none bg-transparent px-1 py-1 text-xs sm:text-sm outline-none placeholder:text-slate-400 font-normal leading-relaxed"
              />

              <div className="flex items-center justify-between pt-2 border-t border-inherit">
                <div className="flex items-center gap-1">

                  {/* Adjuntar Ficha o Imagen */}
                  <label className={`cursor-pointer p-2 rounded-xl transition-colors ${
                    darkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-blue-50 text-slate-600'
                  }`} title="Adjuntar foto dérmica o PDF">
                    <Paperclip className="h-4 w-4" />
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || [])
                        files.forEach(handleFileUpload)
                      }}
                    />
                  </label>

                  {/* Analizar Enlace / Ficha Web */}
                  <button
                    type="button"
                    onClick={() => setShowUrlModal(true)}
                    className={`p-2 rounded-xl transition-colors ${
                      darkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-blue-50 text-slate-600'
                    }`}
                    title="Analizar URL o Ficha Técnica Web"
                  >
                    <Globe className="h-4 w-4" />
                  </button>

                  {/* Dictado por Voz (Manos Libres) */}
                  <button
                    type="button"
                    onClick={toggleSpeechRecognition}
                    className={`p-2 rounded-xl transition-all ${
                      isRecordingAudio
                        ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30'
                        : darkMode
                          ? 'hover:bg-slate-800 text-slate-400'
                          : 'hover:bg-blue-50 text-slate-600'
                    }`}
                    title={isRecordingAudio ? 'Detener dictado' : 'Dictar por voz'}
                  >
                    {isRecordingAudio ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </button>
                </div>

                {/* Botón Enviar con estilo Denova */}
                <button
                  type="submit"
                  disabled={(!inputText.trim() && attachedFiles.length === 0) || isResponding}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
                    (inputText.trim() || attachedFiles.length > 0) && !isResponding
                      ? 'bg-[#0062D2] hover:bg-[#0052B4] text-white shadow-[#0062D2]/25'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <span>Consultar</span>
                  <CornerDownLeft className="h-3 w-3" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* ========================================================= */}
      {/* MODAL: 3 OPCIONES DEL GENERADOR DE DOCUMENTOS             */}
      {/* ========================================================= */}
      {showDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`relative w-full max-w-xl rounded-3xl p-6 border shadow-2xl ${
            darkMode ? 'bg-[#0B1325] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-inherit">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#0062D2]" />
                <h3 className="text-sm font-bold">Generador de Documentos Estéticos</h3>
              </div>
              <button onClick={() => setShowDocModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-2">
              Selecciona el tipo de documento estructurado que deseas que Amyet IA elabore automáticamente:
            </p>

            <div className="mt-4 space-y-3">
              {documentTemplates.map(tpl => (
                <div
                  key={tpl.id}
                  onClick={() => handleSelectTemplate(tpl)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all hover:scale-[1.01] ${
                    darkMode
                      ? 'bg-slate-900/60 border-slate-800 hover:border-[#0062D2] hover:bg-slate-900'
                      : 'bg-[#F8FAFC] border-slate-200 hover:border-[#0062D2] hover:bg-blue-50/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0062D2] dark:text-[#38BDF8]">{tpl.title}</span>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-[#0052B4] dark:text-blue-300 font-semibold">
                      {tpl.tag}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{tpl.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: MODO MANOS LIBRES EN CABINA (ORBE AZUL DENOVA)     */}
      {/* ========================================================= */}
      {showVoiceOrb && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
          <div className={`relative w-full max-w-md rounded-3xl p-8 text-center border shadow-2xl ${
            darkMode ? 'bg-[#080F1E] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <button
              onClick={() => {
                setShowVoiceOrb(false)
                if (isRecordingAudio) { toggleSpeechRecognition() }
              }}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-800 text-slate-400"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-6">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#00B4D8] font-bold">
                  Audio Bidireccional Activo
                </span>
                <h3 className="text-lg font-bold mt-1">Asistente de Cabina en Tiempo Real</h3>
                <p className="text-xs text-slate-400">Consulta protocolos mientras atiendes a tu paciente sin tocar la pantalla</p>
              </div>

              {/* Orbe Azul Cobalto y Cian */}
              <div className="py-6 flex justify-center items-center">
                <div className="relative flex items-center justify-center">
                  <div className="absolute h-36 w-36 rounded-full bg-[#0062D2]/20 animate-ping"></div>
                  <div className="absolute h-28 w-28 rounded-full bg-[#00B4D8]/30 animate-pulse"></div>
                  <button
                    onClick={toggleSpeechRecognition}
                    className="h-20 w-20 rounded-full bg-gradient-to-tr from-[#0052B4] via-[#0062D2] to-[#00B4D8] flex items-center justify-center shadow-lg shadow-[#0062D2]/50 cursor-pointer"
                  >
                    <Radio className="h-8 w-8 text-white animate-bounce" />
                  </button>
                </div>
              </div>

              <p className="text-xs font-medium text-slate-400 italic">
                {isRecordingAudio
                  ? 'Amyet está escuchando... Di tu consulta ahora.'
                  : '"Toca el orbe para hablar... Pregunta por cantidades, tiempos de exposición o incompatibilidad de activos."'}
              </p>

              {inputText && (
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-left">
                  <span className="text-[10px] text-slate-400 block mb-1">Has dicho:</span>
                  <span>{inputText}</span>
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={() => {
                        setShowVoiceOrb(false)
                        handleSendMessage()
                      }}
                      className="px-3 py-1 bg-[#0062D2] text-white rounded-lg text-xs font-semibold"
                    >
                      Enviar al Agente
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-center pt-2">
                <button
                  onClick={() => {
                    setShowVoiceOrb(false)
                    if (isRecordingAudio) { toggleSpeechRecognition() }
                  }}
                  className="px-6 py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30"
                >
                  Finalizar Sesión de Cabina
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: INGESTA DE ENLACE WEB / FICHA ONLINE               */}
      {/* ========================================================= */}
      {showUrlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`w-full max-w-md rounded-2xl p-6 border shadow-2xl ${
            darkMode ? 'bg-[#0B1325] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h3 className="text-xs font-bold flex items-center gap-2 text-[#0062D2]">
              <Globe className="h-4 w-4" /> Analizar Ficha Técnica o Artículo Web
            </h3>

            <input
              type="url"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              placeholder="https://denovapharmaceutical.es/producto-o-tratamiento"
              className={`w-full mt-3 px-3 py-2 rounded-xl text-xs outline-none border ${
                darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            />

            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowUrlModal(false)} className="px-3 py-1.5 text-xs text-slate-400">
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (urlInput.trim()) {
                    setAttachedFiles([...attachedFiles, { name: urlInput, type: 'url' }])
                    setUrlInput('')
                    setShowUrlModal(false)
                  }
                }}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-[#0062D2] text-white hover:bg-[#0052B4]"
              >
                Adjuntar Enlace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: AJUSTES DE CLÍNICA Y SERVIDOR                      */}
      {/* ========================================================= */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className={`relative w-full max-w-lg rounded-3xl p-6 border shadow-2xl ${
            darkMode ? 'bg-[#0A101E] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-inherit">
              <div className="flex items-center gap-2 text-[#0062D2]">
                <Settings className="h-5 w-5" />
                <h3 className="text-sm font-bold">Configuración de Clínica & Amyet IA</h3>
              </div>
              <button onClick={() => setShowSettings(false)} className="p-1 rounded-lg text-slate-400">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 mt-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-400">Nombre del Centro / Clínica</label>
                <input
                  type="text"
                  value={config.clinicName}
                  onChange={e => setConfig({ ...config, clinicName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border outline-none bg-transparent"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-400">Velocidad de Voz Asistente (TTS)</label>
                <div className="flex items-center justify-between">
                  <input
                    type="range"
                    min="0.8"
                    max="1.4"
                    step="0.1"
                    value={config.speechRate}
                    onChange={e => setConfig({ ...config, speechRate: parseFloat(e.target.value) })}
                    className="w-full accent-[#0062D2]"
                  />
                  <span className="ml-3 font-mono font-bold text-[#0062D2]">{config.speechRate}x</span>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-inherit">
                <span className="font-semibold text-slate-400 block">Herramientas MCP Activas en WordPress</span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px]">
                    <Package className="h-4 w-4 text-[#0062D2]" />
                    <span>MCP WooCommerce</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px]">
                    <Droplet className="h-4 w-4 text-[#00B4D8]" />
                    <span>MCP Vademécum</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-5 pt-3 border-t border-inherit">
              <button
                onClick={() => setShowSettings(false)}
                className="px-5 py-2 rounded-xl bg-[#0062D2] text-white text-xs font-bold hover:bg-[#0052B4]"
              >
                Guardar Parámetros
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
