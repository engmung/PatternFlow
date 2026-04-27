# Releasing Patternflow

이 문서는 Patternflow 프로젝트의 버전 관리 및 릴리스 절차를 정의한다.
Firmware, Hardware, Web, Docs 네 영역의 서로 다른 리듬을 하나의 규칙
체계 안에서 다룬다.

> 이 문서는 "어떻게 릴리스하는가"를 규정한다. "무엇을 릴리스할지"는
> [ROADMAP.md](./ROADMAP.md)와 [CHANGELOG.md](../CHANGELOG.md)를 참조.

---

## 0. 핵심 원칙

1. **자주, 작게 릴리스한다.** 완벽을 기다리지 않는다.
2. **버전 번호는 사용자에게 약속이다.** Semantic Versioning을 따른다.
3. **CHANGELOG는 사용자를 위한 문서다.** 커밋 로그와 다르다.
4. **하나의 릴리스는 하나의 정의된 영역에 속한다.** 영역이 섞이는
   복합 릴리스는 별도로 표기한다.

---

## 1. 영역별 버전 체계

Patternflow는 네 개의 독립 영역을 갖는다. 각 영역은 자체 버전
시퀀스를 가지며, 태그 prefix로 구분한다.

| 영역      | 태그 형식         | 예시              | 변경 빈도   |
| --------- | ----------------- | ----------------- | ----------- |
| Firmware  | `fw-vX.Y.Z`       | `fw-v1.1.0`       | 자주        |
| Hardware  | `hw-vX.Y`         | `hw-v1.0`         | 드물게      |
| Web       | `web-vX.Y.Z`      | `web-v0.3.0`      | 자주        |
| Project   | `vX.Y.Z`          | `v1.1.0`          | 분기 단위   |

> **Project 태그**는 위 세 영역의 특정 조합이 함께 의미 있는
> 마일스톤을 이룰 때 부여한다. 예: "v1.1.0 = fw-v1.1.0 + web-v0.3.0의
> 묶음 = 첫 멀티패턴 릴리스."

### 1-1. Firmware 버전 정책

**`fw-vMAJOR.MINOR.PATCH`** — Semantic Versioning 엄격 적용.

- **PATCH (`fw-v1.1.1`)**: 버그 수정, 성능 미세 조정.
  사용자 동작에 변화 없음.
  - 예: 노브 디바운스 시간 미세 조정, 색 LUT 정확도 개선

- **MINOR (`fw-v1.2.0`)**: 새 패턴 추가, 새 기능 추가, 기존 호환 유지.
  - 예: 새 패턴 Voronoi 추가, WiFi Manager 도입, OTA 추가

- **MAJOR (`fw-v2.0.0`)**: 호환 깨짐. 핀맵 변경, 인터랙션 모델
  변경, 하드웨어 v2 의존.
  - 예: hw-v2.0과만 호환, 노브 매핑 전면 재설계

### 1-2. Hardware 버전 정책

**`hw-vMAJOR.MINOR`** — PATCH 없음. 하드웨어는 한 번 만들면
패치가 어렵기 때문.

- **MINOR (`hw-v1.1`)**: 같은 PCB에 부품/실크 변경, 케이스 외형
  소폭 수정. 같은 펌웨어 호환.
  - 예: EN-GND 캡 추가, 0805 vs 0603 실크 명확화

- **MAJOR (`hw-v2.0`)**: PCB 재설계, 핀맵 변경, 케이스 형태 변경.
  새 펌웨어 빌드 필요.
  - 예: 벽걸이 형태로 재설계, 디스플레이 크기 변경

### 1-3. Web 버전 정책

**`web-vMAJOR.MINOR.PATCH`** — Firmware와 동일한 SemVer 규칙.

- **PATCH**: 텍스트 수정, 스타일 미세 조정, 버그 수정
- **MINOR**: 새 섹션 추가, 새 기능(예: 패턴 미리보기) 추가
- **MAJOR**: 정보 구조 전면 개편, 도메인 변경

> Web의 v1.0.0은 "공개 가치가 있는 첫 완성 상태"로 정의한다.
> 현재(v0.x)는 모두 pre-release 단계로 본다.

### 1-4. Project 버전 정책

**`vMAJOR.MINOR.PATCH`** — 마일스톤 묶음.

특정 시점에 Firmware/Hardware/Web의 의미 있는 조합이 완성되었을 때
부여한다. CHANGELOG 최상단 헤더는 항상 Project 버전.

- **v1.0.0** = fw-v1.0.0 + hw-v1.0 = "처음 만들 수 있는 상태"
- **v1.1.0** = fw-v1.1.0 + web의 통합 flasher = "멀티 패턴 단일 펌웨어"
- **v1.2.0 (예정)** = fw-v1.2.0 + web 미리보기 swap = "패턴 갤러리"
- **v2.0.0 (먼 미래)** = hw-v2.0 + 라이브 스트리밍 = "듀얼 모드"

---

## 2. 릴리스 시점 결정

> "이거 릴리스할 만한가?"라는 질문에 답하는 기준.

### 2-1. 릴리스해도 되는 조건

다음 셋이 모두 충족되면 릴리스한다:

1. **기능이 작동한다.** 의도한 변경이 실제로 동작.
2. **회귀가 없다.** 기존 기능이 망가지지 않았다.
3. **사용자가 적용 방법을 안다.** 안내가 한 줄이라도 있다.

UI 완성도, 코드의 우아함, 다른 영역의 동기화 — 이런 건 릴리스 조건이
**아니다**. 다음 릴리스에서 개선하면 된다.

### 2-2. Pre-release를 쓰는 경우

기능은 동작하지만 위 조건 중 하나가 약할 때:

- `fw-v1.2.0-alpha.1`: 내부 테스트용. 외부 공개 사용 비권장.
- `fw-v1.2.0-beta.1`: 외부 테스터에게 공개. 피드백 수렴 단계.
- `fw-v1.2.0-rc.1`: Release Candidate. 큰 문제 없으면 정식 릴리스.

GitHub Release 생성 시 "Set as a pre-release" 체크박스를 켠다.

### 2-3. 릴리스하지 말아야 할 경우

- 메인 시나리오가 동작하지 않는다 (예: 부팅 실패, 핵심 패턴 깨짐)
- 보안 문제가 있다 (예: 코드에 하드코딩된 비밀번호)
- 빌드가 실패한다

이런 상태는 commit으로는 둘 수 있지만 **태그를 붙이지 않는다**.

---

## 3. 영역별 릴리스 절차

### 3-1. Firmware 릴리스

```
[ ] 1. 코드 변경 완료, 로컬에서 빌드 통과
[ ] 2. 실제 디바이스에서 동작 확인
[ ] 3. 회귀 테스트: 기존 패턴들 전부 정상 동작
[ ] 4. 아두이노 IDE → Sketch → Export Compiled Binary
[ ] 5. .bin 3개를 web/public/flash/bin/v{X.Y.Z}/ 에 복사
       - patternflow_v1.ino.bin
       - patternflow_v1.ino.bootloader.bin
       - patternflow_v1.ino.partitions.bin
[ ] 6. web/public/flash/manifest.json 업데이트
       - version 필드
       - parts의 path
[ ] 7. CHANGELOG.md 업데이트
       - 새 섹션: ## [fw-v{X.Y.Z}] — YYYY-MM-DD
       - 카테고리: Added / Changed / Fixed / Removed
[ ] 8. README의 버전 표기 갱신 (해당하는 경우)
[ ] 9. Git
       git add .
       git commit -m "Release fw-v{X.Y.Z}: {짧은 요약}"
       git tag fw-v{X.Y.Z}
       git push origin main --tags
[ ] 10. GitHub Releases에서 새 릴리스 생성
        - Tag: fw-v{X.Y.Z}
        - Title: "Firmware v{X.Y.Z} — {부제}"
        - Body: CHANGELOG의 해당 섹션 복사
        - Attach: .bin 3개 (선택, 백업용)
[ ] 11. 웹사이트의 Flash 버튼이 새 manifest를 가리키는지 확인
[ ] 12. 마지막 검증: 깨끗한 디바이스에 굽기 테스트
```

### 3-2. Hardware 릴리스

```
[ ] 1. KiCad 프로젝트에서 ERC/DRC 통과
[ ] 2. Gerber/STL 파일 생성, hardware/ 디렉토리에 정리
[ ] 3. 가능하다면 실물 제작 검증 (PCBway 1매라도 발주)
[ ] 4. docs/BUILD.md 업데이트 — BOM, 조립 절차
[ ] 5. CHANGELOG.md 업데이트
[ ] 6. Git
       git tag hw-v{X.Y}
       git push origin main --tags
[ ] 7. GitHub Releases 생성, Gerber zip 첨부
[ ] 8. Firmware의 호환성 표 업데이트 (필요 시)
```

### 3-3. Web 릴리스

```
Vercel/Cloudflare가 자동 배포하므로 별도 빌드 단계 없음.

[ ] 1. 로컬에서 npm run build 통과 확인
[ ] 2. 주요 라우트 수동 점검 (홈, Build, Pattern, Inside)
[ ] 3. 모바일 뷰 확인
[ ] 4. CHANGELOG.md의 [Web] 섹션 업데이트
[ ] 5. Git tag web-v{X.Y.Z}
[ ] 6. main 브랜치 push → 자동 배포
[ ] 7. 배포 후 라이브 사이트에서 확인
```

> Web은 변경 빈도가 높아 모든 변경에 태그를 붙이지 않는다.
> 의미 있는 묶음(예: 새 섹션 추가, 디자인 갱신, 기능 추가)에만 태그.

### 3-4. Project 릴리스

여러 영역의 변경이 한 마일스톤을 이룰 때.

```
[ ] 1. 포함될 각 영역 릴리스가 모두 완료된 상태
[ ] 2. CHANGELOG.md에 ## [v{X.Y.Z}] 섹션 작성
       - 도입 문단: 이 마일스톤이 무엇인지
       - 영역별 변경사항을 묶어서 정리
[ ] 3. README.md 갱신
       - 상단 버전 표시
       - 새 기능이 사용자 동작을 바꿨다면 반영
[ ] 4. Git tag v{X.Y.Z}
[ ] 5. GitHub Releases — 다른 영역 태그들을 본문에 링크
       예: "Includes [fw-v1.1.0](...) and [web-v0.3.0](...)"
[ ] 6. 외부 발표 (선택)
       - Reddit, Twitter, Discord, Instagram
       - 새 미디어 자산 (영상/스샷) 준비
```

---

## 4. CHANGELOG 작성 규칙

[Keep a Changelog](https://keepachangelog.com/) 형식을 따른다.

### 4-1. 카테고리

각 릴리스 안에서 변경사항을 다음 카테고리로 분류:

- **Added** — 새 기능
- **Changed** — 기존 기능의 변경
- **Deprecated** — 곧 제거될 기능
- **Removed** — 제거된 기능
- **Fixed** — 버그 수정
- **Security** — 보안 관련

영역별로 더 분류해도 좋다 (Firmware/Hardware/Web).

### 4-2. 항목 작성

- **사용자 관점에서** 쓴다. "리팩터링했음"보다 "패턴 전환이 부드러워짐".
- **한 줄 요약 + 필요시 짧은 부연**.
- **PR/Issue 번호** 가능하면 링크.
- **Breaking change**는 ⚠️ 또는 별도 섹션으로 강조.

### 4-3. 좋은 항목 / 나쁜 항목

❌ 나쁨:
```
- Refactored input handling
- Updated dependencies
- Code cleanup
```

✅ 좋음:
```
- **Unified Input Handling**: All patterns now share normalized encoder
  state via `InputFrame`, removing duplicated tracking logic.
- **Pattern Selection Mode**: Long-press encoder 4 (1s) to switch
  patterns at runtime — no more reflashing per pattern.
```

---

## 5. 태그 / 커밋 메시지 규칙

### 5-1. 커밋 메시지

- 첫 줄: **명령형, 50자 이내**
  - "Add Wave1 pattern" (X) "Added Wave1 pattern"
  - "Fix encoder debounce" (X) "Fixed encoder debounce issue"
- 빈 줄
- 본문: 왜, 무엇을 (필요시)

릴리스 커밋은 명확히:
```
Release fw-v1.1.0: multi-pattern unified firmware
```

### 5-2. 태그 메시지

annotated tag로 만든다 (`-a` 옵션):

```bash
git tag -a fw-v1.1.0 -m "Firmware v1.1.0 — Multi-pattern Update

- InputFrame unified input handling
- Pattern selection mode via long-press
- Wave1_Saw pattern added"
```

---

## 6. 릴리스 후 점검

릴리스 후 24시간 이내에:

- [ ] GitHub Releases 페이지에 본문이 잘 보이는가
- [ ] 사용자가 README → 굽기 → 동작 흐름을 따라갈 수 있는가
- [ ] 외부 채널(Reddit/Discord/SNS)에 알릴 가치가 있다면 알렸는가
- [ ] 다음 마일스톤을 ROADMAP에 반영했는가

---

## 7. 응급 상황: 릴리스 취소

릴리스 후 심각한 문제 발견 시:

1. **즉시 다음 PATCH 릴리스로 수정** (선호)
2. 정 안 되면 GitHub Releases에서 해당 릴리스를 "Pre-release"로
   변경하고 README에서 회피 안내
3. 태그는 절대 강제 삭제하지 않는다 — 이미 누군가 쓰고 있을 수 있음

---

## 8. 부록: 영역 간 호환성 표 (필요 시 작성)

다음과 같은 표를 README나 docs에 유지하면 사용자가 헷갈리지 않는다.

| Firmware    | Hardware  | Web flasher | 비고                |
| ----------- | --------- | ----------- | ------------------- |
| fw-v1.0.0   | hw-v1.0   | web-v0.2.0+ | 첫 공개 빌드        |
| fw-v1.1.0   | hw-v1.0   | web-v0.3.0+ | 멀티 패턴           |
| fw-v2.0.0   | hw-v2.0   | web-v1.0.0+ | 듀얼 모드 (예정)    |

---

*이 문서 자체도 버전이 있다. 본 규칙을 크게 바꾸려면 먼저 이 문서를
먼저 갱신하고, 변경 이유를 commit message에 남긴다.*