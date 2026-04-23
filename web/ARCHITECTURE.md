# PatternFlow 랜딩페이지 v2 — 구조 정리 & 로드맵

## 현재 아키텍처

### 레이아웃 구조
```
┌──────────────────────────────────────────────┐
│              .app-layout (flex)              │
├──────────────┬───────────────────────────────┤
│ .viewer-panel│      .content-panel           │
│   (40vw)     │        (60vw)                 │
│   sticky     │                               │
│   100vh      │  ┌─ Hero ──────────────┐      │
│              │  │ Patternflow         │      │
│  ┌─────────┐ │  │ An LED synthesizer  │      │
│  │ 3D Scene│ │  └─────────────────────┘      │
│  │ (Three) │ │                               │
│  │ GLB     │ │  ┌─ Build your own ────┐      │
│  │ + LED   │ │  │ [sticky title]      │      │
│  │ shader  │ │  │ body reveals ↓      │      │
│  └─────────┘ │  └─────────────────────┘      │
│              │         ↕ 80px gap             │
│  항상 고정    │  ┌─ Inside the work ───┐      │
│  스크롤해도   │  │ [sticky title]      │      │
│  좌측에 보임  │  │ body reveals ↓      │      │
│              │  └─────────────────────┘      │
│              │                               │
│              │  ┌─ Footer ────────────┐      │
│              │  └─────────────────────┘      │
├──────────────┴───────────────────────────────┤
│  mobile (≤900px): 세로 배치                   │
│  viewer 상단 40vh sticky + 아래 콘텐츠 스크롤   │
└──────────────────────────────────────────────┘
```

### 파일 구조
```
version2/src/
├── app/
│   ├── page.tsx           # 루트: app-layout (viewer-panel + content-panel)
│   ├── layout.tsx         # Next.js 레이아웃, 폰트, 메타
│   └── globals.css        # 전체 스타일 (Tailwind v4 + 커스텀 CSS)
│
├── components/
│   ├── 3d/
│   │   ├── HeroScene.tsx  # Three.js Canvas, GLB 로더, 셰이더 머티리얼
│   │   └── patterns/
│   │       ├── common.ts  # 공유 vertex shader, PatternDef 인터페이스
│   │       ├── index.ts   # 패턴 레지스트리 (이름 → PatternDef 매핑)
│   │       └── waveTest.ts# 동심원 + 64×128 LED 픽셀화 fragment shader
│   │
│   ├── sections/
│   │   ├── Hero.tsx       # 히어로 텍스트 (3D는 viewer-panel에 분리됨)
│   │   ├── Deck.tsx       # 패널 컨테이너 (open 상태 관리)
│   │   ├── BuildPanel.tsx # "Build your own" 패널
│   │   └── InsidePanel.tsx# "Inside the work" 패널
│   │
│   ├── layout/
│   │   └── Footer.tsx
│   └── ui/
│       └── TweaksPanel.tsx
│
├── context/
│   └── ThemeContext.tsx
│
public/
└── 3dforweb.glb           # 디바이스 3D 모델 (Draco 압축)
```

---

## 핵심 기술 세부사항

### 3D 뷰어 (HeroScene.tsx)
| 항목 | 값 |
|------|-----|
| 카메라 | `position: [0, 5.7, 10.3]`, `fov: 28` |
| 조작 | OrbitControls — 줌/회전 가능, 패닝 비활성화 |
| LED 메시 | GLB 내 `name === 'l'`인 메시에 ShaderMaterial 적용 |
| 유니폼 | `uTime`, `uSpeed`, `uParam1-4`, `uAspect(2.0)` |
| 모델 | 0.1 스케일, Y축 미세 회전/부유 애니메이션 |

### LED 셰이더 (waveTest.ts)
- **64×128 LED 그리드** 픽셀화 (quantization)
- **LOD 기반 갭 표시**: `fwidth()`로 화면 픽셀 대비 LED 크기 감지
  - `fadeStart: 0.00`, `fadeEnd: 0.29` — 기본 거리에서 무아레 없음, 줌인하면 LED 갭 보임
- `uAspect: 2.0` — 1:2 비율 보정

### 패널 애니메이션
- **열림**: 타이틀 → sticky 헤더 (top:0, z-index:5), 부제 → opacity + max-height 페이드아웃
- **본문 reveal**: `grid-template-rows: 0fr → 1fr` + `clip-path: inset(0 0 100% 0) → inset(0)` (위→아래)
- **이징**: `cubic-bezier(.4,0,.2,1)` (Material Design)

### 설치된 라이브러리
- `@chenglou/pretext` — DOM 리플로우 없는 텍스트 측정 (향후 텍스트 애니메이션에 활용 예정)

---

## 향후 작업 로드맵

### Phase 1: 콘텐츠-3D 연동 시스템

> [!IMPORTANT]
> 핵심 목표: 우측 콘텐츠 섹션 전환에 따라 좌측 3D 씬이 실시간으로 반응

#### 1-1. Build Your Own 서브섹션 분할
현재 BuildPanel 내 내용을 4개 서브섹션으로 구조화:

| 서브섹션 | 내용 | 3D 씬 변화 |
|---------|------|-----------|
| **Case** | 3D 프린팅 케이스 | 케이스만 하이라이트, 나머지 투명 처리 |
| **PCB** | 기판 / 부품 | PCB 레이어 분리 뷰 (exploded) |
| **Assembly** | 조립 가이드 | 부품이 순서대로 조립되는 애니메이션 |
| **Firmware** | 웹 플래셔 | LED 매트릭스에 패턴 전환 데모 |

#### 1-2. 3D 모델 분리 (Exploded View)
- GLB 모델의 각 파트를 개별 메시로 분리
- 서브섹션 진입 시 해당 파트만 살짝 펼쳐지는 애니메이션
- `Three.js` 그룹 position/rotation을 서브섹션 인덱스에 따라 lerp

#### 1-3. 스크롤/섹션 기반 씬 매니저
```
새로 필요한 파일:
├── components/3d/
│   ├── SceneManager.tsx    # 섹션 상태에 따라 3D 씬 전환 관리
│   ├── ExplodedDevice.tsx  # 분해도 뷰 컴포넌트
│   └── patterns/
│       ├── (기존 패턴들)
│       └── (ESP32 기반 실제 패턴 추가)
```

### Phase 2: 패턴 커스터마이징
- 우측 패널에서 패턴 선택 UI
- `uParam1-4` 슬라이더로 실시간 파라미터 조절
- 좌측 3D LED 매트릭스에 즉시 반영
- ESP32 C++ 코드 기반 실제 패턴들을 GLSL로 포팅

### Phase 3: Pretext 텍스트 애니메이션
- 섹션 전환 시 텍스트 높이를 사전 계산 (layout shift 방지)
- 타이틀/본문 텍스트의 부드러운 위치 전환 애니메이션
- 반응형 레이아웃에서 텍스트 리플로우 없이 정확한 높이 예측

### Phase 4: 프로덕션 마무리
- OrbitControls 잠금 (줌/회전 비활성화)
- 성능 최적화 (LOD, 텍스처 압축)
- SEO 메타 태그, OG 이미지
- Vercel 배포 설정

---

## 주의사항

> [!WARNING]
> - 현재 OrbitControls는 디버깅용으로 줌/회전 활성화 상태. 프로덕션 전 잠금 필요
> - `@import "tailwindcss"` (v4)가 CSS 우선순위에 영향. 커스텀 CSS 변경 시 미디어쿼리 내 중복 규칙 주의
> - Blender UV: 메시 `l`의 앞면만 UV 0~1 범위, 나머지 면들은 범위 밖으로 밀어놓은 상태
