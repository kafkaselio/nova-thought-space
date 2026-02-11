
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, Search, ChevronLeft, Save, Trash2, CheckCircle, Sparkles, X, Camera, Globe, 
  Github, Twitter, Linkedin, Link as LinkIcon, ListTodo, Bell, Image as ImageIcon,
  Play, Pause, RotateCcw, Settings as SettingsIcon, History, Tag, Clock, Loader2, ExternalLink, Check, Download, GripVertical,
  Calendar as CalendarIcon, List as ListIcon, ChevronRight, Menu, Archive, Trash, Pin, LayoutGrid, Settings, Cloud, CloudOff, RefreshCw, LogOut, Timer,
  Flag
} from 'lucide-react';
import { Priority, ViewType, Note, Bucket, UserProfile, SubTask, PomoHistoryItem, PomoSettings, GoogleAccount } from './types';
import { INITIAL_BUCKETS, INITIAL_NOTES, PRIORITY_COLORS, PRIORITY_TEXT_COLORS } from './constants';
import BottomNav from './components/BottomNav';
import NoteCard from './components/NoteCard';
import BucketCard from './components/BucketCard';
import { getSmartSuggestions } from './services/geminiService';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
import JSZip from 'jszip';

const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[100] bg-zinc-950 flex flex-col items-center justify-center animate-in fade-in duration-700">
      <div className="relative">
        <svg width="120" height="120" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_0_15px_rgba(129,140,248,0.3)]">
          <path 
            d="M25 75V25L75 75V25" 
            stroke="white" 
            strokeWidth="8" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="animate-[draw_2s_ease-in-out_infinite_alternate]"
            style={{
              strokeDasharray: 200,
              strokeDashoffset: 200,
            }}
          />
          <path 
            d="M25 75V25L75 75V25" 
            stroke="url(#indigo-grad)" 
            strokeWidth="8" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="animate-[draw_2s_ease-in-out_infinite_alternate_reverse]"
            style={{
              strokeDasharray: 200,
              strokeDashoffset: 200,
            }}
          />
          <defs>
            <linearGradient id="indigo-grad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
              <stop stopColor="#818cf8" />
              <stop offset="1" stopColor="#6366f1" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 bg-indigo-500/20 blur-[60px] rounded-full scale-150 animate-pulse" />
      </div>
      <div className="mt-12 space-y-2 text-center">
        <h2 className="text-white text-xs font-black uppercase tracking-[0.4em] translate-x-[0.2em] opacity-80 animate-pulse">Nova Thought Space</h2>
        <div className="w-48 h-[1px] bg-zinc-900 mx-auto relative overflow-hidden">
          <div className="absolute inset-0 bg-indigo-500 w-1/3 animate-[loading_1.5s_infinite_linear]" />
        </div>
      </div>
      <style>{`
        @keyframes draw { to { stroke-dashoffset: 0; } }
        @keyframes loading { 0% { transform: translateX(-100%); } 100% { transform: translateX(300%); } }
      `}</style>
    </div>
  );
};

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [notes, setNotes] = useState<Note[]>(INITIAL_NOTES);
  const [buckets, setBuckets] = useState<Bucket[]>(INITIAL_BUCKETS);
  const [activeView, setActiveView] = useState<ViewType>('notes');
  const [timelineMode, setTimelineMode] = useState<'list' | 'calendar'>('list');
  const [editingNote, setEditingNote] = useState<Partial<Note> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'All'>('All');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedBucketId, setSelectedBucketId] = useState<string | null>(null);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(new Date());
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const [inlineInputMode, setInlineInputMode] = useState<'subtask' | 'link' | 'social' | 'bucket' | null>(null);
  const [tempInputValue, setTempInputValue] = useState('');

  // Drag and Drop State
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);
  const lastDragTargetId = useRef<string | null>(null);

  // Timer States
  const [focusTab, setFocusTab] = useState<'pomodoro' | 'stopwatch'>('pomodoro');
  const [pomoSettings, setPomoSettings] = useState<PomoSettings>({ work: 25, short: 5, long: 15 });
  const [pomoSeconds, setPomoSeconds] = useState(25 * 60);
  const [isPomoRunning, setIsPomoRunning] = useState(false);
  const [pomoMode, setPomoMode] = useState<'work' | 'short' | 'long'>('work');
  const [pomoHistory, setPomoHistory] = useState<PomoHistoryItem[]>([]);
  const [isPomoSettingsOpen, setIsPomoSettingsOpen] = useState(false);
  const [currentSessionLabel, setCurrentSessionLabel] = useState('');

  // Stopwatch States
  const [swSeconds, setSwSeconds] = useState(0);
  const [isSwRunning, setIsSwRunning] = useState(false);
  const [swLaps, setSwLaps] = useState<number[]>([]);

  const [profile, setProfile] = useState<UserProfile>({
    name: 'Jane Doe',
    bio: 'Visionary Mindset',
    avatarUrl: null,
    socials: []
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const taskImageInputRef = useRef<HTMLInputElement>(null);
  const inlineInputRef = useRef<HTMLInputElement>(null);
  const touchStartX = useRef<number | null>(null);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  // Google Login Initialization
  useEffect(() => {
    const initGoogle = () => {
      if ((window as any).google) {
        (window as any).google.accounts.id.initialize({
          client_id: "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com", 
          callback: handleGoogleResponse,
        });
        
        if (googleBtnRef.current) {
          (window as any).google.accounts.id.renderButton(googleBtnRef.current, {
            theme: "filled_black",
            size: "large",
            shape: "pill",
            text: "continue_with",
            width: 280
          });
        }
      }
    };

    if (activeView === 'settings') {
      const interval = setInterval(() => {
        if ((window as any).google) {
          initGoogle();
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [activeView, profile.googleAccount]);

  const handleGoogleResponse = (response: any) => {
    const dummyUser: GoogleAccount = {
      id: "google_" + Date.now(),
      email: "jane.doe@gmail.com",
      verified: true,
      lastSyncedAt: Date.now()
    };
    
    setProfile(prev => ({
      ...prev,
      name: "Jane Doe",
      googleAccount: dummyUser
    }));
  };

  const handleGoogleLogout = () => {
    setProfile(prev => ({ ...prev, googleAccount: undefined }));
    if ((window as any).google) (window as any).google.accounts.id.disableAutoSelect();
  };

  const handleCloudSync = async () => {
    if (!profile.googleAccount || isSyncing) return;
    setIsSyncing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setProfile(prev => ({
      ...prev,
      googleAccount: prev.googleAccount ? { ...prev.googleAccount, lastSyncedAt: Date.now() } : undefined
    }));
    setIsSyncing(false);
  };

  useEffect(() => {
    if (inlineInputMode) setTimeout(() => inlineInputRef.current?.focus(), 100);
  }, [inlineInputMode]);

  useEffect(() => {
    try {
      const savedNotes = localStorage.getItem('nova_notes');
      if (savedNotes) {
        const parsed = JSON.parse(savedNotes);
        const withOrder = parsed.map((n: Note, i: number) => ({ ...n, order: n.order ?? i }));
        setNotes(withOrder);
      }
      const savedBuckets = localStorage.getItem('nova_buckets');
      if (savedBuckets) setBuckets(JSON.parse(savedBuckets));
      const savedProfile = localStorage.getItem('nova_profile');
      if (savedProfile) setProfile(JSON.parse(savedProfile));
      const savedPomoSettings = localStorage.getItem('nova_pomo_settings');
      if (savedPomoSettings) setPomoSettings(JSON.parse(savedPomoSettings));
      const savedPomoHistory = localStorage.getItem('nova_pomo_history');
      if (savedPomoHistory) setPomoHistory(JSON.parse(savedPomoHistory));
    } catch (e) { console.warn("Storage load fail", e); }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem('nova_notes', JSON.stringify(notes));
        localStorage.setItem('nova_buckets', JSON.stringify(buckets));
        localStorage.setItem('nova_profile', JSON.stringify(profile));
        localStorage.setItem('nova_pomo_settings', JSON.stringify(pomoSettings));
        localStorage.setItem('nova_pomo_history', JSON.stringify(pomoHistory));
      } catch (e) { console.error("Storage error", e); }
    }, 500);
    return () => clearTimeout(timer);
  }, [notes, buckets, profile, pomoSettings, pomoHistory]);

  useEffect(() => {
    let interval: any;
    if (isPomoRunning && pomoSeconds > 0) {
      interval = setInterval(() => setPomoSeconds((prev) => prev - 1), 1000);
    } else if (pomoSeconds === 0 && isPomoRunning) {
      setIsPomoRunning(false);
      setPomoHistory(prev => [{
        id: Date.now().toString(),
        label: currentSessionLabel || (pomoMode === 'work' ? 'Work' : 'Break'),
        duration: pomoSettings[pomoMode] * 60,
        mode: pomoMode,
        timestamp: Date.now()
      }, ...prev]);
    }
    
    if (isSwRunning) {
      interval = setInterval(() => setSwSeconds(prev => prev + 1), 1000);
    }

    return () => clearInterval(interval);
  }, [isPomoRunning, pomoSeconds, pomoMode, pomoSettings, currentSessionLabel, isSwRunning]);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartX.current === null) return;
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchEndX - touchStartX.current;

      if (diff > 80 && touchStartX.current < 40) {
        setIsDrawerOpen(true);
      }
      if (diff < -80 && isDrawerOpen) {
        setIsDrawerOpen(false);
      }
      touchStartX.current = null;
    };

    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDrawerOpen]);

  const togglePomo = () => setIsPomoRunning(!isPomoRunning);
  const resetPomo = () => { setIsPomoRunning(false); setPomoSeconds(pomoSettings[pomoMode] * 60); };

  const toggleSw = () => setIsSwRunning(!isSwRunning);
  const resetSw = () => { setIsSwRunning(false); setSwSeconds(0); setSwLaps([]); };
  const recordLap = () => setSwLaps(prev => [swSeconds, ...prev]);
  
  const handleExportData = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const zip = new JSZip();
      zip.file("notes.json", JSON.stringify(notes, null, 2));
      zip.file("buckets.json", JSON.stringify(buckets, null, 2));
      zip.file("profile.json", JSON.stringify(profile, null, 2));
      const content = await zip.generateAsync({ type: "blob" });
      const url = window.URL.createObjectURL(content);
      const link = document.createElement('a'); link.href = url;
      link.download = `Nova_Export_${format(Date.now(), 'yyyyMMdd')}.zip`;
      document.body.appendChild(link); link.click();
      document.body.removeChild(link); window.URL.revokeObjectURL(url);
    } catch (err) { console.error("Export fail", err); } finally { setIsExporting(false); }
  };

  const handleCreateNote = (bucketId?: string) => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: '',
      content: '',
      bucketId: bucketId || buckets[0]?.id || 'personal',
      priority: Priority.MEDIUM,
      category: 'General',
      tags: [],
      images: [],
      links: [],
      subTasks: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isCompleted: false,
      isPinned: false,
      isArchived: false,
      isDeleted: false,
      order: notes.length,
    };
    setEditingNote(newNote);
    setActiveView('create');
  };

  const handleEditNote = (id: string) => {
    const note = notes.find(n => n.id === id);
    if (note) { setEditingNote({ ...note }); setActiveView('create'); }
  };

  const handleSaveNote = () => {
    if (!editingNote?.id) return;
    const finalNote = { ...editingNote, updatedAt: Date.now(), order: editingNote.order ?? notes.length } as Note;
    setNotes(prev => {
      const exists = prev.find(n => n.id === finalNote.id);
      if (exists) return prev.map(n => n.id === finalNote.id ? finalNote : n);
      return [finalNote, ...prev];
    });
    setEditingNote(null);
    setActiveView(selectedBucketId ? 'bucket_detail' : 'notes');
  };

  const handleArchiveNote = () => {
    if (!editingNote?.id) return;
    const isArchiving = !editingNote.isArchived;
    const updated = { ...editingNote, isArchived: isArchiving, updatedAt: Date.now() } as Note;
    setNotes(prev => prev.map(n => n.id === updated.id ? updated : n));
    setEditingNote(null);
    setActiveView(isArchiving ? 'archived' : 'notes');
  };

  const handleDeleteNote = () => {
    if (!editingNote?.id) return;
    const isDeleting = !editingNote.isDeleted;
    const updated = { ...editingNote, isDeleted: isDeleting, updatedAt: Date.now() } as Note;
    setNotes(prev => prev.map(n => n.id === updated.id ? updated : n));
    setEditingNote(null);
    setActiveView(isDeleting ? 'trash' : 'notes');
  };

  const handlePermanentDelete = (id: string) => {
    if (window.confirm("Permanently delete this thought?")) {
      setNotes(prev => prev.filter(n => n.id !== id));
    }
  };

  const submitInlineInput = () => {
    if (!tempInputValue.trim()) {
      setInlineInputMode(null);
      return;
    }

    if (inlineInputMode === 'subtask' && editingNote) {
      const newTask: SubTask = {
        id: Date.now().toString(),
        text: tempInputValue.trim(),
        isCompleted: false,
      };
      setEditingNote(prev => prev ? ({ ...prev, subTasks: [...(prev.subTasks || []), newTask] }) : null);
    } else if (inlineInputMode === 'link' && editingNote) {
      setEditingNote(prev => prev ? ({ ...prev, links: [...(prev.links || []), tempInputValue.trim()] }) : null);
    }

    setTempInputValue('');
    setInlineInputMode(null);
  };

  const handlePinNote = () => {
    if (!editingNote) return;
    setEditingNote({ ...editingNote, isPinned: !editingNote.isPinned });
  };

  // Improved Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedNoteId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    
    // Create a drag image with lower opacity or offset
    const dragImg = new Image();
    dragImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(dragImg, 0, 0);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (draggedNoteId === null || draggedNoteId === targetId) return;
    
    // Avoid excessive state updates by checking if we've already tried this target
    if (lastDragTargetId.current === targetId) return;
    lastDragTargetId.current = targetId;
    
    setNotes(prev => {
      const copy = [...prev];
      const draggedIdx = copy.findIndex(n => n.id === draggedNoteId);
      const targetIdx = copy.findIndex(n => n.id === targetId);
      
      if (draggedIdx === -1 || targetIdx === -1) return prev;

      // Swap the items in the master array
      const [item] = copy.splice(draggedIdx, 1);
      copy.splice(targetIdx, 0, item);
      
      // Update the 'order' property for persistent manual ordering
      return copy.map((note, index) => ({ ...note, order: index }));
    });
  };

  const handleDragEnd = () => {
    setDraggedNoteId(null);
    lastDragTargetId.current = null;
  };

  const filteredNotes = useMemo(() => {
    let base = notes;
    if (activeView === 'archived') {
      base = notes.filter(n => n.isArchived && !n.isDeleted);
    } else if (activeView === 'trash') {
      base = notes.filter(n => n.isDeleted);
    } else if (activeView === 'notes') {
      base = notes.filter(n => !n.isArchived && !n.isDeleted);
    } else if (activeView === 'bucket_detail' && selectedBucketId) {
       base = notes.filter(n => n.bucketId === selectedBucketId && !n.isArchived && !n.isDeleted);
    }

    return base.filter(n => (n.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || (n.content || '').toLowerCase().includes(searchTerm.toLowerCase()))
      .filter(n => priorityFilter === 'All' || n.priority === priorityFilter)
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return (a.order ?? 0) - (b.order ?? 0);
      });
  }, [notes, searchTerm, priorityFilter, activeView, selectedBucketId]);

  const timelineGroups = useMemo(() => {
    const groups: Record<string, Note[]> = {};
    filteredNotes.forEach(n => { const date = format(n.createdAt, 'MMM dd, yyyy'); if (!groups[date]) groups[date] = []; groups[date].push(n); });
    return Object.entries(groups);
  }, [filteredNotes]);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentCalendarDate));
    const end = endOfWeek(endOfMonth(currentCalendarDate));
    return eachDayOfInterval({ start, end });
  }, [currentCalendarDate]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'task' | 'profile') => {
    const file = e.target.files?.[0]; if (!file) return;
    setIsImageLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      try {
        const img = new Image(); img.src = base64;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width, height = img.height;
          if (width > 600) { height = (600 / width) * height; width = 600; }
          canvas.width = width; canvas.height = height;
          canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.6);
          if (type === 'task') {
            setEditingNote(prev => prev ? ({ ...prev, images: [...(prev.images || []), compressed] }) : null);
          } else {
            setProfile(prev => ({ ...prev, avatarUrl: compressed }));
          }
        };
      } catch (e) { console.error(e); } finally { setIsImageLoading(false); }
    };
    reader.readAsDataURL(file); e.target.value = '';
  };

  const handleAiOptimize = async () => {
    if (!editingNote?.content) return;
    setIsAiLoading(true);
    const suggestions = await getSmartSuggestions(editingNote.content);
    if (suggestions) setEditingNote(prev => prev ? ({ ...prev, category: suggestions.category || prev.category, tags: Array.from(new Set([...(prev.tags || []), ...(suggestions.tags || [])])), priority: (suggestions.prioritySuggestion as Priority) || prev.priority }) : null);
    setIsAiLoading(false);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const pomoProgress = useMemo(() => {
    const total = pomoSettings[pomoMode] * 60;
    return ((total - pomoSeconds) / total) * 100;
  }, [pomoSeconds, pomoMode, pomoSettings]);

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="min-h-screen pb-32 animate-in fade-in duration-1000">
      {isDrawerOpen && <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[80] animate-in fade-in duration-300" onClick={() => setIsDrawerOpen(false)} />}
      
      <aside className={`fixed top-0 left-0 bottom-0 w-72 bg-zinc-950 border-r border-zinc-900 z-[90] p-6 transition-transform duration-500 ease-out flex flex-col ${isDrawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.1)]"><LayoutGrid className="text-black" size={20} /></div>
          <div>
            <h2 className="text-white font-black uppercase text-sm tracking-tighter">Nova Thought</h2>
            <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Space v1.0</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {[
            { id: 'notes', icon: LayoutGrid, label: 'Workspace' },
            { id: 'archived', icon: Archive, label: 'Vault' },
            { id: 'trash', icon: Trash, label: 'Trash' },
            { id: 'settings', icon: Settings, label: 'Settings' }
          ].map(item => (
            <button key={item.id} onClick={() => { setActiveView(item.id as ViewType); setIsDrawerOpen(false); }} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${activeView === item.id ? 'bg-white text-black shadow-xl shadow-white/5' : 'text-zinc-500 hover:text-white hover:bg-zinc-900/50'}`}>
              <item.icon size={18} />
              {item.label}
              {item.id === 'trash' && notes.filter(n => n.isDeleted).length > 0 && <span className="ml-auto w-5 h-5 bg-rose-500 text-white flex items-center justify-center rounded-lg text-[9px] animate-pulse">{notes.filter(n => n.isDeleted).length}</span>}
            </button>
          ))}
        </nav>

        <div className="pt-6 border-t border-zinc-900">
           {profile.googleAccount && (
              <div className="mb-4 px-2 py-1 flex items-center gap-2 text-[9px] font-black uppercase text-emerald-400 tracking-widest animate-pulse-soft">
                 <Cloud size={10} /> Cloud Connected
              </div>
           )}
           <div className="flex items-center gap-3 p-3.5 bg-zinc-900/40 rounded-3xl border border-zinc-800/50">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} className="w-12 h-12 rounded-2xl object-cover shadow-lg" />
              ) : (
                <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-500 font-black text-lg">{profile.name[0]}</div>
              )}
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-black text-white truncate">{profile.name}</p>
                <p className="text-[9px] text-zinc-500 font-bold uppercase truncate tracking-tight">{profile.bio}</p>
              </div>
           </div>
        </div>
      </aside>

      {activeView !== 'create' && activeView !== 'bucket_detail' && (
        <header className="px-6 pt-10 pb-4 sticky top-0 bg-zinc-950/80 backdrop-blur-xl z-40 border-b border-zinc-900">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <button onClick={() => setIsDrawerOpen(true)} className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-400 active:scale-95 transition-all hover:border-zinc-700"><Menu size={20} /></button>
              <h1 className="text-2xl font-bold tracking-tight text-white uppercase tracking-tighter">
                {activeView === 'notes' ? 'Workspace' : activeView === 'timeline' ? 'Journey' : activeView === 'buckets' ? 'Buckets' : activeView === 'pomodoro' ? 'Focus' : activeView === 'archived' ? 'Vault' : activeView === 'trash' ? 'Trash' : 'Settings'}
              </h1>
            </div>
            <div className="flex items-center gap-3">
               {profile.avatarUrl && <img src={profile.avatarUrl} alt="" className="w-9 h-9 rounded-2xl border border-zinc-800 object-cover shadow-md" />}
               <div className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-2xl text-indigo-400"><Sparkles size={18} /></div>
            </div>
          </div>
          <div className="space-y-4">
            {activeView !== 'pomodoro' && activeView !== 'settings' && (
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-white transition-colors" size={18} />
                <input type="text" placeholder="Search thoughts..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-zinc-900/40 border border-zinc-800/60 rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:border-zinc-700 transition-all placeholder:text-zinc-700" />
              </div>
            )}

            {activeView === 'timeline' && (
              <div className="flex p-1 bg-zinc-900/50 rounded-2xl border border-zinc-800/50">
                <button onClick={() => setTimelineMode('list')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[10px] font-black uppercase transition-all rounded-xl ${timelineMode === 'list' ? 'bg-white text-black shadow-lg' : 'text-zinc-500'}`}><ListIcon size={14} /> Timeline</button>
                <button onClick={() => setTimelineMode('calendar')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[10px] font-black uppercase transition-all rounded-xl ${timelineMode === 'calendar' ? 'bg-white text-black shadow-lg' : 'text-zinc-500'}`}><CalendarIcon size={14} /> Calendar</button>
              </div>
            )}

            {(activeView === 'notes' || activeView === 'archived' || activeView === 'trash') && (
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                <button onClick={() => setPriorityFilter('All')} className={`px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase border tracking-widest ${priorityFilter === 'All' ? 'bg-white border-white text-black' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}>All</button>
                {Object.values(Priority).map(p => (
                  <button key={p} onClick={() => setPriorityFilter(p)} className={`px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase border tracking-widest transition-all ${priorityFilter === p ? `${PRIORITY_COLORS[p]} border-transparent text-white shadow-xl` : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}>{p}</button>
                ))}
              </div>
            )}
          </div>
        </header>
      )}

      <main className="px-6">
        {activeView === 'notes' && (
          <div className="masonry-grid mt-6">
            {filteredNotes.map(note => (
              <NoteCard 
                key={note.id} 
                note={note} 
                onClick={handleEditNote} 
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                isDragging={draggedNoteId === note.id}
              />
            ))}
            {filteredNotes.length === 0 && (
              <div className="col-span-full py-32 text-center opacity-40">
                 <div className="w-20 h-20 bg-zinc-900 rounded-[2.5rem] mx-auto flex items-center justify-center text-zinc-700 mb-6"><LayoutGrid size={32} /></div>
                 <p className="text-zinc-500 font-black uppercase text-[11px] tracking-[0.2em]">Your thought space is clear</p>
              </div>
            )}
          </div>
        )}

        {activeView === 'archived' && (
          <div className="masonry-grid mt-6">
            {filteredNotes.map(note => <NoteCard key={note.id} note={note} onClick={handleEditNote} />)}
            {filteredNotes.length === 0 && (
              <div className="col-span-full py-32 text-center opacity-40"><div className="w-20 h-20 bg-zinc-900 rounded-[2.5rem] mx-auto flex items-center justify-center text-zinc-700 mb-6"><Archive size={32} /></div><p className="text-zinc-500 font-black uppercase text-[11px] tracking-[0.2em]">The vault is empty</p></div>
            )}
          </div>
        )}

        {activeView === 'trash' && (
          <div className="mt-6 space-y-4">
            {filteredNotes.map(note => (
              <div key={note.id} className="bg-zinc-900/40 border border-zinc-800/50 rounded-[2rem] p-6 flex items-center gap-4 group hover:bg-zinc-900/60 transition-all">
                 <div className="flex-1 overflow-hidden cursor-pointer" onClick={() => handleEditNote(note.id)}><h3 className="text-sm font-black text-white truncate">{note.title || 'Untitled Thought'}</h3><p className="text-xs text-zinc-600 truncate font-medium">{note.content}</p></div>
                 <button onClick={() => handlePermanentDelete(note.id)} className="p-3.5 bg-rose-500/10 text-rose-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white"><Trash size={18} /></button>
              </div>
            ))}
            {filteredNotes.length === 0 && <div className="py-32 text-center opacity-40"><div className="w-20 h-20 bg-zinc-900 rounded-[2.5rem] mx-auto flex items-center justify-center text-zinc-700 mb-6"><Trash size={32} /></div><p className="text-zinc-500 font-black uppercase text-[11px] tracking-[0.2em]">Trash is clean</p></div>}
          </div>
        )}

        {activeView === 'timeline' && timelineMode === 'list' && (
          <div className="space-y-10 mt-8 relative pl-4">
            <div className="absolute left-4 top-4 bottom-4 w-px bg-zinc-800/40" />
            {timelineGroups.map(([date, group]) => (
              <div key={date} className="relative pl-12">
                <div className="absolute left-2.5 top-2 w-3.5 h-3.5 rounded-full bg-indigo-500 border-4 border-zinc-950 z-10 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-6 sticky top-48 bg-zinc-950/90 backdrop-blur-md py-2">{date}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{group.map(note => <NoteCard key={note.id} note={note} onClick={handleEditNote} />)}</div>
              </div>
            ))}
          </div>
        )}

        {activeView === 'timeline' && timelineMode === 'calendar' && (
          <div className="mt-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-zinc-900/30 border border-zinc-800/40 rounded-[2.5rem] p-8 shadow-2xl backdrop-blur-sm">
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight">{format(currentCalendarDate, 'MMMM')}</h3>
                  <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">{format(currentCalendarDate, 'yyyy')}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setCurrentCalendarDate(subMonths(currentCalendarDate, 1))} className="p-3 bg-zinc-950/50 hover:bg-zinc-800 border border-zinc-800 rounded-2xl text-zinc-400 transition-all active:scale-95"><ChevronLeft size={20}/></button>
                  <button onClick={() => setCurrentCalendarDate(addMonths(currentCalendarDate, 1))} className="p-3 bg-zinc-950/50 hover:bg-zinc-800 border border-zinc-800 rounded-2xl text-zinc-400 transition-all active:scale-95"><ChevronRight size={20}/></button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="text-[9px] font-black text-zinc-700 uppercase tracking-widest text-center">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day, idx) => {
                  const isSelected = isSameDay(day, selectedCalendarDay);
                  const isCurrentMonth = isSameMonth(day, currentCalendarDate);
                  const hasNotes = notes.some(n => isSameDay(n.createdAt, day) && !n.isDeleted && !n.isArchived);
                  
                  return (
                    <button 
                      key={idx} 
                      onClick={() => setSelectedCalendarDay(day)} 
                      className={`relative aspect-square rounded-[1.2rem] flex flex-col items-center justify-center transition-all duration-300 ${
                        isSelected 
                          ? 'bg-white text-black shadow-[0_10px_20px_rgba(255,255,255,0.1)]' 
                          : isToday(day) 
                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                            : !isCurrentMonth 
                              ? 'text-zinc-800 opacity-20' 
                              : 'text-zinc-500 hover:bg-zinc-800/50'
                      }`}
                    >
                      <span className="text-xs font-black">{format(day, 'd')}</span>
                      {hasNotes && (
                        <div className={`absolute bottom-2 w-1 h-1 rounded-full ${isSelected ? 'bg-black' : 'bg-indigo-500 shadow-[0_0_5px_rgba(99,102,241,0.5)]'}`} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">Events for {format(selectedCalendarDay, 'MMMM do')}</h4>
                <div className="h-px bg-zinc-900 flex-1 ml-6 opacity-40" />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {notes.filter(n => isSameDay(n.createdAt, selectedCalendarDay) && !n.isDeleted && !n.isArchived).map(note => (
                  <NoteCard key={note.id} note={note} onClick={handleEditNote} />
                ))}
                {notes.filter(n => isSameDay(n.createdAt, selectedCalendarDay) && !n.isDeleted && !n.isArchived).length === 0 && (
                  <div className="col-span-full py-20 text-center opacity-30 border-2 border-dashed border-zinc-900 rounded-[2.5rem]">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-700">No thoughts recorded this day</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeView === 'buckets' && (
          <div className="space-y-6 mt-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {buckets.map(bucket => {
                const bNotes = notes.filter(n => n.bucketId === bucket.id && !n.isDeleted && !n.isArchived);
                return <BucketCard key={bucket.id} bucket={bucket} progress={bNotes.length > 0 ? (bNotes.filter(n => n.isCompleted).length / bNotes.length) * 100 : 0} count={bNotes.length} onClick={() => { setSelectedBucketId(bucket.id); setActiveView('bucket_detail'); }} />;
              })}
            </div>
          </div>
        )}

        {activeView === 'pomodoro' && (
          <div className="mt-8 flex flex-col items-center max-w-lg mx-auto space-y-12 animate-in zoom-in-95 duration-700">
            {/* Focus Mode Toggle */}
            <div className="flex p-1.5 bg-zinc-900/60 backdrop-blur-md rounded-3xl border border-zinc-800/50 w-full max-w-sm">
              <button 
                onClick={() => setFocusTab('pomodoro')}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all rounded-2xl flex items-center justify-center gap-2 ${focusTab === 'pomodoro' ? 'bg-white text-black shadow-lg shadow-white/5' : 'text-zinc-500 hover:text-white'}`}
              >
                <Clock size={14} /> Pomodoro
              </button>
              <button 
                onClick={() => setFocusTab('stopwatch')}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all rounded-2xl flex items-center justify-center gap-2 ${focusTab === 'stopwatch' ? 'bg-white text-black shadow-lg shadow-white/5' : 'text-zinc-500 hover:text-white'}`}
              >
                <Timer size={14} /> Stopwatch
              </button>
            </div>

            {focusTab === 'pomodoro' ? (
              <>
                <div className="flex p-1.5 bg-zinc-900/40 rounded-3xl border border-zinc-800/40 w-full max-xs">
                  {(['work', 'short', 'long'] as const).map(m => (
                    <button 
                      key={m} 
                      onClick={() => { setPomoMode(m); setPomoSeconds(pomoSettings[m] * 60); setIsPomoRunning(false); }}
                      className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all rounded-2xl ${pomoMode === m ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white'}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                <div className="relative w-80 h-80 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90 transform">
                    <circle cx="160" cy="160" r="150" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-zinc-900" />
                    <circle 
                      cx="160" cy="160" r="150" fill="transparent" stroke="currentColor" strokeWidth="8" 
                      strokeDasharray={942.48} 
                      strokeDashoffset={942.48 - (942.48 * pomoProgress) / 100}
                      strokeLinecap="round"
                      className={`transition-all duration-1000 ease-linear ${pomoMode === 'work' ? 'text-indigo-500' : pomoMode === 'short' ? 'text-emerald-500' : 'text-sky-500'}`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-7xl font-black text-white tracking-tighter tabular-nums drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">{formatTime(pomoSeconds)}</span>
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] mt-2">{pomoMode} session</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <button onClick={resetPomo} className="p-5 bg-zinc-900 border border-zinc-800 text-zinc-500 rounded-full hover:text-white transition-all active:scale-90"><RotateCcw size={24} /></button>
                  <button onClick={togglePomo} className={`w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-2xl active:scale-90 ${isPomoRunning ? 'bg-white text-black' : 'bg-indigo-600 text-white'}`}>
                    {isPomoRunning ? <Pause size={40} fill="currentColor" /> : <Play size={40} className="translate-x-1" fill="currentColor" />}
                  </button>
                  <button onClick={() => setIsPomoSettingsOpen(true)} className="p-5 bg-zinc-900 border border-zinc-800 text-zinc-500 rounded-full hover:text-white transition-all active:scale-90"><SettingsIcon size={24} /></button>
                </div>
              </>
            ) : (
              <>
                <div className="relative w-80 h-80 flex items-center justify-center">
                   <div className="absolute inset-0 rounded-full border-8 border-zinc-900" />
                   <div className="absolute inset-0 rounded-full border-8 border-indigo-500/20 animate-pulse" />
                   <div className="flex flex-col items-center justify-center text-center">
                    <span className="text-7xl font-black text-white tracking-tighter tabular-nums drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">{formatTime(swSeconds)}</span>
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] mt-2">Stopwatch Active</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <button onClick={resetSw} className="p-5 bg-zinc-900 border border-zinc-800 text-zinc-500 rounded-full hover:text-white transition-all active:scale-90"><RotateCcw size={24} /></button>
                  <button onClick={toggleSw} className={`w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-2xl active:scale-90 ${isSwRunning ? 'bg-white text-black' : 'bg-emerald-600 text-white'}`}>
                    {isSwRunning ? <Pause size={40} fill="currentColor" /> : <Play size={40} className="translate-x-1" fill="currentColor" />}
                  </button>
                  <button onClick={recordLap} disabled={!isSwRunning} className={`p-5 bg-zinc-900 border border-zinc-800 rounded-full transition-all active:scale-90 ${isSwRunning ? 'text-indigo-400' : 'text-zinc-800'}`}><Flag size={24} /></button>
                </div>
              </>
            )}

            <div className="w-full space-y-6 pt-12 pb-24">
              <div className="flex items-center justify-between px-2">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-700">{focusTab === 'pomodoro' ? 'Focus History' : 'Lap History'}</h4>
                <div className="h-px bg-zinc-900 flex-1 ml-6 opacity-40" />
              </div>
              
              <div className="space-y-3">
                {focusTab === 'pomodoro' ? (
                  pomoHistory.slice(0, 4).map(h => (
                    <div key={h.id} className="flex items-center justify-between p-5 bg-zinc-900/40 border border-zinc-800/60 rounded-3xl">
                      <div className="flex items-center gap-4">
                        <div className={`w-2 h-2 rounded-full ${h.mode === 'work' ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
                        <span className="text-xs font-black text-white">{h.label}</span>
                      </div>
                      <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{format(h.timestamp, 'HH:mm')} • {Math.round(h.duration / 60)}m</span>
                    </div>
                  ))
                ) : (
                  swLaps.map((lap, idx) => (
                    <div key={idx} className="flex items-center justify-between p-5 bg-zinc-900/40 border border-zinc-800/60 rounded-3xl animate-in slide-in-from-right-4 duration-300">
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] font-black text-zinc-600">#{swLaps.length - idx}</span>
                        <span className="text-xs font-black text-white">Lap Split</span>
                      </div>
                      <span className="text-[10px] font-bold text-indigo-400 tabular-nums uppercase tracking-widest">{formatTime(lap)}</span>
                    </div>
                  ))
                )}
                {((focusTab === 'pomodoro' && pomoHistory.length === 0) || (focusTab === 'stopwatch' && swLaps.length === 0)) && (
                  <div className="py-12 text-center opacity-30 border-2 border-dashed border-zinc-900 rounded-[2.5rem]">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-700">No data to display yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeView === 'settings' && (
          <div className="mt-8 space-y-6 max-w-2xl mx-auto pb-40">
            <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-[2.5rem] p-8 space-y-10">
              <div className="flex flex-col items-center text-center gap-6">
                <div className="relative cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                  <div className="w-32 h-32 rounded-[2.5rem] bg-zinc-800 flex items-center justify-center text-4xl font-black border-2 border-zinc-700 overflow-hidden shadow-2xl">
                    {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /> : profile.name[0]}
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-[2.5rem] flex items-center justify-center text-white"><Camera size={24} /></div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'profile')} />
                </div>
                <div className="space-y-2 w-full">
                  <input value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} className="bg-transparent text-2xl font-black text-center w-full focus:outline-none placeholder:text-zinc-800" placeholder="Display Name" />
                  <input value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} className="bg-transparent text-xs font-bold text-zinc-500 text-center w-full uppercase tracking-widest focus:outline-none placeholder:text-zinc-800" placeholder="Short Bio" />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase text-zinc-700 tracking-[0.3em] px-2">Cloud & Security</h3>
                <div className="bg-zinc-950/60 border border-zinc-800/60 rounded-3xl p-6 space-y-6">
                  {!profile.googleAccount ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 text-zinc-400">
                        <CloudOff size={22} className="text-zinc-700" />
                        <div className="flex-1">
                          <p className="text-sm font-bold text-white">Google Cloud Sync</p>
                          <p className="text-[10px] font-medium text-zinc-500">Connect your account to save notes across devices.</p>
                        </div>
                      </div>
                      <div ref={googleBtnRef} className="flex justify-center pt-2"></div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500"><Cloud size={20} /></div>
                          <div>
                            <p className="text-sm font-black text-white">Cloud Active</p>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">{profile.googleAccount.email}</p>
                          </div>
                        </div>
                        <button onClick={handleGoogleLogout} className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-rose-500 hover:bg-rose-500/10 transition-colors"><LogOut size={18} /></button>
                      </div>

                      <div className="flex flex-col gap-3 pt-4 border-t border-zinc-900/50">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase text-zinc-600 tracking-widest">
                           <span>Last Sync</span>
                           <span className="text-zinc-400">{profile.googleAccount.lastSyncedAt ? format(profile.googleAccount.lastSyncedAt, 'HH:mm:ss') : 'Never'}</span>
                        </div>
                        <button onClick={handleCloudSync} disabled={isSyncing} className="w-full py-4 bg-indigo-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(99,102,241,0.2)] active:scale-95 transition-all flex items-center justify-center gap-3">
                          {isSyncing ? (<><RefreshCw size={16} className="animate-spin" /> Syncing...</>) : (<><RefreshCw size={16} /> Sync Now</>)}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid gap-3">
                <button onClick={handleExportData} disabled={isExporting} className="flex items-center justify-between w-full p-6 bg-zinc-950/60 border border-zinc-800/60 rounded-3xl hover:bg-zinc-900 transition-all group">
                  <div className="flex items-center gap-4 text-indigo-400"><Download size={22} /><span className="text-sm font-black uppercase tracking-widest text-zinc-100">Export ZIP</span></div>
                  {isExporting ? <Loader2 size={20} className="animate-spin text-zinc-600" /> : <ChevronRight size={20} className="text-zinc-700 group-hover:translate-x-1 transition-transform" />}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeView === 'create' && editingNote && (
          <div className="fixed inset-0 bg-zinc-950 z-[100] flex flex-col pt-12 overflow-y-auto pb-40 animate-in slide-in-from-bottom-10 duration-500">
            <header className="px-6 flex justify-between items-center mb-8 sticky top-0 bg-zinc-950/95 backdrop-blur-md pb-6 z-50">
              <div className="flex gap-2.5">
                <button onClick={() => { setEditingNote(null); setActiveView('notes'); }} className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-400 hover:text-white transition-all active:scale-95"><ChevronLeft size={22} /></button>
                <button onClick={handlePinNote} className={`p-3 rounded-2xl border transition-all active:scale-95 ${editingNote.isPinned ? 'bg-indigo-500 border-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]' : 'bg-zinc-900 border-zinc-800 text-zinc-600'}`}><Pin size={22} className={editingNote.isPinned ? 'fill-white' : ''} /></button>
              </div>
              <div className="flex gap-2.5">
                <button onClick={handleArchiveNote} className={`p-3 rounded-2xl border transition-all ${editingNote.isArchived ? 'bg-amber-500/20 border-amber-500/30 text-amber-500' : 'bg-zinc-900 border-zinc-800 text-zinc-600'}`}><Archive size={22} /></button>
                <button onClick={handleDeleteNote} className={`p-3 rounded-2xl border transition-all ${editingNote.isDeleted ? 'bg-rose-500/20 border-rose-500/30 text-rose-500' : 'bg-zinc-900 border-zinc-800 text-zinc-600'}`}><Trash size={22} /></button>
                <button onClick={handleSaveNote} className="px-10 py-3 bg-white text-black rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all">Commit</button>
              </div>
            </header>
            
            <div className="px-6 space-y-10 max-w-3xl mx-auto w-full">
              <input type="text" placeholder="Idea title..." value={editingNote.title || ''} onChange={e => setEditingNote(prev => prev ? ({ ...prev, title: e.target.value }) : null)} className="w-full bg-transparent text-5xl font-black focus:outline-none placeholder:text-zinc-900 tracking-tighter" />
              
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                <select value={editingNote.priority} onChange={e => setEditingNote(prev => prev ? ({ ...prev, priority: e.target.value as Priority }) : null)} className={`px-5 py-3 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] focus:outline-none ${PRIORITY_TEXT_COLORS[editingNote.priority || Priority.LOW]}`}>
                  {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <select value={editingNote.bucketId} onChange={e => setEditingNote(prev => prev ? ({ ...prev, bucketId: e.target.value }) : null)} className="px-5 py-3 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 focus:outline-none">
                  {buckets.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <button onClick={handleAiOptimize} className="flex items-center gap-2 bg-indigo-500/10 text-indigo-400 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border border-indigo-500/20 active:scale-95 transition-all">{isAiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} AI Insight</button>
              </div>

              <textarea placeholder="The core of your thought..." value={editingNote.content || ''} onChange={e => setEditingNote(prev => prev ? ({ ...prev, content: e.target.value }) : null)} className="w-full bg-transparent text-xl text-zinc-400 leading-relaxed min-h-[300px] focus:outline-none resize-none placeholder:text-zinc-900/40" />
              
              <div className="space-y-8 pt-10 border-t border-zinc-900/60">
                {(editingNote.images?.length || 0) > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase text-zinc-700 tracking-[0.3em]">Gallery</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {editingNote.images?.map((img, i) => (
                        <div key={i} className="relative aspect-square group rounded-3xl overflow-hidden border border-zinc-800">
                          <img src={img} alt="" className="w-full h-full object-cover" />
                          <button onClick={() => setEditingNote(prev => prev ? ({ ...prev, images: prev.images?.filter((_, idx) => idx !== i) }) : null)} className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[10px] font-black uppercase text-zinc-700 tracking-[0.3em]">Checkpoints</h4>
                    <button onClick={() => setInlineInputMode('subtask')} className="text-[10px] font-black uppercase text-indigo-400 hover:text-indigo-300 transition-colors">Add New</button>
                  </div>
                  {inlineInputMode === 'subtask' && (
                    <div className="flex gap-3 animate-in slide-in-from-top-4 duration-300">
                      <input autoFocus value={tempInputValue} onChange={e => setTempInputValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitInlineInput()} placeholder="What needs to be done?" className="flex-1 bg-zinc-900 border border-zinc-800 px-6 py-3 rounded-2xl text-sm focus:outline-none" />
                      <button onClick={submitInlineInput} className="px-6 bg-white text-black rounded-2xl font-black active:scale-95"><Check size={20} /></button>
                    </div>
                  )}
                  <div className="space-y-2">
                    {editingNote.subTasks?.map(st => (
                      <div key={st.id} className="flex items-center gap-4 p-4 bg-zinc-900/40 border border-zinc-800/60 rounded-[1.5rem] group">
                        <button onClick={() => setEditingNote(prev => prev ? ({ ...prev, subTasks: prev.subTasks?.map(s => s.id === st.id ? { ...s, isCompleted: !s.isCompleted } : s) }) : null)} className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${st.isCompleted ? 'bg-indigo-500 border-indigo-500' : 'border-zinc-700'}`}>
                          {st.isCompleted && <Check size={14} className="text-white" />}
                        </button>
                        <span className={`text-sm flex-1 font-medium ${st.isCompleted ? 'line-through text-zinc-700' : 'text-zinc-300'}`}>{st.text}</span>
                        <button onClick={() => setEditingNote(prev => prev ? ({ ...prev, subTasks: prev.subTasks?.filter(s => s.id !== st.id) }) : null)} className="text-zinc-800 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all p-1"><X size={16} /></button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[10px] font-black uppercase text-zinc-700 tracking-[0.3em]">Resources</h4>
                    <button onClick={() => setInlineInputMode('link')} className="text-[10px] font-black uppercase text-indigo-400 hover:text-indigo-300 transition-colors">Attach Link</button>
                  </div>
                  {inlineInputMode === 'link' && (
                    <div className="flex gap-3 animate-in slide-in-from-top-4 duration-300">
                      <input autoFocus value={tempInputValue} onChange={e => setTempInputValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitInlineInput()} placeholder="Paste URL..." className="flex-1 bg-zinc-900 border border-zinc-800 px-6 py-3 rounded-2xl text-sm focus:outline-none" />
                      <button onClick={submitInlineInput} className="px-6 bg-white text-black rounded-2xl font-black active:scale-95"><Check size={20} /></button>
                    </div>
                  )}
                  <div className="grid grid-cols-1 gap-2">
                    {editingNote.links?.map((link, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 bg-zinc-900/40 border border-zinc-800/60 rounded-[1.5rem] group">
                        <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-500"><Globe size={16} /></div>
                        <span className="text-xs font-bold text-zinc-400 flex-1 truncate">{link}</span>
                        <button onClick={() => setEditingNote(prev => prev ? ({ ...prev, links: prev.links?.filter((_, idx) => idx !== i) }) : null)} className="text-zinc-800 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all p-1"><X size={16} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-[2rem] shadow-2xl z-50">
                <button onClick={() => taskImageInputRef.current?.click()} className="p-4 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-all">
                  <ImageIcon size={20} />
                  <input type="file" ref={taskImageInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'task')} />
                </button>
                <div className="w-px h-6 bg-zinc-800" />
                <button onClick={() => setInlineInputMode('link')} className="p-4 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-all"><LinkIcon size={20} /></button>
                <div className="w-px h-6 bg-zinc-800" />
                <button onClick={() => setInlineInputMode('subtask')} className="p-4 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-all"><ListTodo size={20} /></button>
              </div>
            </div>
          </div>
        )}
      </main>

      {activeView !== 'create' && activeView !== 'pomodoro' && activeView !== 'settings' && (
        <button onClick={() => handleCreateNote(selectedBucketId || undefined)} className="fixed right-6 bottom-28 w-16 h-16 bg-white rounded-[2rem] shadow-[0_20px_40px_rgba(255,255,255,0.1)] flex items-center justify-center text-black active:scale-90 transition-all z-50 hover:bg-zinc-200"><Plus size={36} strokeWidth={2.5} /></button>
      )}
      <BottomNav activeView={activeView === 'bucket_detail' ? 'buckets' : activeView} onViewChange={setActiveView} />

      {isPomoSettingsOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 space-y-8 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-white">Focus Settings</h3>
              <button onClick={() => setIsPomoSettingsOpen(false)} className="p-2 text-zinc-500 hover:text-white"><X size={24} /></button>
            </div>
            <div className="space-y-6">
              {(['work', 'short', 'long'] as const).map(key => (
                <div key={key} className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">{key} duration (min)</label>
                  <input 
                    type="number" 
                    value={pomoSettings[key]} 
                    onChange={e => setPomoSettings(prev => ({ ...prev, [key]: parseInt(e.target.value) || 1 }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white font-bold focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
              ))}
            </div>
            <button onClick={() => { resetPomo(); setIsPomoSettingsOpen(false); }} className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-[11px] active:scale-95 transition-all">Apply Changes</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
