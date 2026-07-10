---
name: "If I Bought Then"
description: "공유하기 좋은 주식 회고 결과를 만드는 검은 캔버스 기반 인터페이스."
colors:
  bg: "oklch(0.055 0 0)"
  surface: "oklch(0.125 0.012 294)"
  surface-muted: "oklch(0.17 0.016 294)"
  surface-raised: "oklch(0.205 0.018 294)"
  ink: "oklch(0.94 0.006 294)"
  muted: "oklch(0.74 0.018 294)"
  subtle: "oklch(0.58 0.02 294)"
  primary: "oklch(0.88 0.16 132)"
  primary-foreground: "oklch(0.08 0.018 132)"
  accent: "oklch(0.62 0.18 294)"
  accent-foreground: "oklch(1 0 0)"
  tease: "oklch(0.69 0.19 28)"
  tease-foreground: "oklch(1 0 0)"
  gain: "oklch(0.72 0.12 252)"
  gain-foreground: "oklch(0.055 0 0)"
  success: "oklch(0.72 0.15 150)"
  loss: "oklch(0.69 0.19 28)"
  loss-foreground: "oklch(1 0 0)"
  warning: "oklch(0.82 0.14 78)"
  disabled: "oklch(0.19 0.012 294)"
  disabled-foreground: "oklch(0.48 0.018 294)"
  overlay: "oklch(0.24 0.07 294 / 0.62)"
typography:
  display:
    fontFamily: "Pretendard Variable, Pretendard, system-ui, sans-serif"
    fontSize: "2.75rem"
    fontWeight: 820
    lineHeight: 1.02
    letterSpacing: "0"
  headline:
    fontFamily: "Pretendard Variable, Pretendard, system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 760
    lineHeight: 1.08
    letterSpacing: "0"
  title:
    fontFamily: "Pretendard Variable, Pretendard, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 720
    lineHeight: 1.18
    letterSpacing: "0"
  body:
    fontFamily: "Pretendard Variable, Pretendard, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 450
    lineHeight: 1.55
    letterSpacing: "0"
  label:
    fontFamily: "Pretendard Variable, Pretendard, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 680
    lineHeight: 1.28
    letterSpacing: "0"
rounded:
  xs: "4px"
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
  3xl: "48px"
  touch: "44px"
  page-x: "24px"
  page-y: "48px"
  container-page: "55rem"
  container-form: "31.25rem"
  container-result: "20rem"
---

# 디자인 시스템

## 방향

이 제품은 검은 캔버스에서 시작한다. 밝은 UI의 다크 모드가 아니라, 공유용 결과
이미지처럼 보이는 검은 배경이 기본 정체성이다. 화면은 투자 도구가 아니라 “놓친
종목 영수증”처럼 읽혀야 한다. 숫자는 즉시 이해되고, 문장은 짧고, 결과는 친구에게
보여줄 수 있어야 한다.

컨트롤은 익숙해야 한다. 개성은 높은 대비의 색, 짧은 한국어 문구, 결과 카드에서
나온다. 과한 금융 대시보드처럼 보이면 안 된다.

## 색상

검은 배경, 차콜 표면, 라임 액션, 포도색 포인트, 수익/손실 보조색으로 구성한다.

| 역할          | 토큰              | 규칙                                                                        |
| ------------- | ----------------- | --------------------------------------------------------------------------- |
| 배경          | `bg`              | 제품의 기본 캔버스다. 다크 모드 토글처럼 다루지 않는다.                     |
| 기본 표면     | `surface`         | 조용한 구획, 모달 상단/하단, 보조 영역에 쓴다.                              |
| 눌린 표면     | `surface-muted`   | 입력 row, 비활성 chip, 밀도 높은 컨트롤에 쓴다.                             |
| 떠 있는 표면  | `surface-raised`  | 결과 카드, popover, 핵심 패널에 쓴다.                                       |
| 본문 글자     | `ink`             | 반드시 읽혀야 하는 텍스트에 쓴다.                                           |
| 보조 글자     | `muted`, `subtle` | 보조 설명과 placeholder에 쓴다. 대비를 낮추기 위해 남용하지 않는다.         |
| 주요 액션     | `primary`         | 선택 상태, 주요 버튼, 공유 유도에 쓴다.                                     |
| 브랜드 포인트 | `accent`          | focus ring, 보조 액션, 가벼운 강조에만 쓴다.                                |
| 농담 포인트   | `tease`           | 결과의 한 줄 놀림처럼 드물게 쓰는 강조색이다.                               |
| 수익/손실     | `gain`, `loss`    | 수익/손실 표시용이다. 텍스트나 아이콘 없이 색만으로 의미를 전달하지 않는다. |
| 주의          | `warning`         | 비거래일, 데이터 한계, 추정 안내에 쓴다.                                    |

빨강과 파랑이 화면을 지배하면 증권사 화면처럼 보인다. 수익/손실을 표시할 때만
제한적으로 사용한다. 라임과 포도색도 장식용 gradient로 쓰지 않는다.

## 타이포그래피

기본 글꼴은 Pretendard 계열이다. 한국어 UI에서는 글자 간격을 `0`으로 유지한다.
글꼴 종류를 늘리지 말고 굵기와 크기로 위계를 만든다.

| 단계       | 용도                                                               |
| ---------- | ------------------------------------------------------------------ |
| `display`  | 최종 결과의 농담, 공유 카드의 가장 큰 문장에만 쓴다.               |
| `headline` | 화면 제목, 결과 요약에 쓴다.                                       |
| `title`    | 선택 그룹 제목, 모달 제목, 결과 하위 영역에 쓴다.                  |
| `body`     | 설명, 보조 문장, 데이터 안내에 쓴다. 긴 문장은 65ch 안에서 끊는다. |
| `label`    | field label, chip, button, badge, 달력 보조 정보에 쓴다.           |

입력 화면에서 hero급 글자를 남용하지 않는다. 큰 글자는 결과의 punchline을 위해
남겨둔다.

## 표면

깊이는 그림자나 선보다 표면 톤과 간격으로 만든다. 검은 배경 위에서는 표면 단계가
충분히 달라야 한다.

| 표면             | 용도                               |
| ---------------- | ---------------------------------- |
| `bg`             | 페이지 전체 배경                   |
| `surface`        | 차분한 보조 구획                   |
| `surface-muted`  | 입력, 비활성 선택지, 밀도 높은 row |
| `surface-raised` | 결과 카드, popover, 핵심 panel     |

색 있는 side stripe로 구조를 만들지 않는다.

## 컴포넌트

### 버튼

- 기본 모양은 `8px` radius의 사각형이다. 기본 버튼을 pill로 만들지 않는다.
- 주요 버튼은 라임 배경과 어두운 글자를 쓴다.
- 높이는 최소 `44px`이다.
- focus는 보이는 포도색 ring을 쓴다.

### 칩

- 빠른 수량, preset 날짜, 최근 본 종목에는 pill chip을 쓸 수 있다.
- 선택 전은 차콜 표면과 보조 글자, 선택 후는 라임 배경과 어두운 글자를 쓴다.

### 카드

- 결과 카드는 `16px`, 입력 그룹은 `12px` radius를 넘지 않는다.
- 입력 영역은 `surface-muted`, 공유 결과 카드는 `surface-raised`를 쓴다.
- 카드 안에 다시 장식용 카드를 중첩하지 않는다.

### 입력 필드

- label이 분명한 큰 row 형태를 기본으로 한다.
- placeholder도 대비 기준을 만족해야 한다.
- 오류는 색만 쓰지 말고 아이콘이나 문구로 함께 알린다.
- disabled 상태는 검은 배경에 묻히지 않아야 한다.

### 결과 카드

- 세로형 공유 카드처럼 읽혀야 한다.
- 하나의 핵심 숫자, 하나의 짧은 문장, 하나의 공유 액션을 중심으로 구성한다.
- 주변 페이지를 잘라내도 무슨 결과인지 이해되어야 한다.

## 금지 사항

- 증권사 HTS, 트레이딩 터미널, 실시간 매매 대시보드처럼 만들지 않는다.
- 캔들 차트, 호가창, ticker wall, 금융 테이블을 첫 인상으로 만들지 않는다.
- 빨강/파랑을 브랜드 주색처럼 쓰지 않는다.
- gradient text, glassmorphism, 색 있는 side stripe, 과하게 둥근 카드, 장식용 차트 노이즈를 쓰지 않는다.
- 투자 조언처럼 보이게 하지 않는다. 이 제품은 추천 도구가 아니라 회고형 계산기다.
