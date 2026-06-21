# ExamForge — 유사 시험 문제 플랫폼

영어 수능 유형 유사 문제 생성 및 시험지 제작 플랫폼입니다.

## 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

## 주요 기능

- **원본 지문 등록**: 영어 지문 + 해설(선택) 직접 입력 또는 엑셀 일괄 등록
- **유사 문제 생성**: 수능 유형별 옵션(난이도 상/중/하, 1~3문항) 선택 후 생성
- **좌우 비교 뷰**: 원본 지문과 생성 문항을 나란히 확인
- **문항 편집/재생성**: 지문·선지 편집, 개별/전체 재생성
- **문항 DB**: 생성된 문항 저장 및 검색
- **시험지 만들기**: 문항 선택 → 미리보기 → 문항 교체/순서 변경 → PDF 저장

## 엑셀 형식

| 제목 | 지문 | 해설 |
|------|------|------|
| Sample | English passage... | Optional |

템플릿은 원본 지문 페이지에서 다운로드할 수 있습니다.

## AI 연동

OpenAI는 다음 환경변수 하나만 설정하면 됩니다.

```
OPENAI_API_KEY=발급받은_키
```

공용 변수는 OpenAI 호환 API를 기본값으로 사용합니다.

```
AI_API_KEY=발급받은_키
```

Gemini 또는 Anthropic에서 공용 변수를 사용하려면 `AI_PROVIDER`도 함께
설정하세요. 로컬에서는 프로젝트 루트의 `.env.local`에 넣고 개발 서버를
재시작합니다. Vercel에서는 프로젝트의 Environment Variables에 추가한 뒤
해당 환경을 재배포해야 새 값이 적용됩니다.

API 키가 없으면 mock 생성기로 동작합니다. AI 실패 시에도 mock으로 자동 fallback됩니다.

`env.example` 파일을 참고하세요.

Next.js 16 · React 19 · TypeScript · Tailwind CSS · Pretendard · Zustand · xlsx · jsPDF
