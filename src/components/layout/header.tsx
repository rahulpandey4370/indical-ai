import { Bot, Moon, Sun } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface HeaderProps {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  onAssistantClick: () => void;
}

export function Header({ darkMode, setDarkMode, onAssistantClick }: HeaderProps) {
  return (
    <header className={`px-4 md:px-6 py-4 flex items-center justify-between border-b sticky top-0 z-50 backdrop-blur-xl bg-background/80 ${darkMode ? 'border-white/5' : 'border-slate-200/50'}`}>
      <Link href="/" className="flex items-center gap-3 group" prefetch={false}>
         <div className="w-9 h-9 bg-gradient-to-br from-primary to-amber-600 rounded-lg flex items-center justify-center text-white font-black text-lg shadow-md shadow-primary/20 group-hover:scale-105 transition-transform p-1">
            <Image src="/logo.png" alt="IndiCal AI Logo" width={40} height={40} />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-black tracking-tight bg-gradient-to-r from-primary to-amber-600 bg-clip-text text-transparent">
              IndiCal AI
            </h1>
          </div>
      </Link>
       <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={onAssistantClick} className="p-2 sm:p-3 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300">
            <Bot size={20} />
          </button>
          <button onClick={() => setDarkMode(!darkMode)} className={`p-2 sm:p-3 rounded-xl transition-all duration-300 ${darkMode ? 'bg-slate-800 text-yellow-400' : 'bg-slate-100 text-slate-500'}`}>
            {darkMode ? <Sun size={20}/> : <Moon size={20}/>}
          </button>
        </div>
    </header>
  );
}
