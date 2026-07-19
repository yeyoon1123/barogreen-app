# BARO GREEN

불법 투기 신고와 쓰레기 방문 수거를 연결하는 위치 기반 서비스입니다.
React Native 앱, React 관리자 웹 대시보드, Spring Boot 백엔드로 구성된 풀스택 프로젝트입니다.

## 프로젝트 구성

- **mobile-app**: React Native 기반 사용자 앱
- **admin-dashboard**: React 기반 업체/관리자 웹 대시보드
- **backend**: Spring Boot 기반 API 서버

## 주요 기능

- 지도 기반 불법 투기 신고, 위치 자동 인식 및 사진 EXIF 기반 좌표 추출
- 신고 상태(접수완료/처리중/완료) 실시간 동기화 — 앱과 관리자 웹 간 즉시 반영
- 카카오페이 연동 방문 수거 결제 및 쿠폰 할인
- 하단 탭바 및 스와이프 기반 화면 전환
- 관리자 웹에서 신고 삭제/정정 요청 처리 시 앱에 즉시 반영
- 오프라인 상태에서도 신고 접수 가능한 오프라인 큐잉

## 기술 스택

- Frontend (Mobile): React Native, Expo
- Frontend (Admin): React
- Backend: Spring Boot, Java
- Payment: KakaoPay API
