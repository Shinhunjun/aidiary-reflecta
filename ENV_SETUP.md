# 환경 설정 가이드 (Environment Setup Guide)

## 개요

이 프로젝트는 **개발(Development)**과 **배포(Production)** 환경을 분리하여 관리합니다.

## 파일 구조

```
reflecta-backend/
  ├── .env                    # Git ignored - 로컬 개발용 (자동 사용)
  ├── .env.development       # 개발 환경 설정 (git에 커밋 가능)
  └── .env.production        # 배포 환경 설정 (git에 커밋 가능)

reflecta-frontend/
  ├── .env                    # Git ignored - 로컬 개발용
  ├── .env.development       # 개발 환경 설정
  └── .env.production        # 배포 환경 설정
```

## 사용 방법

### Backend

#### 1. 개발 환경 (로컬 개발)
```bash
cd reflecta-backend

# 방법 1: npm script 사용 (추천)
npm run dev              # 개발 환경으로 실행
npm run dev:watch        # nodemon으로 자동 재시작

# 방법 2: .env 파일 복사
cp .env.development .env
npm start
```

#### 2. 배포 환경 (테스트용)
```bash
cd reflecta-backend

# 배포 환경 설정으로 로컬에서 테스트
npm run prod

# 또는
cp .env.production .env
npm start
```

#### 3. GCP Cloud Run 배포
```bash
# .env.yaml 사용 (GCP용)
gcloud run deploy reflecta-backend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --env-vars-file .env.yaml \
  --port 5000
```

### Frontend

#### 1. 개발 환경 (로컬 개발)
```bash
cd reflecta-frontend

# Create React App은 자동으로 .env.development 사용
npm start   # 자동으로 .env.development 로드
```

#### 2. 배포 환경 (Vercel)
```bash
# Vercel은 자동으로 .env.production 사용
npm run build   # 자동으로 .env.production 로드

# Vercel 대시보드에서도 환경 변수 설정 가능
```

## 주요 차이점

### Backend

| 항목 | Development | Production |
|------|-------------|------------|
| PORT | 5001 | 5000 |
| MONGODB_URI | Atlas (동일) | Atlas (동일) |
| CORS_ORIGIN | http://localhost:3000 | https://aidiary-reflecta.vercel.app |
| NODE_ENV | development | production |

### Frontend

| 항목 | Development | Production |
|------|-------------|------------|
| REACT_APP_API_URL | http://localhost:5001/api | https://reflecta-backend-762303020827.us-central1.run.app/api |
| REACT_APP_DEBUG_MODE | true | false |

## 환경 변수 우선순위

Create React App (Frontend):
```
1. .env.development.local    (최우선, git ignored)
2. .env.development          (npm start 시)
3. .env.local                (git ignored)
4. .env
```

Node.js (Backend):
```
1. 시스템 환경 변수 (export PORT=5001)
2. .env 파일
3. 코드의 기본값 (process.env.PORT || 5001)
```

## 베스트 프랙티스

### ✅ 해야 할 것

1. **민감한 정보는 .env에만 저장** (API keys, secrets)
   - `.env.development`와 `.env.production`에는 **dummy 값** 또는 **공개 가능한 값**만

2. **환경별 파일 사용**
   - 로컬 개발: `npm run dev`
   - 배포 테스트: `npm run prod`

3. **Git에 커밋하지 말아야 할 파일**
   ```
   .env
   .env.local
   .env.*.local
   .env.backup
   ```

4. **팀원들을 위한 템플릿**
   - `.env.development`와 `.env.production`은 템플릿으로 커밋 가능
   - 실제 비밀 값은 각자 로컬 `.env`에 설정

### ❌ 하지 말아야 할 것

1. `.env` 파일을 Git에 커밋하지 마세요
2. Production secrets를 개발 환경에 사용하지 마세요
3. API keys를 코드에 하드코딩하지 마세요

## 트러블슈팅

### 문제: "Port 5000 already in use"
**해결:** macOS AirPlay가 5000 포트 사용 중
```bash
# 방법 1: 개발 환경 사용 (포트 5001)
npm run dev

# 방법 2: AirPlay 비활성화
# 시스템 환경설정 → 공유 → AirPlay 수신 OFF
```

### 문제: 환경 변수가 적용되지 않음
**해결:**
```bash
# Backend: 서버 재시작 필요
pkill -f "node.*server.js"
npm run dev

# Frontend: 재빌드 필요 (.env 변경 시)
# Ctrl+C 후
npm start
```

### 문제: MongoDB 연결 실패
**해결:**
```bash
# .env.development의 MONGODB_URI 확인
cat .env.development | grep MONGODB_URI

# Atlas IP whitelist 확인 (0.0.0.0/0 허용되어 있는지)
```

## 빠른 시작 (Quick Start)

```bash
# 1. Backend 시작
cd reflecta-backend
npm run dev              # 포트 5001, Atlas DB

# 2. Frontend 시작 (새 터미널)
cd reflecta-frontend
npm start                # 포트 3000, localhost:5001 API 호출

# 3. 브라우저
# http://localhost:3000
```

## 더 알아보기

- [dotenv 문서](https://github.com/motdotla/dotenv)
- [Create React App 환경 변수](https://create-react-app.dev/docs/adding-custom-environment-variables/)
- [Node.js 환경 변수 베스트 프랙티스](https://nodejs.dev/learn/how-to-read-environment-variables-from-nodejs)
