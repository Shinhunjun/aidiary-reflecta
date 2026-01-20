# GCP Gemini API 설정 가이드 (교육용 Credit 사용)

## 1단계: Generative Language API 활성화

1. GCP Console의 API Library 페이지로 이동:

   ```
   https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com?project=ultimate-bit-478920-i7
   ```

2. **"사용 설정"** 또는 **"ENABLE"** 버튼 클릭

3. API가 활성화될 때까지 기다림 (보통 몇 초 소요)

## 2단계: API Key 생성

### 방법 1: GCP Console (추천)

1. 사용자 인증 정보 페이지로 이동:

   ```
   https://console.cloud.google.com/apis/credentials?project=ultimate-bit-478920-i7
   ```

2. **"+ 사용자 인증 정보 만들기"** 클릭

3. **"API 키"** 선택

4. API 키가 생성됨 - **복사**해두기

5. (선택사항) **"키 제한"** 클릭:
   - "API 제한사항" 선택
   - "Generative Language API"만 선택
   - 저장

### 방법 2: Google AI Studio (더 간단)

1. Google AI Studio로 이동:

   ```
   https://aistudio.google.com/app/apikey
   ```

2. **"Create API key"** 클릭

3. 프로젝트 선택: `ultimate-bit-478920-i7`

4. API 키 복사

## 3단계: .env 파일 설정

1. 백엔드 폴더로 이동:

   ```bash
   cd reflecta-backend
   ```

2. `.env` 파일 편집 (없으면 생성):

   ```bash
   nano .env
   # 또는
   code .env
   ```

3. 다음 내용 추가/수정:

   ```bash
   # MongoDB Connection
   MONGODB_URI=mongodb://localhost:27017/reflecta
   
   # JWT Secret
   JWT_SECRET=a8f5f167f44f4964e6c998dee827110c
   
   # Server Port
   PORT=5000
   
   # CORS Origin
   CORS_ORIGIN=http://localhost:3000
   
   # OpenAI API Configuration (기존 기능용)
   OPENAI_API_KEY=your_openai_api_key_here
   OPENAI_API_URL=https://api.openai.com/v1/chat/completions
   
   # Gemini API Configuration (여기에 발급받은 키 입력!)
   GEMINI_API_KEY=AIza...여기에_실제_키_붙여넣기
   
   # WebSocket Configuration
   WS_PORT=5001
   ```

4. 파일 저장

## 4단계: 서버 실행 및 테스트

```bash
# 백엔드 시작
cd reflecta-backend
npm run dev
```

예상 출력:

```
MongoDB connected successfully
HTTP Server running on port 5001
WebSocket Server available at ws://localhost:5001/ws/gemini-live
```

## 비용 관련

- **교육용 Credit** 사용으로 과금됨
- Gemini 2.0 Flash 가격: 약 $0.075 / 1M input tokens
- 일반적인 대화: 토큰 수백~수천 개 정도
- Credit 잔액은 GCP Console의 Billing 섹션에서 확인 가능

---

API Key를 발급받고 `.env`에 추가했으면 알려주세요!
