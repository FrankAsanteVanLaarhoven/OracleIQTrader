import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { LANGUAGES } from '../i18n';

const LanguageSelector = ({ variant = 'default' }) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const currentLang = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className="relative" data-testid="language-selector">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
          variant === 'compact' 
            ? 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white'
            : 'bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300'
        }`}
      >
        <Globe size={14} />
        <span className="text-sm font-mono">{currentLang.flag}</span>
        {variant !== 'compact' && (
          <span className="text-xs font-mono hidden sm:inline">{currentLang.code.toUpperCase()}</span>
        )}
        <ChevronDown size={12} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 z-50 min-w-[160px] py-2 rounded-xl bg-black/90 backdrop-blur-xl border border-white/10 shadow-2xl"
            >
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                    i18n.language === lang.code
                      ? 'bg-teal-500/20 text-teal-400'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                  data-testid={`lang-${lang.code}`}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span className="text-sm font-mono flex-1">{lang.name}</span>
                  {i18n.language === lang.code && (
                    <Check size={14} className="text-teal-400" />
                  )}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LanguageSelector;
