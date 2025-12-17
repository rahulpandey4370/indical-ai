
import { Bot, UtensilsCrossed, Moon, Sun } from 'lucide-react';
import Link from 'next/link';

interface HeaderProps {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  onAssistantClick: () => void;
}

export function Header({ darkMode, setDarkMode, onAssistantClick }: HeaderProps) {
  return (
    <header className={`px-6 lg:px-10 py-5 flex items-center justify-between border-b sticky top-0 z-50 backdrop-blur-xl ${darkMode ? 'bg-slate-950/70 border-white/5' : 'bg-white/80 border-slate-200/50'}`}>
      <Link href="/" className="flex items-center gap-3 group" prefetch={false}>
         <div className="w-10 h-10 bg-gradient-to-br from-primary to-amber-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
            <UtensilsCrossed size={20} />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-primary to-amber-600 bg-clip-text text-transparent">
              IndiCal AI
            </h1>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Premium Nutrition</p>
          </div>
      </Link>
       <div className="flex items-center gap-4">
          <button onClick={onAssistantClick} className="p-3 rounded-2xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300">
            <Bot size={22} />
          </button>
          <button onClick={() => setDarkMode(!darkMode)} className={`p-3 rounded-2xl transition-all duration-300 ${darkMode ? 'bg-slate-800/50 text-yellow-400' : 'bg-slate-100 text-slate-500'}`}>
            {darkMode ? <Sun size={20}/> : <Moon size={20}/>}
          </button>
        </div>
    </header>
  );
}
