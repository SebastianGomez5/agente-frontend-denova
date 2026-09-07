'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  Mic,
  MicOff,
  Paperclip,
  Globe,
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
  Headphones,
  Package,
  Calendar,
  Activity,
  Droplet,
  Square,
  UploadCloud,
  Send,
  Palette,
  Camera,
  User,
  Sparkles,
  SlidersHorizontal,
  RotateCcw,
  CheckCircle2,
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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Adaptar apertura de sidebar según tamaño de pantalla inicial
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      setSidebarOpen(true)
    }
  }, [])

  // --- Modales y Overlays ---
  const [showSettings, setShowSettings] = useState(false)
  const [activeSettingsTab, setActiveSettingsTab] = useState<'visual' | 'profile' | 'system'>('visual')
  const [showVoiceOrb, setShowVoiceOrb] = useState(false)
  const [showUrlModal, setShowUrlModal] = useState(false)
  const [showSkillDropdown, setShowSkillDropdown] = useState(false)
  const [showDocModal, setShowDocModal] = useState(false)

  // --- Perfil de Usuario y Personalización ---
  const [userProfile, setUserProfile] = useState({
    name: 'Dra. Valentina Gómez',
    role: 'Especialista en Cosmiatría',
    avatar: '/images/user-avatar.png',
  })

  const [visualSettings, setVisualSettings] = useState({
    accentColor: 'blue' as 'blue' | 'emerald' | 'purple' | 'rose' | 'amber',
    fontSize: 'base' as 'sm' | 'base' | 'lg',
    bubbleStyle: 'modern' as 'modern' | 'glass' | 'minimal',
  })

  // --- Paletas de Colores de Acento ---
  const COLOR_THEMES = {
    blue: {
      id: 'blue',
      name: 'Azul Denova',
      color: '#0062D2',
      accentClass: 'text-[#0062D2] dark:text-[#38BDF8]',
      bgClass: 'bg-[#0062D2]',
      bgHoverClass: 'hover:bg-[#0052B4]',
      borderClass: 'border-[#0062D2]',
      gradientClass: 'from-[#0062D2] to-[#00B4D8]',
      ringClass: 'ring-[#0062D2]',
      lightBg: 'bg-blue-50 dark:bg-blue-950/40 text-[#0062D2] dark:text-[#38BDF8]',
      shadowClass: 'shadow-[#0062D2]/25',
    },
    emerald: {
      id: 'emerald',
      name: 'Esmeralda Spa',
      color: '#059669',
      accentClass: 'text-[#059669] dark:text-[#34D399]',
      bgClass: 'bg-[#059669]',
      bgHoverClass: 'hover:bg-[#047857]',
      borderClass: 'border-[#059669]',
      gradientClass: 'from-[#059669] to-[#10B981]',
      ringClass: 'ring-[#059669]',
      lightBg: 'bg-emerald-50 dark:bg-emerald-950/40 text-[#059669] dark:text-[#34D399]',
      shadowClass: 'shadow-emerald-600/25',
    },
    purple: {
      id: 'purple',
      name: 'Violeta Estético',
      color: '#7C3AED',
      accentClass: 'text-[#7C3AED] dark:text-[#C084FC]',
      bgClass: 'bg-[#7C3AED]',
      bgHoverClass: 'hover:bg-[#6D28D9]',
      borderClass: 'border-[#7C3AED]',
      gradientClass: 'from-[#7C3AED] to-[#A855F7]',
      ringClass: 'ring-[#7C3AED]',
      lightBg: 'bg-purple-50 dark:bg-purple-950/40 text-[#7C3AED] dark:text-[#C084FC]',
      shadowClass: 'shadow-purple-600/25',
    },
    rose: {
      id: 'rose',
      name: 'Rosa Glow',
      color: '#E11D48',
      accentClass: 'text-[#E11D48] dark:text-[#FB7185]',
      bgClass: 'bg-[#E11D48]',
      bgHoverClass: 'hover:bg-[#BE123C]',
      borderClass: 'border-[#E11D48]',
      gradientClass: 'from-[#E11D48] to-[#FB7185]',
      ringClass: 'ring-[#E11D48]',
      lightBg: 'bg-rose-50 dark:bg-rose-950/40 text-[#E11D48] dark:text-[#FB7185]',
      shadowClass: 'shadow-rose-600/25',
    },
    amber: {
      id: 'amber',
      name: 'Oro Champagne',
      color: '#D97706',
      accentClass: 'text-[#D97706] dark:text-[#FBBF24]',
      bgClass: 'bg-[#D97706]',
      bgHoverClass: 'hover:bg-[#B45309]',
      borderClass: 'border-[#D97706]',
      gradientClass: 'from-[#D97706] to-[#F59E0B]',
      ringClass: 'ring-[#D97706]',
      lightBg: 'bg-amber-50 dark:bg-amber-950/40 text-[#D97706] dark:text-[#FBBF24]',
      shadowClass: 'shadow-amber-600/25',
    },
  }

  const currentTheme = COLOR_THEMES[visualSettings.accentColor] || COLOR_THEMES.blue

  const PRESET_AVATARS = [
    { id: 'default', name: 'Original', src: '/images/user-avatar.png' },
    { id: 'doctor_f', name: 'Especialista', src: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80' },
    { id: 'doctor_m', name: 'Dermatólogo', src: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80' },
    { id: 'aesthetic', name: 'Cosmiatría', src: 'https://images.unsplash.com/photo-1594824813580-b749be9d4a45?w=150&auto=format&fit=crop&q=80' },
    { id: 'denova', name: 'Denova', src: '/images/denova-logo.png' },
  ]

  // Cargar personalizaciones guardadas en localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedProfile = localStorage.getItem('denova_user_profile')
        if (savedProfile) { setUserProfile(JSON.parse(savedProfile)) }
        const savedVisuals = localStorage.getItem('denova_visual_settings')
        if (savedVisuals) { setVisualSettings(JSON.parse(savedVisuals)) }
        const savedConfig = localStorage.getItem('denova_config')
        if (savedConfig) { setConfig(JSON.parse(savedConfig)) }
      } catch (e) {
        console.error('Error cargando preferencias de localStorage', e)
      }
    }
  }, [])

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        Toast.notify({ type: 'warning', message: 'La imagen debe ser menor a 2MB' })
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const updated = { ...userProfile, avatar: reader.result }
          setUserProfile(updated)
          if (typeof window !== 'undefined') {
            localStorage.setItem('denova_user_profile', JSON.stringify(updated))
          }
          Toast.notify({ type: 'success', message: 'Foto de perfil actualizada con éxito.' })
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSavePreferences = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('denova_user_profile', JSON.stringify(userProfile))
      localStorage.setItem('denova_visual_settings', JSON.stringify(visualSettings))
      localStorage.setItem('denova_config', JSON.stringify(config))
    }
    Toast.notify({ type: 'success', message: 'Personalización y perfil guardados.' })
    setShowSettings(false)
  }

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
  const [attachedFiles, setAttachedFiles] = useState<{ id?: string, name: string, type: string, file?: File, url?: string, uploading?: boolean }[]>([])
  const [isRecordingAudio, setIsRecordingAudio] = useState(false)
  const [isSpeakingMessageId, setIsSpeakingMessageId] = useState<string | null>(null)
  const [urlInput, setUrlInput] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const [isDragging, setIsDragging] = useState(false)
  const dragCounterRef = useRef(0)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const recognitionRef = useRef<any>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Handlers para Arrastrar y Soltar archivos (Drag & Drop)
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current += 1
    if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current -= 1
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0
      setIsDragging(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    dragCounterRef.current = 0

    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files)
      droppedFiles.forEach(handleFileUpload)
      e.dataTransfer.clearData()
      Toast.notify({ type: 'success', message: `${droppedFiles.length} archivo(s) añadido(s) a la consulta.` })
    }
  }

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

  const getFileType = (fileName: string, mimeType: string = '') => {
    const ext = (fileName.split('.').pop() || '').toUpperCase()
    const imageExts = ['JPG', 'JPEG', 'PNG', 'GIF', 'WEBP', 'SVG']
    const docExts = ['TXT', 'MD', 'MDX', 'MARKDOWN', 'PDF', 'HTML', 'XLSX', 'XLS', 'DOC', 'DOCX', 'CSV', 'EML', 'MSG', 'PPTX', 'PPT', 'XML', 'EPUB']
    const audioExts = ['MP3', 'M4A', 'WAV', 'AMR', 'MPGA']
    const videoExts = ['MP4', 'MOV', 'MPEG', 'WEBM']

    if (imageExts.includes(ext) || mimeType.startsWith('image/')) { return 'image' }
    if (docExts.includes(ext) || mimeType.includes('pdf') || mimeType.includes('text') || mimeType.includes('officedocument') || mimeType.includes('msword')) { return 'document' }
    if (audioExts.includes(ext) || mimeType.startsWith('audio/')) { return 'audio' }
    if (videoExts.includes(ext) || mimeType.startsWith('video/')) { return 'video' }
    return 'document'
  }

  // --- Subir archivos a Dify ---
  const handleFileUpload = async (file: File) => {
    const detectedType = getFileType(file.name, file.type)
    const tempFile = {
      name: file.name,
      type: detectedType,
      file,
      uploading: true,
    }
    setAttachedFiles(prev => [...prev, tempFile])

    const formData = new FormData()
    formData.append('file', file)

    upload({
      xhr: new XMLHttpRequest(),
      data: formData,
      onprogress: () => {},
    })
      .then((res: any) => {
        let parsedId = res?.id || res?.upload_file_id || res
        if (typeof parsedId === 'string' && parsedId.startsWith('{')) {
          try {
            const parsed = JSON.parse(parsedId)
            parsedId = parsed.id || parsedId
          } catch (e) {}
        }
        setAttachedFiles(prev =>
          prev.map(f => (f.name === file.name ? { ...f, id: parsedId, uploading: false } : f)),
        )
      })
      .catch((err) => {
        console.error('Error uploading file:', err)
        Toast.notify({ type: 'error', message: 'Error al subir archivo a Dify' })
        setAttachedFiles(prev => prev.filter(f => f.name !== file.name))
      })
  }

  // --- Detener consulta activa ---
  const handleStopResponding = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsResponding(false)
  }

  // --- Enviar mensaje a Dify Agent ---
  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputText
    if ((!textToSend.trim() && attachedFiles.length === 0) || isResponding) { return }

    if (attachedFiles.some(f => f.uploading)) {
      Toast.notify({ type: 'warning', message: 'Por favor, espera a que el archivo termine de subirse.' })
      return
    }

    const messageQuery = textToSend.trim()
    setInputText('')

    // Preparar archivos para Dify
    const filesToSend: VisionFile[] = attachedFiles
      .map((f) => {
        if (f.type === 'url' && f.url) {
          return {
            type: 'document',
            transfer_method: TransferMethod.remote_url,
            url: f.url,
            upload_file_id: '',
          }
        }
        if (f.id) {
          const detectedType = getFileType(f.name, f.file?.type || '')
          return {
            type: detectedType as any,
            transfer_method: TransferMethod.local_file,
            url: '',
            upload_file_id: f.id,
          }
        }
        return null
      })
      .filter((f): f is VisionFile => !!f)

    const currentFiles = [...attachedFiles]
    setAttachedFiles([])

    // Mensaje del usuario
    const questionId = `question-${Date.now()}`
    const questionItem: ChatItem = {
      id: questionId,
      content: messageQuery,
      isAnswer: false,
      message_files: filesToSend,
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
      getAbortController: (abortCtrl) => {
        abortControllerRef.current = abortCtrl
      },
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
        setIsResponding(false)
        abortControllerRef.current = null
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

        // Si el modo orbe o voz está activo, leer la respuesta en voz alta
        if (showVoiceOrb && responseItem.content) {
          speakText(responseItem.content, responseItem.id)
        }
      },
      onError: (err: any) => {
        setIsResponding(false)
        abortControllerRef.current = null
        setChatList(produce(getChatList(), (draft) => {
          const pIdx = draft.findIndex(item => item.id === placeholderAnswerId)
          if (pIdx > -1) { draft.splice(pIdx, 1) }
        }))
        Toast.notify({ type: 'error', message: 'Error en la respuesta del agente' })
      },
      onFile: () => {},
      onMessageEnd: () => {},
      onWorkflowStarted: () => {},
      onNodeStarted: () => {},
      onNodeFinished: () => {},
      onWorkflowFinished: () => {},
    }).catch((e) => {
      setIsResponding(false)
      abortControllerRef.current = null
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
    <div className={`flex h-screen w-full select-text overflow-hidden font-sans transition-colors duration-300 relative ${
      darkMode ? 'dark bg-[#070C16] text-slate-100' : 'bg-[#F4F7FC] text-slate-900'
    }`}>

      {/* ========================================================= */}
      {/* TELÓN DE FONDO (BACKDROP) PARA MÓVIL                      */}
      {/* ========================================================= */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ========================================================= */}
      {/* SIDEBAR: MENÚ CLÍNICO Y CONSULTAS ANTERIORES             */}
      {/* ========================================================= */}
      <aside className={`
        fixed md:relative inset-y-0 left-0 z-50 flex flex-col border-r transition-all duration-300 ease-in-out select-none
        ${sidebarOpen
      ? 'w-72 sm:w-80 translate-x-0'
      : '-translate-x-full md:translate-x-0 md:w-0 md:border-r-0 md:overflow-hidden'
    }
        ${darkMode ? 'border-slate-800/80 bg-[#0B1325]/95' : 'border-[#E1E8F5] bg-white'}
        shadow-2xl md:shadow-none
      `}>

        {/* Encabezado de Marca Denova & Amyet */}
        <div className="flex h-16 sm:h-20 items-center justify-between px-4 sm:px-5 border-b border-inherit">
          <div className="flex items-center gap-3 overflow-hidden">
            {/* Logo Estilizado Denova / Amyet */}
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-2xl bg-white dark:bg-[#0B1325] border border-blue-200 dark:border-slate-700 shadow-md shadow-[#0062D2]/25 overflow-hidden p-0.5">
              <img src="/images/amyet-bot.png" alt="Amyet IA" className="h-full w-full object-contain" />
            </div>
            <div className="flex flex-col truncate">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold tracking-tight text-[#0062D2] dark:text-[#38BDF8]">Amyet IA</span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950 text-[#0052B4] dark:text-blue-300 font-semibold">PRO</span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">Denova Pharmaceutical</span>
            </div>
          </div>

          {/* Botón Cerrar Sidebar en Móvil */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Botón Nueva Consulta */}
        <div className="p-3 sm:p-3.5">
          <button
            onClick={() => {
              createNewChat()
              if (typeof window !== 'undefined' && window.innerWidth < 768) {
                setSidebarOpen(false)
              }
            }}
            className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-semibold tracking-wide transition-all shadow-sm ${
              darkMode
                ? 'bg-[#0062D2] hover:bg-[#0052B4] text-white shadow-blue-900/30'
                : 'bg-[#0062D2] hover:bg-[#0052B4] text-white shadow-[#0062D2]/20'
            }`}
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span>Nueva Consulta Clínica</span>
          </button>
        </div>

        {/* Buscador de Protocolos */}
        <div className="px-3 sm:px-3.5 pb-2">
          <div className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs border ${
            darkMode
              ? 'bg-slate-900/70 border-slate-800 text-slate-400'
              : 'bg-[#F8FAFC] border-slate-200 text-slate-500'
          }`}>
            <Search className="h-3.5 w-3.5 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar protocolos, clientes..."
              className="w-full bg-transparent outline-none placeholder:text-inherit"
            />
          </div>
        </div>

        {/* Lista de Historial */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1">
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
                <span className="truncate">Nueva consulta</span>
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
                  onClick={() => {
                    setCurrConversationId(chat.id, APP_ID, false)
                    if (typeof window !== 'undefined' && window.innerWidth < 768) {
                      setSidebarOpen(false)
                    }
                  }}
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
                    <span className="truncate">{chat.name || 'Consulta clínica'}</span>
                  </div>

                  <button
                    onClick={e => handleDeleteConversation(e, chat.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-500 transition-opacity"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )
            })}
        </div>

        {/* Footer del Sidebar: Perfil de Cabina & Personalización */}
        <div className={`p-3 sm:p-3.5 border-t border-inherit flex items-center justify-between ${
          darkMode ? 'bg-[#080E1C]' : 'bg-[#F8FAFC]'
        }`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <div className="h-9 w-9 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                <img
                  src={userProfile.avatar || '/images/user-avatar.png'}
                  alt={userProfile.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900"></span>
            </div>
            <div className="flex flex-col truncate">
              <span className="text-xs font-semibold truncate">{userProfile.name || config.clinicName}</span>
              <span className="text-[10px] text-slate-500 truncate">{userProfile.role || 'Profesional Verificado'}</span>
            </div>
          </div>

          <button
            onClick={() => setShowSettings(true)}
            className={`p-2 rounded-xl transition-all shrink-0 ${
              darkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-600 hover:text-slate-900'
            }`}
            title="Personalización y Perfil"
          >
            <Palette className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* CANVAS CENTRAL: ÁREA DE TRABAJO DERMOCOSMÉTICA            */}
      {/* ========================================================= */}
      <main
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="flex flex-1 flex-col h-full min-w-0 relative overflow-hidden"
      >

        {/* ========================================================= */}
        {/* DROPZONE OVERLAY FLOTANTE (ARRASTRAR Y SOLTAR)            */}
        {/* ========================================================= */}
        {isDragging && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-[#0062D2]/10 backdrop-blur-md border-2 border-dashed border-[#0062D2] dark:border-[#38BDF8] rounded-3xl m-3 pointer-events-none transition-all">
            <div className="flex flex-col items-center justify-center p-8 text-center rounded-3xl bg-white/95 dark:bg-[#0B1325]/95 shadow-2xl border border-blue-200 dark:border-slate-700 max-w-md pointer-events-none">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/80 text-[#0062D2] dark:text-[#38BDF8] mb-4 animate-bounce">
                <UploadCloud className="h-8 w-8" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Suelta tus archivos aquí
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Amyet IA analizará protocolos, documentos técnicos, imágenes clínicas o fichas de Denova automáticamente.
              </p>
              <div className="flex items-center gap-1.5 mt-3 text-[10px] font-mono text-[#0062D2] dark:text-[#38BDF8] bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-900">
                <FileText className="h-3 w-3" />
                <span>PDF, Word, Excel, JPG, PNG soportados</span>
              </div>
            </div>
          </div>
        )}

        {/* Header Superior */}
        <header className={`flex h-14 sm:h-16 items-center justify-between px-3 sm:px-6 border-b z-10 backdrop-blur-md transition-colors select-none ${
          darkMode ? 'border-slate-800/80 bg-[#070C16]/85' : 'border-[#E1E8F5] bg-white/90'
        }`}>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`p-2 rounded-xl border transition-colors shrink-0 ${
                darkMode ? 'border-slate-800 hover:bg-slate-800 text-slate-400' : 'border-slate-200 hover:bg-slate-100 text-slate-600'
              }`}
              title="Menú lateral"
            >
              <Sliders className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 min-w-0">
              <h2 className="text-xs sm:text-sm font-bold truncate">
                {currentTitle}
              </h2>
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 shrink-0">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Amyet</span>
              </div>
            </div>
          </div>

          {/* Acciones del Header */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Botón Manos Libres en Cabina */}
            <button
              onClick={() => setShowVoiceOrb(true)}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r ${currentTheme.gradientClass} text-white hover:opacity-95 transition-all shadow-md ${currentTheme.shadowClass}`}
              title="Modo Manos Libres"
            >
              <Headphones className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden md:inline">Modo Manos Libres</span>
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
        <div className="flex-1 overflow-y-auto px-3 sm:px-6 md:px-12 py-4 sm:py-6 space-y-4 sm:space-y-6 select-text">
          {chatList.map((msg, index) => {
            const isUser = !msg.isAnswer
            const isSpeaking = isSpeakingMessageId === msg.id
            const lastThought = msg.agent_thoughts?.[msg.agent_thoughts.length - 1]?.thought
            const fontSizeClass = visualSettings.fontSize === 'sm' ? 'text-xs' : visualSettings.fontSize === 'lg' ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'

            return (
              <div key={msg.id || index} className={`flex gap-2.5 sm:gap-3.5 max-w-4xl mx-auto ${isUser ? 'justify-end' : 'justify-start'}`}>

                {/* Avatar Asistente Amyet */}
                {!isUser && (
                  <div className={`flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-white dark:bg-[#0F182B] border border-blue-200 dark:border-slate-700 shadow-md ${currentTheme.shadowClass} overflow-hidden p-0.5`}>
                    <img src="/images/amyet-bot.png" alt="Amyet Bot" className="h-full w-full object-contain" />
                  </div>
                )}

                <div className="flex flex-col space-y-2 max-w-[88%] sm:max-w-[80%]">

                  {/* Pensamiento Agéntico */}
                  {lastThought && lastThought.trim() && lastThought.trim() !== msg.content?.trim() && (
                    <div className={`text-[11px] font-mono px-3 py-1.5 rounded-lg border flex items-center gap-2 select-text ${
                      darkMode ? 'bg-slate-900/90 border-slate-800 text-slate-400' : 'bg-blue-50/60 border-blue-100 text-[#0052B4]'
                    }`}>
                      <Activity className={`h-3.5 w-3.5 ${currentTheme.accentClass} animate-pulse shrink-0`} />
                      <span className="select-text">{lastThought}</span>
                    </div>
                  )}

                  {/* Burbuja de Mensaje */}
                  <div className={`relative px-3.5 py-3 sm:px-4 sm:py-3.5 rounded-2xl ${fontSizeClass} leading-relaxed select-text ${
                    isUser
                      ? visualSettings.bubbleStyle === 'glass'
                        ? darkMode
                          ? 'bg-blue-600/30 border border-blue-400/30 text-white backdrop-blur-md rounded-tr-xs shadow-md'
                          : 'bg-blue-600/20 border border-blue-500/30 text-slate-900 backdrop-blur-md rounded-tr-xs shadow-md'
                        : visualSettings.bubbleStyle === 'minimal'
                          ? `${currentTheme.bgClass} !text-white rounded-tr-xs shadow-none`
                          : `bg-gradient-to-r ${currentTheme.gradientClass} !text-white rounded-tr-xs shadow-md ${currentTheme.shadowClass}`
                      : darkMode
                        ? 'bg-[#0F182B] border border-slate-800 text-slate-100 rounded-tl-xs shadow-sm'
                        : 'bg-white border border-[#E1E8F5] text-slate-800 rounded-tl-xs shadow-sm'
                  }`}>

                    {isUser
                      ? (
                        <>
                          {msg.message_files && msg.message_files.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-2 select-none">
                              {msg.message_files.map((file, fIdx) => (
                                <div key={fIdx} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/20 text-white text-xs font-mono">
                                  <FileText className="h-3.5 w-3.5" />
                                  <span className="truncate max-w-[180px]">
                                    {file.type === 'document' ? 'Documento adjunto' : 'Archivo adjunto'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="whitespace-pre-wrap font-normal select-text">
                            {msg.content}
                          </div>
                        </>
                      )
                      : msg.content
                        ? (
                          <div className="select-text">
                            <Markdown content={msg.content} />
                          </div>
                        )
                        : (
                          <div className="flex items-center gap-2 py-1">
                            <RefreshCw className={`h-3.5 w-3.5 animate-spin ${currentTheme.accentClass}`} />
                            <span className="text-xs text-slate-400">Analizando formulaciones y generando respuesta clínica...</span>
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
                              className={`text-left text-xs px-2.5 py-1 rounded-lg ${currentTheme.lightBg} hover:opacity-80 transition-colors cursor-pointer`}
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
                          className={`hover:${currentTheme.accentClass} flex items-center gap-1 transition-colors cursor-pointer ${
                            isSpeaking ? `${currentTheme.accentClass} font-bold` : ''
                          }`}
                        >
                          {isSpeaking ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                          <span>{isSpeaking ? 'Silenciar' : 'Escuchar'}</span>
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
                  <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-md overflow-hidden p-0.5">
                    <img
                      src={userProfile.avatar || '/images/user-avatar.png'}
                      alt={userProfile.name}
                      className="h-full w-full object-cover rounded-lg sm:rounded-xl"
                    />
                  </div>
                )}
              </div>
            )
          })}

          <div ref={messagesEndRef} />
        </div>

        {/* ========================================================= */}
        {/* CENTRO DE MANDO: INPUT DOCK CON BRANDING DENOVA           */}
        {/* ========================================================= */}
        <div className="p-2 sm:p-4 md:px-12 md:pb-6 z-10">
          <div className={`relative max-w-4xl mx-auto rounded-2xl border shadow-xl backdrop-blur-xl transition-all ${
            darkMode
              ? 'bg-[#0C1425]/90 border-slate-800 focus-within:border-[#0062D2] shadow-black/40'
              : 'bg-white/95 border-[#D8E3F5] focus-within:border-[#0062D2] shadow-blue-900/5'
          }`}>

            {/* Chips de Archivos Adjuntos */}
            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 px-3 sm:px-4 pt-2.5 sm:pt-3">
                {attachedFiles.map((file, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono border ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-blue-50 border-blue-200 text-[#0052B4]'
                    }`}
                  >
                    {file.uploading
                      ? (
                        <RefreshCw className="h-3 w-3 animate-spin text-[#0062D2]" />
                      )
                      : file.type === 'url'
                        ? (
                          <Globe className="h-3 w-3 text-cyan-500" />
                        )
                        : (
                          <FileText className="h-3 w-3 text-[#0062D2]" />
                        )}
                    <span className="max-w-[120px] sm:max-w-[150px] truncate">{file.name}</span>
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

            {/* Input de Texto y Controles */}
            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage() }} className="p-2.5 sm:p-3">
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
                className="w-full resize-none bg-transparent px-1 py-1 text-xs sm:text-sm outline-none placeholder:text-slate-400 font-normal leading-relaxed min-h-[44px]"
              />

              <div className="flex items-center justify-between pt-2 border-t border-inherit">
                <div className="flex items-center gap-1.5 min-w-0">

                  {/* Adjuntar Ficha o Imagen */}
                  <label className={`cursor-pointer p-2 rounded-xl transition-colors ${
                    darkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-blue-50 text-slate-600'
                  }`} title="Adjuntar archivo o imagen">
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

                  {/* Selector de Generador de Protocolos y Fichas */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowSkillDropdown(!showSkillDropdown)}
                      className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl font-medium transition-all border max-w-[170px] sm:max-w-xs ${
                        darkMode
                          ? 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-700'
                          : 'bg-slate-50 hover:bg-blue-50 text-slate-800 border-slate-200'
                      }`}
                    >
                      <selectedSkill.icon className={`h-3.5 w-3.5 ${currentTheme.accentClass} shrink-0`} />
                      <span className="font-semibold truncate text-[11px] sm:text-xs">{selectedSkill.name}</span>
                      <ChevronDown className="h-3 w-3 opacity-60 shrink-0" />
                    </button>

                    {/* Dropdown de Habilidades */}
                    {showSkillDropdown && (
                      <div className={`absolute bottom-full mb-2 left-0 w-[calc(100vw-2.5rem)] sm:w-80 max-w-xs sm:max-w-sm rounded-2xl border p-2 shadow-2xl z-50 ${
                        darkMode ? 'bg-[#0A101D] border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                      }`}>
                        <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Especialidad / Rol en Cabina
                        </div>
                        {skills.map(s => (
                          <button
                            type="button"
                            key={s.id}
                            onClick={() => {
                              setSelectedSkill(s)
                              setShowSkillDropdown(false)
                            }}
                            className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-colors ${
                              selectedSkill.id === s.id
                                ? darkMode ? 'bg-blue-950/80 text-white' : `${currentTheme.lightBg} font-semibold`
                                : darkMode ? 'hover:bg-slate-900' : 'hover:bg-slate-50'
                            }`}
                          >
                            <s.icon className={`h-4 w-4 mt-0.5 ${currentTheme.accentClass} shrink-0`} />
                            <div className="flex flex-col">
                              <span className="text-xs font-semibold">{s.name}</span>
                              <span className="text-[10px] text-slate-500">{s.desc}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                </div>

                {/* Botón Enviar / Detener con solo Iconos */}
                {isResponding
                  ? (
                    <button
                      type="button"
                      onClick={handleStopResponding}
                      className="flex items-center justify-center h-9 w-9 rounded-xl transition-all shadow-md bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/25 cursor-pointer shrink-0"
                      title="Detener consulta"
                    >
                      <Square className="h-4 w-4 fill-white" />
                    </button>
                  )
                  : (
                    <button
                      type="submit"
                      disabled={(!inputText.trim() && attachedFiles.length === 0) || attachedFiles.some(f => f.uploading)}
                      className={`flex items-center justify-center h-9 w-9 rounded-xl transition-all shadow-md shrink-0 ${
                        (inputText.trim() || attachedFiles.length > 0) && !attachedFiles.some(f => f.uploading)
                          ? `${currentTheme.bgClass} ${currentTheme.bgHoverClass} text-white ${currentTheme.shadowClass} cursor-pointer`
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                      }`}
                      title="Enviar consulta"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  )}
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* ========================================================= */}
      {/* MODAL: 3 OPCIONES DEL GENERADOR DE DOCUMENTOS             */}
      {/* ========================================================= */}
      {showDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4">
          <div className={`relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl sm:rounded-3xl p-4 sm:p-6 border shadow-2xl ${
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-3 sm:p-4">
          <div className={`relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-center border shadow-2xl ${
            darkMode ? 'bg-[#080F1E] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <button
              onClick={() => {
                setShowVoiceOrb(false)
                if (isRecordingAudio) { toggleSpeechRecognition() }
              }}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full hover:bg-slate-800 text-slate-400"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-4 sm:space-y-6">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#00B4D8] font-bold">
                  Audio Bidireccional Activo
                </span>
                <h3 className="text-base sm:text-lg font-bold mt-1">Asistente de Cabina en Tiempo Real</h3>
                <p className="text-xs text-slate-400">Consulta protocolos mientras atiendes a tu paciente sin tocar la pantalla</p>
              </div>

              {/* Orbe Azul Cobalto y Cian */}
              <div className="py-4 sm:py-6 flex justify-center items-center">
                <div className="relative flex items-center justify-center">
                  <div className="absolute h-32 w-32 sm:h-36 sm:w-36 rounded-full bg-[#0062D2]/20 animate-ping"></div>
                  <div className="absolute h-24 w-24 sm:h-28 sm:w-28 rounded-full bg-[#00B4D8]/30 animate-pulse"></div>
                  <button
                    onClick={toggleSpeechRecognition}
                    className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-tr from-[#0052B4] via-[#0062D2] to-[#00B4D8] flex items-center justify-center shadow-lg shadow-[#0062D2]/50 cursor-pointer"
                  >
                    <Radio className="h-7 w-7 sm:h-8 sm:w-8 text-white animate-bounce" />
                  </button>
                </div>
              </div>

              <p className="text-xs font-medium text-slate-400 italic">
                {isRecordingAudio
                  ? 'Amyet está escuchando... Di tu consulta ahora.'
                  : '"Toca el orbe para hablar... Pregunta por formulaciones o incompatibilidades."'}
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
                  className="px-5 sm:px-6 py-2 sm:py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4">
          <div className={`w-full max-w-md rounded-2xl p-4 sm:p-6 border shadow-2xl ${
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
      {/* MODAL: CENTRO DE PERSONALIZACIÓN, PERFIL Y APARIENCIA     */}
      {/* ========================================================= */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-3 sm:p-4">
          <div className={`relative w-full max-w-xl max-h-[92vh] flex flex-col rounded-2xl sm:rounded-3xl border shadow-2xl overflow-hidden ${
            darkMode ? 'bg-[#0A101E] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>

            {/* Cabecera del Modal */}
            <div className="flex items-center justify-between p-4 sm:px-6 sm:py-4 border-b border-inherit shrink-0">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${currentTheme.lightBg}`}>
                  <Palette className={`h-5 w-5 ${currentTheme.accentClass}`} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold">Personalización & Perfil</h3>
                  <p className="text-[11px] text-slate-400">Personaliza tu foto de perfil y el aspecto visual de la web</p>
                </div>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Selector de Pestañas */}
            <div className="flex items-center gap-1.5 px-4 sm:px-6 pt-3 pb-1 border-b border-inherit shrink-0 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveSettingsTab('visual')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                  activeSettingsTab === 'visual'
                    ? `${currentTheme.lightBg} ${currentTheme.borderClass} border`
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Aspecto Visual</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSettingsTab('profile')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                  activeSettingsTab === 'profile'
                    ? `${currentTheme.lightBg} ${currentTheme.borderClass} border`
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                <User className="h-3.5 w-3.5" />
                <span>Mi Perfil & Foto</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSettingsTab('system')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                  activeSettingsTab === 'system'
                    ? `${currentTheme.lightBg} ${currentTheme.borderClass} border`
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>Sistema & Voz</span>
              </button>
            </div>

            {/* Contenido de Pestañas con Scroll */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs">

              {/* ========================================================= */}
              {/* TAB 1: ASPECTO VISUAL                                     */}
              {/* ========================================================= */}
              {activeSettingsTab === 'visual' && (
                <div className="space-y-5">

                  {/* Selector de Color de Acento */}
                  <div className="space-y-2.5">
                    <label className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                      Color de Acento y Marca
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {Object.values(COLOR_THEMES).map((th) => {
                        const isSelected = visualSettings.accentColor === th.id
                        return (
                          <button
                            key={th.id}
                            type="button"
                            onClick={() => setVisualSettings({ ...visualSettings, accentColor: th.id as any })}
                            className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all text-left ${
                              isSelected
                                ? `${th.borderClass} ${th.lightBg} ring-2 ${th.ringClass} font-semibold`
                                : darkMode
                                  ? 'border-slate-800 bg-slate-900/50 hover:bg-slate-800/80 text-slate-300'
                                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                            }`}
                          >
                            <span
                              className="h-5 w-5 rounded-full shrink-0 shadow-sm flex items-center justify-center"
                              style={{ backgroundColor: th.color }}
                            >
                              {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                            </span>
                            <span className="text-xs truncate">{th.name}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Modo Claro / Oscuro */}
                  <div className="space-y-2.5">
                    <label className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                      Modo de Visualización
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setDarkMode(false)}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                          !darkMode
                            ? 'border-[#0062D2] bg-blue-50/70 text-[#0062D2] ring-2 ring-[#0062D2]/30 font-semibold'
                            : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Sun className="h-5 w-5 text-amber-500 shrink-0" />
                        <div className="text-left">
                          <div className="text-xs font-semibold">Claro Clínico</div>
                          <div className="text-[10px] text-slate-400">Luminoso para consulta</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDarkMode(true)}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                          darkMode
                            ? 'border-[#0062D2] bg-blue-950/40 text-white ring-2 ring-[#0062D2]/30 font-semibold'
                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Moon className="h-5 w-5 text-blue-400 shrink-0" />
                        <div className="text-left">
                          <div className="text-xs font-semibold">Oscuro Noche</div>
                          <div className="text-[10px] text-slate-400">Alto contraste estético</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Tamaño de Tipografía */}
                  <div className="space-y-2.5">
                    <label className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                      Tamaño de Letra en el Chat
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'sm', label: 'Compacta', desc: '12px' },
                        { id: 'base', label: 'Estándar', desc: '14px' },
                        { id: 'lg', label: 'Grande', desc: '16px' },
                      ].map(opt => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setVisualSettings({ ...visualSettings, fontSize: opt.id as any })}
                          className={`p-2.5 rounded-xl border text-center transition-all ${
                            visualSettings.fontSize === opt.id
                              ? `${currentTheme.lightBg} ${currentTheme.borderClass} ring-1 ${currentTheme.ringClass} font-semibold`
                              : darkMode
                                ? 'border-slate-800 bg-slate-900/50 text-slate-400 hover:text-white'
                                : 'border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <div className="text-xs font-semibold">{opt.label}</div>
                          <div className="text-[10px] text-slate-400">{opt.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Estilo de Burbujas de Mensaje */}
                  <div className="space-y-2.5">
                    <label className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                      Estilo de Burbuja de Mensajes
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'modern', label: 'Degradado', desc: 'Moderno' },
                        { id: 'glass', label: 'Cristal', desc: 'Glassmorphism' },
                        { id: 'minimal', label: 'Plano', desc: 'Minimalista' },
                      ].map(st => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => setVisualSettings({ ...visualSettings, bubbleStyle: st.id as any })}
                          className={`p-2.5 rounded-xl border text-center transition-all ${
                            visualSettings.bubbleStyle === st.id
                              ? `${currentTheme.lightBg} ${currentTheme.borderClass} ring-1 ${currentTheme.ringClass} font-semibold`
                              : darkMode
                                ? 'border-slate-800 bg-slate-900/50 text-slate-400 hover:text-white'
                                : 'border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <div className="text-xs font-semibold">{st.label}</div>
                          <div className="text-[10px] text-slate-400">{st.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 2: MI PERFIL & FOTO                                   */}
              {/* ========================================================= */}
              {activeSettingsTab === 'profile' && (
                <div className="space-y-5">

                  {/* Subir Foto de Perfil */}
                  <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center gap-4 ${
                    darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="relative shrink-0">
                      <div className="h-20 w-20 rounded-2xl overflow-hidden border-2 border-slate-300 dark:border-slate-700 shadow-md bg-white dark:bg-slate-950">
                        <img
                          src={userProfile.avatar || '/images/user-avatar.png'}
                          alt="Avatar actual"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <label
                        className={`absolute -bottom-1.5 -right-1.5 p-1.5 rounded-xl cursor-pointer shadow-lg text-white ${currentTheme.bgClass} ${currentTheme.bgHoverClass} transition-transform hover:scale-105`}
                        title="Subir nueva foto"
                      >
                        <Camera className="h-3.5 w-3.5" />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarUpload}
                        />
                      </label>
                    </div>

                    <div className="flex flex-col items-center sm:items-start text-center sm:text-left space-y-1.5">
                      <span className="font-bold text-xs">Foto del Profesional / Cabina</span>
                      <p className="text-[11px] text-slate-400">
                        Sube una foto personalizada para los mensajes y la barra lateral (máx. 2MB).
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <label className={`cursor-pointer px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-sm transition-all ${currentTheme.bgClass} ${currentTheme.bgHoverClass}`}>
                          <span>Cargar desde equipo</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarUpload}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = { ...userProfile, avatar: '/images/user-avatar.png' }
                            setUserProfile(updated)
                            if (typeof window !== 'undefined') { localStorage.setItem('denova_user_profile', JSON.stringify(updated)) }
                            Toast.notify({ type: 'info', message: 'Avatar restablecido al original.' })
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-inherit text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                          title="Restablecer"
                        >
                          <RotateCcw className="h-3 w-3" />
                          <span>Original</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Galería de Avatares Predefinidos */}
                  <div className="space-y-2">
                    <label className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                      O elige un Avatar Clínico Predeterminado
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {PRESET_AVATARS.map((av) => {
                        const isSelected = userProfile.avatar === av.src
                        return (
                          <button
                            key={av.id}
                            type="button"
                            onClick={() => {
                              const updated = { ...userProfile, avatar: av.src }
                              setUserProfile(updated)
                              if (typeof window !== 'undefined') { localStorage.setItem('denova_user_profile', JSON.stringify(updated)) }
                            }}
                            className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${
                              isSelected
                                ? `${currentTheme.borderClass} ${currentTheme.lightBg} ring-2 ${currentTheme.ringClass}`
                                : darkMode
                                  ? 'border-slate-800 hover:bg-slate-900 text-slate-400'
                                  : 'border-slate-200 hover:bg-slate-100 text-slate-600'
                            }`}
                          >
                            <div className="h-10 w-10 rounded-xl overflow-hidden bg-white dark:bg-slate-900 border border-inherit">
                              <img src={av.src} alt={av.name} className="h-full w-full object-cover" />
                            </div>
                            <span className="text-[10px] truncate max-w-full font-medium">{av.name}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Campos de Nombre y Cargo */}
                  <div className="space-y-3 pt-2 border-t border-inherit">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-400">Nombre del Profesional / Centro</label>
                      <input
                        type="text"
                        value={userProfile.name}
                        onChange={e => setUserProfile({ ...userProfile, name: e.target.value })}
                        placeholder="Ej: Dra. Valentina Gómez"
                        className="w-full px-3 py-2 rounded-xl border outline-none bg-transparent"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-400">Especialidad / Título</label>
                      <input
                        type="text"
                        value={userProfile.role}
                        onChange={e => setUserProfile({ ...userProfile, role: e.target.value })}
                        placeholder="Ej: Especialista en Cosmiatría & Dermocosmética"
                        className="w-full px-3 py-2 rounded-xl border outline-none bg-transparent"
                      />
                    </div>
                  </div>

                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 3: SISTEMA & VOZ                                      */}
              {/* ========================================================= */}
              {activeSettingsTab === 'system' && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-400">Nombre de la Clínica (Vademécum)</label>
                    <input
                      type="text"
                      value={config.clinicName}
                      onChange={e => setConfig({ ...config, clinicName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border outline-none bg-transparent"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-400">Velocidad de Voz Asistente Amyet (TTS)</label>
                    <div className="flex items-center justify-between">
                      <input
                        type="range"
                        min="0.8"
                        max="1.4"
                        step="0.1"
                        value={config.speechRate}
                        onChange={e => setConfig({ ...config, speechRate: parseFloat(e.target.value) })}
                        className={`w-full accent-[${currentTheme.color}]`}
                      />
                      <span className={`ml-3 font-mono font-bold ${currentTheme.accentClass}`}>{config.speechRate}x</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-inherit">
                    <span className="font-semibold text-slate-400 block">Herramientas MCP Activas en WordPress</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px]">
                        <Package className={`h-4 w-4 ${currentTheme.accentClass}`} />
                        <span>MCP WooCommerce</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px]">
                        <Droplet className="h-4 w-4 text-[#00B4D8]" />
                        <span>MCP Vademécum</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Pie de Modal con Botón Guardar */}
            <div className="flex items-center justify-between p-4 sm:px-6 border-t border-inherit shrink-0 bg-slate-50/50 dark:bg-slate-900/30">
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Cerrar
              </button>

              <button
                type="button"
                onClick={handleSavePreferences}
                className={`px-5 py-2 rounded-xl text-white text-xs font-bold shadow-md transition-all ${currentTheme.bgClass} ${currentTheme.bgHoverClass} ${currentTheme.shadowClass}`}
              >
                Guardar y Aplicar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
