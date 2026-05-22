import React, { useState, useEffect, useRef } from 'react';
import { Search, X, CornerDownLeft } from 'lucide-react';
import { getSuggestions, parseQuickVerse, type AutocompleteSuggest } from '../utils/search-utils';
import { type VerseRef } from './NetworkCanvas';
import books from '../data/books.json';

interface SearchBarProps {
  onSearch: (bookIndex: number, chapter: number, verse: number) => void;
  searchVerse: VerseRef | null;
  onClear: () => void;
}

export function SearchBar({ onSearch, searchVerse, onClear }: SearchBarProps) {
  const [inputVal, setInputVal] = useState('');
  const [suggestions, setSuggestions] = useState<AutocompleteSuggest[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 1. 외부 검색 구절 상태(searchVerse) 변경 시 검색창 텍스트 양방향 동기화 (Effect 없이 렌더링 도중 상태 조정)
  const [prevSearchVerse, setPrevSearchVerse] = useState<VerseRef | null>(null);
  if (searchVerse !== prevSearchVerse) {
    setPrevSearchVerse(searchVerse);
    if (searchVerse) {
      const b = books[searchVerse.bookIndex];
      setInputVal(`${b.ko} ${searchVerse.chapter}:${searchVerse.verse}`);
    } else {
      setInputVal('');
    }
  }

  // 2. Click Outside 이벤트 바인딩 (자동완성 창 닫기)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowPopup(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 3. 입력 변화에 따른 실시간 제안 리스트업
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputVal(val);
    setFocusedIndex(-1);

    if (val.trim()) {
      const list = getSuggestions(val);
      setSuggestions(list);
      setShowPopup(true);
    } else {
      setSuggestions([]);
      setShowPopup(false);
      onClear();
    }
  };

  // 4. 특정 제안 항목 선택 처리
  const handleSelectSuggest = (item: AutocompleteSuggest) => {
    const b = books[item.bookIndex];
    const ch = item.chapter ?? 1;
    const vs = item.verse ?? 1;

    setInputVal(`${b.ko} ${ch}:${vs}`);
    setShowPopup(false);
    onSearch(item.bookIndex, ch, vs);
  };

  // 5. 키보드 인터랙션 지원 (ArrowUp, ArrowDown, Enter, Escape)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setShowPopup(false);
      inputRef.current?.blur();
      return;
    }

    if (showPopup && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < suggestions.length) {
          handleSelectSuggest(suggestions[focusedIndex]);
        } else {
          // 포커싱된 항목이 없다면 현재 텍스트 직접 파싱 시도
          executeDirectSearch();
        }
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      executeDirectSearch();
    }
  };

  // 6. 직접 파싱을 통한 검색 실행 헬퍼
  const executeDirectSearch = () => {
    if (!inputVal.trim()) return;
    const parsed = parseQuickVerse(inputVal);
    if (parsed) {
      const ch = parsed.chapter ?? 1;
      const vs = parsed.verse ?? 1;
      const b = books[parsed.bookIndex];
      
      setInputVal(`${b.ko} ${ch}:${vs}`);
      setShowPopup(false);
      onSearch(parsed.bookIndex, ch, vs);
    }
  };

  // 7. 검색어 전체 초기화
  const handleClear = () => {
    setInputVal('');
    setSuggestions([]);
    setShowPopup(false);
    setFocusedIndex(-1);
    onClear();
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* 검색 입력 상자 */}
      <div className="relative flex items-center w-full">
        <div className="absolute left-3.5 text-slate-400 pointer-events-none transition-colors group-focus-within:text-emerald-400">
          <Search className="w-4 h-4" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (inputVal.trim() && suggestions.length > 0) {
              setShowPopup(true);
            }
          }}
          placeholder="성경 구절 검색 (예: 창 1:1, 요3:16, ㅊㅅㄱ 1 1, Gen 1:1)..."
          className="w-full pl-10 pr-10 py-1.5 bg-slate-900/60 hover:bg-slate-900/90 focus:bg-slate-950 border border-slate-800 focus:border-emerald-500/80 text-xs text-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder-slate-500 font-medium"
        />

        {inputVal && (
          <button
            onClick={handleClear}
            className="absolute right-3 p-0.5 text-slate-500 hover:text-rose-400 rounded-lg transition-colors"
            title="검색어 지우기"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 실시간 지능형 자동완성 팝업 (Glassmorphism + Premium UI) */}
      {showPopup && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 mt-2 z-[60] bg-[#0c1224]/90 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-2xl shadow-emerald-950/20 max-h-64 overflow-y-auto divide-y divide-slate-800/40 animate-in fade-in slide-in-from-top-2 duration-150">
          {suggestions.map((item, idx) => {
            const isFocused = idx === focusedIndex;
            return (
              <div
                key={idx}
                onClick={() => handleSelectSuggest(item)}
                onMouseEnter={() => setFocusedIndex(idx)}
                className={`flex items-center justify-between px-4 py-2.5 cursor-pointer transition-all ${
                  isFocused 
                    ? 'bg-gradient-to-r from-emerald-500/10 to-blue-500/10 text-white' 
                    : 'text-slate-300 hover:bg-slate-900/30'
                }`}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold tracking-tight">
                    {item.displayText}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {item.displaySubText}
                  </span>
                </div>
                {isFocused && (
                  <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                    선택 <CornerDownLeft className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
