import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ArrowRightLeft, Sparkles } from 'lucide-react';
import books from '../data/books.json';
import verseTexts from '../data/verse-text.kjv.json';
import type { RenderLink } from './NetworkCanvas';

interface ReferenceCardProps {
  activeLink: RenderLink | null;
}

export const ReferenceCard: React.FC<ReferenceCardProps> = ({ activeLink }) => {
  // OS prefers-reduced-motion 감지 상태
  const [shouldReduceMotion, setShouldReduceMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleMediaChange = (e: MediaQueryListEvent) => {
      setShouldReduceMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleMediaChange);
    return () => mediaQuery.removeEventListener('change', handleMediaChange);
  }, []);

  // 텍스트 조회용 헬퍼 키 생성
  const getVerseText = (bookIdx: number, chapter: number, verse: number) => {
    const key = `${bookIdx}.${chapter}.${verse}` as keyof typeof verseTexts;
    return verseTexts[key] || "Verse text loaded dynamically in full release.";
  };

  // Reduced Motion 대응 애니메이션 설정
  const animVariants = {
    initial: shouldReduceMotion 
      ? { opacity: 0 } 
      : { opacity: 0, y: 20, scale: 0.98 },
    animate: shouldReduceMotion 
      ? { opacity: 1 } 
      : { opacity: 1, y: 0, scale: 1 },
    exit: shouldReduceMotion 
      ? { opacity: 0 } 
      : { opacity: 0, y: 15, scale: 0.98 }
  };

  const animTransition = shouldReduceMotion 
    ? { duration: 0 } 
    : { duration: 0.25, ease: 'easeOut' };

  return (
    <AnimatePresence>
      {activeLink && (
        <motion.div
          variants={animVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={animTransition}
          className="glass-panel w-full rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden"
        >
          {/* 장식적 네온 백그라운드 그라디언트 */}
          <div className="absolute -right-16 -top-16 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* 상단 헤더 영역 */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800/60">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-500/10 text-brand-accent rounded-lg">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-slate-100 tracking-wide">
                교차 참조 연결 세부 정보
              </h3>
            </div>
            
            {/* 연결 타입 배지 */}
            <span className="px-3 py-1 bg-slate-900/80 text-emerald-400 border border-emerald-500/20 text-xs font-semibold rounded-full tracking-wider uppercase">
              {activeLink.testamentClass.replace(/_/g, ' ')} (Weight: {activeLink.weight.toFixed(2)})
            </span>
          </div>

          {/* 소스 및 타겟 그리드 레이아웃 */}
          <div className="grid grid-cols-1 md:grid-cols-11 items-stretch gap-6 relative">
            
            {/* 1. Source Verse Card */}
            <div className="md:col-span-5 flex flex-col justify-between glass-card p-5 rounded-xl transition-all hover:border-blue-500/20">
              <div>
                <span className="text-xs font-bold text-blue-400/90 tracking-widest uppercase block mb-1">
                  SOURCE (출처 구절)
                </span>
                <h4 className="text-2xl font-bold text-slate-100 flex items-center gap-2 mb-3">
                  <BookOpen className="w-5 h-5 text-blue-400 shrink-0" />
                  {books[activeLink.source.bookIndex].ko} {activeLink.source.chapter}:{activeLink.source.verse}
                  <span className="text-sm font-normal text-slate-400 ml-1">
                    ({books[activeLink.source.bookIndex].en})
                  </span>
                </h4>
                <p className="text-slate-300 leading-relaxed font-serif text-base italic pl-2 border-l-2 border-blue-500/30">
                  "{getVerseText(activeLink.source.bookIndex, activeLink.source.chapter, activeLink.source.verse)}"
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/30 flex justify-between text-xs text-slate-400">
                <span>Testament: {books[activeLink.source.bookIndex].testament}</span>
                <span>Section: {books[activeLink.source.bookIndex].section}</span>
              </div>
            </div>

            {/* 2. 중앙 교환 화살표 아이콘 */}
            <div className="md:col-span-1 flex items-center justify-center">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/10 shadow-lg shadow-black/30">
                <ArrowRightLeft className="w-6 h-6 rotate-90 md:rotate-0" />
              </div>
            </div>

            {/* 3. Target Verse Card */}
            <div className="md:col-span-5 flex flex-col justify-between glass-card p-5 rounded-xl transition-all hover:border-pink-500/20">
              <div>
                <span className="text-xs font-bold text-pink-400/90 tracking-widest uppercase block mb-1">
                  TARGET (연결 구절)
                </span>
                <h4 className="text-2xl font-bold text-slate-100 flex items-center gap-2 mb-3">
                  <BookOpen className="w-5 h-5 text-pink-400 shrink-0" />
                  {books[activeLink.target.bookIndex].ko} {activeLink.target.chapter}:{activeLink.target.verse}
                  <span className="text-sm font-normal text-slate-400 ml-1">
                    ({books[activeLink.target.bookIndex].en})
                  </span>
                </h4>
                <p className="text-slate-300 leading-relaxed font-serif text-base italic pl-2 border-l-2 border-pink-500/30">
                  "{getVerseText(activeLink.target.bookIndex, activeLink.target.chapter, activeLink.target.verse)}"
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/30 flex justify-between text-xs text-slate-400">
                <span>Testament: {books[activeLink.target.bookIndex].testament}</span>
                <span>Section: {books[activeLink.target.bookIndex].section}</span>
              </div>
            </div>

          </div>

        </motion.div>
      )}
    </AnimatePresence>
  );
};
