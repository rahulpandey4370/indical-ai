
'use client';
import { Bot, Moon, Sun, Home, LineChart, Settings, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useState, useRef, useCallback } from 'react';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';
import { useUser } from '@/hooks/use-user';
import { useModel } from '@/hooks/use-model';
import { getAssistantResponse } from '@/ai/flows/get-assistant-response';
import { getHistory, getGoals } from '@/lib/actions';
import { HistoryEntry, UserGoals, ChatMessage } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useModel } from '@/hooks/use-model';

const NavLink = ({ href, children, icon: Icon }: { href: string, children: React.ReactNode, icon: React.ElementType }) => {
    const pathname = usePathname();
    const isActive = pathname === href;
    return (
        <Link href={href} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
            <Icon size={20} />
            <span className="font-bold">{children}</span>
        </Link>
    )
}


export function Nav() {
  const [darkMode, setDarkMode] = useState(false);
  const { user } = useUser();
  const { toast } = useToast();
<<<<<<< HEAD
  const { model, incrementModelUsage } = useModel();
=======
  const { selectedModel } = useModel();
>>>>>>> 052caa3 (Can you please at a 3 dot button to the right most side of the dock whic)

  // Assistant State
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [assistantChat, setAssistantChat] = useState<ChatMessage[]>([]);
  const [assistantInput, setAssistantInput] = useState("");
  const [processingAssistant, setProcessingAssistant] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [goals, setGoals] = useState<UserGoals | null>(null);
  const assistantScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('indical_theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('indical_theme', darkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

   useEffect(() => {
    if (user) {
      Promise.all([getHistory(user.id), getGoals(user.id)])
        .then(([userHistory, userGoals]) => {
          setHistory(userHistory);
          if (userGoals) {
            setGoals(userGoals);
          }
        })
        .catch(() => {
            toast({variant: 'destructive', title: "Error", description: "Could not load user history or goals."})
        })
    }
  }, [user, toast]);

  const handleAssistantSend = async () => {
    if (!assistantInput.trim()) {
      return;
    }
    if (!goals) {
      toast({ variant: 'destructive', title: "Cannot send message", description: "User data or goals are not loaded yet." });
      return;
    }
    
    const currentChat = [...assistantChat, { role: 'user' as const, text: assistantInput }];
    setAssistantChat(currentChat);
    setAssistantInput("");
    setProcessingAssistant(true);
    incrementModelUsage(model);
    try {
      // Pass only today's history to the assistant
      const today = new Date().toDateString();
      const todayHistory = history.filter(h => new Date(h.timestamp).toDateString() === today);

      const response = await getAssistantResponse({
        userMessage: currentChat[currentChat.length -1].text,
        history: todayHistory,
        goals: goals,
        chatHistory: currentChat.slice(0, -1),
<<<<<<< HEAD
        currentDate: new Date().toISOString(),
      }, model);
=======
        currentDate: new Date().toDateString()
      }, selectedModel);
>>>>>>> 052caa3 (Can you please at a 3 dot button to the right most side of the dock whic)
      setAssistantChat(prev => [...prev, { role: 'model', text: response }]);
    } catch(e: any) {
        setAssistantChat(prev => [...prev, { role: 'model', text: "Sorry, I'm having trouble connecting right now." }]);
        toast({ variant: 'destructive', title: "Assistant Error", description: e.message });
    } finally {
        setProcessingAssistant(false);
    }
  };

  useEffect(() => {
    if (assistantScrollRef.current) {
      assistantScrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [assistantChat]);


  return (
    <>
      <header className={`px-4 md:px-6 py-3 flex items-center justify-between border-b sticky top-0 z-50 backdrop-blur-xl bg-background/80 ${darkMode ? 'border-white/5' : 'border-slate-200/50'}`}>
        <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3 group" prefetch={false}>
                <Image src="/logo.png" alt="IndiCal AI Logo" width={48} height={48} className="rounded-xl border-2 border-border group-hover:scale-105 transition-transform" />
                <div className="hidden sm:block">
                    <h1 className="text-2xl font-black tracking-tighter" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                      <span className="bg-gradient-to-r from-primary via-orange-600 to-amber-500 bg-clip-text text-transparent">IndiCal</span>
                      <span className="text-accent"> AI</span>
                    </h1>
                </div>
            </Link>

            <nav className="hidden md:flex items-center gap-2 bg-muted p-1 rounded-xl">
               <NavLink href="/" icon={Home}>Dashboard</NavLink>
               <NavLink href="/insights" icon={LineChart}>Insights</NavLink>
            </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={() => setIsAssistantOpen(true)} className="p-2 sm:p-3 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300">
                <Bot size={20} />
            </button>
            <button onClick={() => setDarkMode(!darkMode)} className={`p-2 sm:p-3 rounded-xl transition-all duration-300 ${darkMode ? 'bg-slate-800 text-yellow-400' : 'bg-slate-100 text-slate-500'}`}>
                {darkMode ? <Sun size={20}/> : <Moon size={20}/>}
            </button>
        </div>
      </header>

      {/* Mobile Nav */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-50">
         <div className="bg-card/90 backdrop-blur-xl p-2 rounded-2xl shadow-2xl flex items-center justify-around border border-border/50">
            <Link href="/" className="p-3 rounded-lg data-[active=true]:bg-primary/10 data-[active=true]:text-primary" data-active={usePathname() === '/'}><Home/></Link>
            <Link href="/insights" className="p-3 rounded-lg data-[active=true]:bg-primary/10 data-[active=true]:text-primary" data-active={usePathname() === '/insights'}><LineChart/></Link>
         </div>
      </div>

       {/* Assistant Panel */}
      <Sheet open={isAssistantOpen} onOpenChange={setIsAssistantOpen}>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto flex flex-col p-0">
            <SheetHeader className='p-6 pb-4 border-b'>
              <SheetTitle className="font-headline flex items-center gap-3 text-2xl">
                 <Bot className="text-primary" size={28}/> Health Companion
              </SheetTitle>
              <SheetDescription>
                Your AI-powered nutrition assistant. Ask me anything!
              </SheetDescription>
            </SheetHeader>
             <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {assistantChat.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm text-sm font-medium leading-relaxed ${m.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-muted text-muted-foreground rounded-bl-none'}`}>
                      {m.text}
                    </div>
                  </div>
                ))}
                {processingAssistant && (
                  <div className="flex justify-start">
                    <div className="p-4 rounded-2xl bg-muted flex items-center gap-2">
                       <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay:'0ms'}} />
                       <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay:'150ms'}} />
                       <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay:'300ms'}} />
                    </div>
                  </div>
                )}
               <div ref={assistantScrollRef} />
             </div>
             <div className="p-4 border-t bg-background">
              <div className="relative flex items-center">
                <Input 
                  type="text" 
                  value={assistantInput} 
                  onChange={(e) => setAssistantInput(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && handleAssistantSend()} 
                  placeholder={!goals ? "Loading user data..." : "Ask about macros..."}
                  className="pr-12" 
                  disabled={!goals || processingAssistant}
                />
                <Button onClick={handleAssistantSend} disabled={!goals || processingAssistant} size="icon" className="absolute right-2" variant="ghost">
                  {processingAssistant ? <Loader2 className="animate-spin" /> : <Send size={20}/>}
                </Button>
              </div>
             </div>
          </SheetContent>
      </Sheet>
    </>
  );
}
