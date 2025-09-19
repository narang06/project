## 프로젝트 설명

# 부동산 통합 관리 솔루션
   
  개인 PC 환경에서 Oracle DB를 기반으로 동작하는 부동산 매물, 회원, 계약 관리 웹 애플리케이션입니다.

  ##  주요 기능
  **역할 기반 접근 제어 (RBAC)**
    **관리자**: 모든 데이터에 대한 CRUD(생성, 읽기, 수정, 삭제) 권한을 가집니다.
   - **부동산 매매자**: 자신이 등록한 매물 및 관련된 계약을 관리합니다.
    - **일반 회원**: 매물을 검색하고 자신의 계약 정보를 조회합니다.
  - **대시보드 (관리자용)**
    - 총 회원 수, 전체 매물 현황, 진행 중인 계약 건수를 한눈에 파악할 수 있습니다.
 - **회원 관리 (관리자용)**
      - 전체 회원 목록 조회, 신규 회원 추가, 정보 수정 및 삭제 기능을 제공합니다.
  - **매물 관리**
    - **관리자/매매자**: 매물 등록, 수정, 삭제 기능을 제공합니다.
   - **일반 회원**: 등록된 매물 목록을 조회하고 검색할 수 있습니다.
    - **계약 관리**
     - **관리자**: 모든 계약 정보 조회, 신규 계약 추가, 수정, 삭제 기능을 제공합니다.
  - **매매자/일반 회원**: 자신과 관련된 계약 내역을 조회할 수 있습니다.

     ## 기술 스택

 - **프론트엔드**:
   ![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
   ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
   ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
   ![Vue.js](https://img.shields.io/badge/Vue.js-4FC08D?style=flat-square&logo=vuedotjs&logoColor=white)
   ![jQuery](https://img.shields.io/badge/jQuery-0769AD?style=flat-square&logo=jquery&logoColor=white)
  - **백엔드**:
  ![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)
   ![Express.js](https://img.shields.io/badge/Express.js-000000?style=flat-square&logo=express&logoColor=white)
   ![Oracle](https://img.shields.io/badge/Oracle-F80000?style=flat-square&logo=oracle&logoColor=white)
 
## 프로젝트 구조
/  
├── Client/       # 프론트엔드 파일  
│   ├── index.html    # 로그인 및 메인 페이지  
│   ├── main.html     # 로그인 후 대시보드 및 관리 페이지  
│   ├── *.html        # 각 기능별 상세/수정/추가 페이지  
│   └── ...  
├── Server/       # 백엔드 서버 파일  
│   ├── server.js     # Express 메인 서버 로직  
│   ├── db.js         # Oracle DB 연결 설정  
│   ├── package.json  # Node.js 의존성 관리  
│   └── ...  
└── .gitignore  

  ## 실행 방법
    
    이 프로젝트는 개인 PC 환경에서 실행하는 것을 전제로 합니다.
  
  ### 1. 사전 준비

 - **Node.js**가 설치되어 있어야 합니다.
- **Oracle Database** (예: XE 버전)가 로컬에 설치 및 실행 중이어야 합니다.
 - `CLIENTS`, `PROPERTIES`, `CONTRACTS` 등 필요한 테이블이 데이터베이스에 미리 생성되어 있어야 합니다.
 
        (또는 `nodemon server.js`를 사용하면 코드 변경 시 서버가 자동으로 재시작됩니다.)
       "Server is running on port 3009" 메시지가 표시되면 성공입니다.
   
  ### 3. 프론트엔드 실행
 
   1.  백엔드 서버가 실행 중인 상태를 유지합니다.
   2.  VSCode와 같은 코드 에디터에서 `Client` 폴더를 엽니다.
  3.  VSCode 확장 프로그램인 **Live Server**를 사용하여 `Client/index.html` 파일을 엽니다.
    - `index.html` 파일을 마우스 오른쪽 버튼으로 클릭하고 `Open with Live Server`를 선택하세요.
     - Live Server를 사용해야 AJAX 요청이 정상적으로 동작합니다.
  
   이제 브라우저에서 부동산 관리 시스템을 사용할 수 있습니다.
