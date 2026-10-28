# 지구인 DNA+S 성과 발표회

보고서 표지의 밝은 색상과 둥근 글씨에서 영감을 받은 반응형 성과 공유 페이지입니다. Firebase Firestore + Vercel API로 공동 저장하며, 설정 전에는 로컬 JSON 파일로 동작합니다. 외부 패키지 설치가 필요 없습니다.

## 로컬 실행

Node.js 22 이상에서 프로젝트 폴더의 터미널을 열고 실행하세요.

```sh
npm run dev
```

브라우저에서 http://127.0.0.1:3000 으로 접속합니다. 우측 상단 **편집자 로그인**에서 `dna`를 입력하세요. 편집 세션은 8시간 유지됩니다.

- 지속가능성 / 지구환경 / 인공지능 영역을 선택합니다.
- 편집자는 프로젝트 제목, 여섯 역량(중복 선택), D·N·A 내용, 외부 자료 링크를 등록·수정·삭제할 수 있습니다.
- 방문자는 로그인 없이 열람·검색할 수 있습니다. 자료 링크는 새 탭에서 열립니다.
- 최초 로컬 화면의 ‘구성 예시’는 보고서의 주제를 참고해 작성한 예시이며 실제 성과 게시물이 아닙니다. 첫 등록 시 숨겨집니다. 게시물을 모두 삭제하면 다시 나타납니다. Firebase 모드에는 예시가 표시되지 않습니다.
- 로컬 게시물은 `.data/projects.json`에 저장됩니다. 브라우저를 다시 열어도 유지되며 Git에는 포함되지 않습니다. Firebase로 자동 이전되지 않으므로 실제 자료 등록은 Firebase 연결 후 진행하세요.

## Firebase 연결

1. [Firebase 콘솔](https://console.firebase.google.com/)에서 프로젝트를 만들고 **Firestore Database**를 생성합니다. 기본 데이터베이스 `(default)`를 사용하세요.
2. Firestore 규칙 탭에 `firestore.rules` 내용을 적용합니다. 클라이언트의 직접 접근은 차단하고 서버의 서비스 계정만 데이터에 접근합니다.
3. Firebase 프로젝트 설정 → 서비스 계정 → 새 비공개 키 생성에서 JSON 키를 받습니다. 서비스 계정에는 `Cloud Datastore User` 권한이 필요합니다. 키 파일은 저장소에 넣지 마세요.
4. 로컬에서는 `.env.example`을 `.env`로 복사하고 아래 값을 설정합니다. Vercel에서는 프로젝트의 Environment Variables에 같은 이름으로 입력합니다.

| 변수 | 값 |
| --- | --- |
| `EDITOR_PASSWORD` | `dna` |
| `SESSION_SECRET` | 아래 명령으로 만든 임의의 64자 문자열 |
| `FIREBASE_PROJECT_ID` | 서비스 계정 JSON의 `project_id` |
| `FIREBASE_CLIENT_EMAIL` | 서비스 계정 JSON의 `client_email` |
| `FIREBASE_PRIVATE_KEY` | 서비스 계정 JSON의 `private_key` 전체. Vercel에는 따옴표 없이 붙여넣기. 실제 줄바꿈과 `\n` 표기 모두 지원 |

```sh
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

서버 재시작/재배포 후 로컬 미리보기 안내가 사라지면 Firebase 모드입니다. Firestore의 `projects` 컬렉션은 첫 등록 시 자동 생성됩니다. 모든 방문자가 같은 프로젝트를 보게 됩니다.

서버는 [Firestore REST API의 서비스 계정 인증](https://firebase.google.com/docs/firestore/use-rest-api)을 사용합니다. 서비스 계정은 Firestore 규칙 대신 IAM 권한을 따르며, 서버 API가 편집자 권한과 입력값을 검증합니다.

## GitHub → Vercel 배포

1. `.env`와 서비스 계정 키 JSON이 Git에 포함되지 않았는지 확인합니다. 기본 `.gitignore`는 `.env`, 로컬 게시물, 임시 파일을 제외합니다. 다운로드한 서비스 계정 JSON은 프로젝트 밖에 보관하세요.
2. 이 프로젝트 소스를 GitHub 저장소에 올립니다.
3. [Vercel](https://vercel.com/new)에서 GitHub 저장소를 Import합니다. Framework Preset은 **Other**, 프로젝트가 들어 있는 폴더를 Root Directory로 선택합니다.
4. Node.js는 22 이상, Build Command는 비워두고 Output Directory는 **public**으로 설정합니다. `vercel.json`에도 같은 구성이 들어 있습니다.
5. 위 환경 변수 5개를 추가한 뒤 Deploy합니다. 환경 변수를 변경하면 재배포하세요.
6. 배포 주소에서 로그인 → 등록 → 다른 브라우저에서 열람 → 수정 → 삭제를 확인합니다.

Vercel에서는 Firebase와 세션 키 설정이 빠지면 저장을 거부합니다. 임시 디스크에 게시물을 저장하지 않습니다. API 라우팅은 [Vercel rewrites](https://vercel.com/docs/routing/rewrites)와 Node.js Functions를 사용합니다.

## 구성과 검증

```text
public/           화면, 스타일, 브라우저 동작
api/index.mjs     편집자 인증과 프로젝트 API
lib/data.mjs      Firestore REST / 로컬 저장
server.mjs        개발용 서버
tests/            인증·권한·입력값·CRUD 검증
firestore.rules   클라이언트 직접 접근 차단
vercel.json       정적 페이지와 API 배포 설정
```

```sh
npm test
```

비밀번호는 브라우저 소스에 포함되지 않고 서버에서 확인합니다. 세션은 서명한 HttpOnly 쿠키를 사용하며 Vercel에서는 Secure가 적용됩니다. 교차 출처 쓰기 요청 차단, 필수 입력 검사, HTML 이스케이프, HTTP/HTTPS 링크 검사, 로그인 시도 제한이 포함됩니다. 로그인 시도 제한은 서버 인스턴스 메모리 기준입니다. 많은 이용자가 접속하는 공개 운영에서는 Vercel 방화벽 등 공유된 제한 기능을 추가하는 것을 권장합니다. 공유 비밀번호 방식이므로 편집자는 모든 게시물을 수정·삭제할 수 있습니다.

글꼴은 Google Fonts의 Jua와 Noto Sans KR을 사용하며, 연결이 되지 않으면 시스템 글꼴로 표시됩니다. 첨부받은 원본 PNG 20개는 `public/assets/labels/`에 포함되어 있으며, 제목·영역·단계·역량 표시에 사용합니다. 원본 비율과 파일 내용을 그대로 유지했습니다. 교사 이름 등은 소스에 포함하지 않았습니다.
