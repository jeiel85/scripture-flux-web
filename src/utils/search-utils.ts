// 성경 66권 초성 추출 및 지능형 구절 파싱 유틸리티

import books from '../data/books.json';

// 한글 초성 매칭 리스트
const CHOSEONG_LIST = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];

/**
 * 한글 문자열에서 초성을 추출합니다. (예: "창세기" -> "ㅊㅅㄱ")
 */
export function getChoseong(text: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    // 한글 유니코드 영역 (가 ~ 힣)
    if (code >= 0xac00 && code <= 0xd7a3) {
      const choseongIndex = Math.floor((code - 0xac00) / 28 / 21);
      result += CHOSEONG_LIST[choseongIndex];
    } else {
      // 한글이 아니면 그대로 유지
      result += text.charAt(i);
    }
  }
  return result;
}

// 66권 전통적/현대적 성경 한글 약칭 맵
const KOREAN_ABBREVIATIONS: { [key: string]: number } = {
  '창': 0, '창세': 0,
  '출': 1, '출애': 1,
  '레': 2, '레위': 2,
  '민': 3, '민수': 3,
  '신': 4, '신명': 4,
  '수': 5, '여호': 5, '여호수아': 5,
  '삿': 6, '사사': 6,
  '룻': 7,
  '삼상': 8, '사상': 8, '사무엘상': 8,
  '삼하': 9, '사하': 9, '사무엘하': 9,
  '왕상': 10, '열상': 10, '열왕기상': 10,
  '왕하': 11, '열하': 11, '열왕기하': 11,
  '대상': 12, '역상': 12, '역대기상': 12,
  '대하': 13, '역하': 13, '역대기하': 13,
  '스': 14, '에스라': 14,
  '느': 15, '느헤': 15,
  '에': 16, '에스더': 16, // 에스겔과 겹치므로 약어 처리 보강 필요
  '욥': 17,
  '시': 18, '시편': 18,
  '잠': 19, '잠언': 19,
  '전': 20, '전도': 20,
  '아': 21, '아가': 21,
  '사': 22, '이사': 22, '이사야': 22,
  '렘': 23, '예레': 23, '예레미야': 23,
  '애': 24, '예레미야애가': 24, '렘애': 24,
  '겔': 25, '에스겔': 25,
  '단': 26, '다니': 26,
  '호': 27, '호세': 27,
  '욜': 28, '요엘': 28,
  '암': 29, '아모': 29,
  '옵': 30, '오바': 30, '오바디야': 30,
  '욘': 31, '요나': 31,
  '미': 32, '미가': 32,
  '나': 33, '나훔': 33,
  '합': 34, '하박': 34, '하박국': 34,
  '습': 35, '스바': 35, '스바니야': 35,
  '학': 36, '학개': 36,
  '슥': 37, '스가': 37, '스가랴': 37,
  '말': 38, '말라': 38,
  '마': 39, '마태': 39,
  '막': 40, '마가': 40,
  '눅': 41, '누가': 41,
  '요': 42, '요한': 42, // 요한일/이/삼서, 요한계시록과 구분 필요
  '행': 43, '사도': 43, '사도행전': 43,
  '롬': 44, '로마': 44,
  '고전': 45, '고린도전서': 45,
  '고후': 46, '고린도후서': 46,
  '갈': 47, '갈라': 47,
  '엡': 48, '에베': 48, '에베소서': 48,
  '빌': 49, '빌립': 49, '빌립보서': 49,
  '골': 50, '골로': 50, '골로새서': 50,
  '살전': 51, '데살로니가전서': 51,
  '살후': 52, '데살로니가후서': 52,
  '딤전': 53, '디모데전서': 53,
  '딤후': 54, '디모데후서': 54,
  '딛': 55, '디도': 55,
  '몬': 56, '빌레': 56, '빌레몬서': 56,
  '히': 57, '히브': 57, '히브리서': 57,
  '약': 58, '야고': 58, '야고보서': 58,
  '벧전': 59, '베드로전서': 59,
  '벧후': 60, '베드로후서': 60,
  '요일': 61, '요한일서': 61,
  '요이': 62, '요한이서': 62,
  '요삼': 63, '요한삼서': 63,
  '유': 64, '유다': 64,
  '계': 65, '계시': 65, '요한계시록': 65, '계시록': 65
};

export interface ParsedVerse {
  bookIndex: number;
  chapter?: number;
  verse?: number;
}

/**
 * 사용자가 자유롭게 입력한 문자열을 분석하여 책 인덱스, 장, 절을 파싱합니다.
 * 지원 형식: "창 1:1", "창 1 1", "Gen 1:1", "John 3 16", "요한일서 1:9", "ㅊㅅㄱ 1 1"
 */
export function parseQuickVerse(query: string): ParsedVerse | null {
  const trimmed = query.trim().replace(/\s+/g, ' ');
  if (!trimmed) return null;

  // 정규식: [책 이름/초성/영어] + [숫자(장)] + [구분자(: 또는 공백)] + [숫자(절)]
  // 예: "1Sa 3 4", "창 1:2", "창 1", "창세기"
  const regex = /^([a-zA-Z가-힣ㄱ-ㅎ0-9\s]+?)\s*(\d+)?(?:\s*[:\s-]\s*(\d+))?$/;
  const match = trimmed.match(regex);

  if (!match) return null;

  const bookPart = match[1].trim();
  const chPart = match[2] ? parseInt(match[2], 10) : undefined;
  const vsPart = match[3] ? parseInt(match[3], 10) : undefined;

  const bookIndex = findBookIndex(bookPart);
  if (bookIndex === -1) return null;

  return {
    bookIndex,
    chapter: chPart,
    verse: vsPart
  };
}

/**
 * 입력된 텍스트를 기준으로 66권 중 매칭되는 책 인덱스를 추적합니다.
 */
export function findBookIndex(query: string): number {
  const normQuery = query.toLowerCase().replace(/\s+/g, '');
  if (!normQuery) return -1;

  // 1. 약칭 맵에서 다이렉트 매칭 시도
  if (KOREAN_ABBREVIATIONS[normQuery] !== undefined) {
    return KOREAN_ABBREVIATIONS[normQuery];
  }

  // 2. 66권 정밀 메타데이터 순회
  for (const b of books) {
    const koName = b.ko.toLowerCase().replace(/\s+/g, '');
    const enName = b.en.toLowerCase().replace(/\s+/g, '');
    const osisName = b.osis.toLowerCase();
    const idName = b.id.toLowerCase();

    // 완벽 일치 또는 포함 비교
    if (
      koName === normQuery || 
      enName === normQuery || 
      osisName === normQuery || 
      idName === normQuery
    ) {
      return b.index;
    }
  }

  // 3. 한글 초성 매칭 시도 (한글 초성 검색어도 지원)
  const queryChoseong = getChoseong(normQuery);
  for (const b of books) {
    const koChoseong = getChoseong(b.ko.toLowerCase().replace(/\s+/g, ''));
    if (koChoseong === queryChoseong || koChoseong.startsWith(queryChoseong)) {
      return b.index;
    }
  }

  // 4. 한글/영어 부분 매칭
  for (const b of books) {
    const koName = b.ko.toLowerCase().replace(/\s+/g, '');
    const enName = b.en.toLowerCase().replace(/\s+/g, '');
    if (koName.includes(normQuery) || enName.includes(normQuery)) {
      return b.index;
    }
  }

  return -1;
}

export interface AutocompleteSuggest {
  bookIndex: number;
  koName: string;
  enName: string;
  chapter?: number;
  verse?: number;
  displayText: string;
  displaySubText: string;
}

/**
 * 실시간 자동완성 제안 목록을 생성합니다.
 */
export function getSuggestions(query: string): AutocompleteSuggest[] {
  const clean = query.trim();
  if (!clean) return [];

  // 일단 퀵 파서로 파싱을 시도
  const parsed = parseQuickVerse(clean);
  if (!parsed) {
    // 파싱이 안 된다면 텍스트 매칭으로 책 후보군만 제안
    const matchedBooks: AutocompleteSuggest[] = [];
    const norm = clean.toLowerCase().replace(/\s+/g, '');
    const queryCh = getChoseong(norm);

    for (const b of books) {
      const ko = b.ko;
      const en = b.en;
      const koNorm = ko.toLowerCase().replace(/\s+/g, '');
      const enNorm = en.toLowerCase().replace(/\s+/g, '');
      const koCh = getChoseong(koNorm);

      const isMatch = 
        koNorm.includes(norm) || 
        enNorm.includes(norm) || 
        koCh.startsWith(queryCh) ||
        b.id.toLowerCase().startsWith(norm) ||
        b.osis.toLowerCase().startsWith(norm);

      if (isMatch) {
        matchedBooks.push({
          bookIndex: b.index,
          koName: ko,
          enName: en,
          displayText: ko,
          displaySubText: `${en} (${b.testament === 'OT' ? '구약' : '신약'})`
        });
      }

      if (matchedBooks.length >= 6) break;
    }
    return matchedBooks;
  }

  // 파싱에 성공했다면, 정밀한 구절 단위 제안
  const b = books[parsed.bookIndex];
  const results: AutocompleteSuggest[] = [];

  if (parsed.chapter !== undefined && parsed.verse !== undefined) {
    // 책 장 절이 모두 있는 경우
    results.push({
      bookIndex: parsed.bookIndex,
      koName: b.ko,
      enName: b.en,
      chapter: parsed.chapter,
      verse: parsed.verse,
      displayText: `${b.ko} ${parsed.chapter}:${parsed.verse}`,
      displaySubText: `${b.en} ${parsed.chapter}:${parsed.verse}`
    });
  } else if (parsed.chapter !== undefined) {
    // 책 장만 있는 경우
    results.push({
      bookIndex: parsed.bookIndex,
      koName: b.ko,
      enName: b.en,
      chapter: parsed.chapter,
      displayText: `${b.ko} ${parsed.chapter}장`,
      displaySubText: `${b.en} Chapter ${parsed.chapter}`
    });
  } else {
    // 책만 있는 경우
    results.push({
      bookIndex: parsed.bookIndex,
      koName: b.ko,
      enName: b.en,
      displayText: b.ko,
      displaySubText: `${b.en} (${b.testament === 'OT' ? '구약' : '신약'})`
    });
  }

  return results;
}
