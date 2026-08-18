/* ============================================================
   호탐 모션 프로토타입 — 더미 데이터
   서버 없음. 새로고침 시 초기화.
   ============================================================ */
(function (global) {
  'use strict';

  /* 등급: good=좋음 / soso=그저 / bad=별로 (표시형)
     선택형 어휘: 좋았어요 / 그저그래요 / 별로였어요 */
  var GRADE = {
    good: { key: 'good', label: '좋음', choice: '좋았어요' },
    soso: { key: 'soso', label: '그저', choice: '그저그래요' },
    bad: { key: 'bad', label: '별로', choice: '별로였어요' }
  };

  /* 카테고리 키는 app.js의 아이콘 세트와 1:1 대응 */
  var restaurants = [
    {
      id: 'R01', name: '연남동 손칼국수', category: 'noodle', categoryLabel: '칼국수',
      area: '연남동', address: '서울 마포구 성미산로 29길 12', dist: 240,
      records: 1284, friendScore: 8.9, allScore: 8.2, grade: 'good',
      pin: { x: 118, y: 232 }, tone: 1,
      desc: '멸치 육수에 들깨를 아끼지 않는 집. 웨이팅 20분.'
    },
    {
      id: 'R02', name: '합정 화로상회', category: 'meat', categoryLabel: '고기',
      area: '합정동', address: '서울 마포구 양화로 6길 44', dist: 610,
      records: 932, friendScore: 9.5, allScore: 8.8, grade: 'good',
      pin: { x: 236, y: 168 }, tone: 2,
      desc: '숯불 향이 진하게 붙는 두툼한 목살. 예약 필수.'
    },
    {
      id: 'R03', name: '망원 삼거리 포차', category: 'drink', categoryLabel: '술집',
      area: '망원동', address: '서울 마포구 포은로 8길 21', dist: 880,
      records: 471, friendScore: 6.2, allScore: 6.6, grade: 'soso',
      pin: { x: 72, y: 402 }, tone: 3,
      desc: '안주보다 분위기. 늦게까지 하는 게 최대 장점.'
    },
    {
      id: 'R04', name: '서교동 라멘연구소', category: 'noodle', categoryLabel: '라멘',
      area: '서교동', address: '서울 마포구 잔다리로 6길 9', dist: 430,
      records: 2140, friendScore: 9.1, allScore: 9.0, grade: 'good',
      pin: { x: 292, y: 320 }, tone: 4,
      desc: '돈코츠 진하기 3단계 선택. 차슈 추가는 늘 옳다.'
    },
    {
      id: 'R05', name: '동교동 소금빵집', category: 'bakery', categoryLabel: '베이커리',
      area: '동교동', address: '서울 마포구 동교로 27길 3', dist: 150,
      records: 3021, friendScore: 8.4, allScore: 8.6, grade: 'good',
      pin: { x: 176, y: 118 }, tone: 5,
      desc: '오후 2시 전에 가야 소금빵이 남아 있다.'
    },
    {
      id: 'R06', name: '상수 카페 목요일', category: 'cafe', categoryLabel: '카페',
      area: '상수동', address: '서울 마포구 와우산로 15길 30', dist: 720,
      records: 654, friendScore: 5.5, allScore: 6.1, grade: 'soso',
      pin: { x: 320, y: 468 }, tone: 6,
      desc: '커피는 무난, 자리는 넓다. 노트북 작업용.'
    },
    {
      id: 'R07', name: '홍대 마라공방', category: 'chinese', categoryLabel: '중식',
      area: '서교동', address: '서울 마포구 홍익로 5길 18', dist: 540,
      records: 1103, friendScore: 7.8, allScore: 7.2, grade: 'good',
      pin: { x: 210, y: 396 }, tone: 7,
      desc: '마라 단계는 2단계부터가 진짜. 유부는 필수.'
    },
    {
      id: 'R08', name: '연희동 백반정식', category: 'korean', categoryLabel: '한식',
      area: '연희동', address: '서울 서대문구 연희로 11가길 22', dist: 1320,
      records: 388, friendScore: 7.1, allScore: 7.5, grade: 'soso',
      pin: { x: 96, y: 520 }, tone: 8,
      desc: '반찬이 매일 바뀐다. 계란찜은 상시.'
    },
    {
      id: 'R09', name: '망원 시장 닭강정', category: 'snack', categoryLabel: '분식',
      area: '망원동', address: '서울 마포구 망원로 8길 14', dist: 960,
      records: 812, friendScore: 1.2, allScore: 3.4, grade: 'bad',
      pin: { x: 258, y: 556 }, tone: 9,
      desc: '줄은 긴데 맛은 줄만큼은 아니다.'
    },
    {
      id: 'R10', name: '합정 스시로', category: 'sushi', categoryLabel: '일식',
      area: '합정동', address: '서울 마포구 월드컵로 3길 7', dist: 680,
      records: 1567, friendScore: 8.7, allScore: 8.9, grade: 'good',
      pin: { x: 148, y: 336 }, tone: 10,
      desc: '런치 오마카세 가성비. 저녁은 예약이 어렵다.'
    }
  ];

  /* 내 기록 3건 (홈 피드 시드) */
  var myRecords = [
    { id: 'M1', rid: 'R04', grade: 'good', score: 9.2, text: '진하기 3단계는 다음에. 차슈는 두 장이 정답이다.', ago: '2시간 전' },
    { id: 'M2', rid: 'R05', grade: 'good', score: 8.6, text: '소금빵 두 개 사서 하나는 걸어가며 먹었다.', ago: '어제' },
    { id: 'M3', rid: 'R09', grade: 'bad', score: 1.2, text: '줄 40분 서고 이 맛이면 다음은 없다.', ago: '3일 전' }
  ];

  /* 친구 기록 3건 (S4 상세 · 팔로잉 피드) */
  var friendRecords = [
    { id: 'F1', user: '탐식가정주', avatar: 1, rid: 'R02', grade: 'good', score: 9.5, text: '목살 두께가 다 했다. 소금만 찍어도 충분.', ago: '5시간 전' },
    { id: 'F2', user: '주말미식', avatar: 2, rid: 'R06', grade: 'soso', score: 5.5, text: '작업하러 가는 곳. 맛으로 가는 곳은 아님.', ago: '어제' },
    { id: 'F3', user: '동네한바퀴', avatar: 3, rid: 'R09', grade: 'bad', score: 1.2, text: '기대가 컸다. 그게 문제였다.', ago: '2일 전' }
  ];

  /* 홈 피드 = 친구 기록 + 내 기록 혼합 */
  var feedRecommend = [
    { id: 'FD1', user: '탐식가정주', avatar: 1, rid: 'R02', grade: 'good', score: 9.5, text: '목살 두께가 다 했다. 소금만 찍어도 충분.', ago: '5시간 전', liked: false, likes: 999000, comments: 600, photos: 2 },
    { id: 'FD2', user: '연남주민', avatar: 4, rid: 'R01', grade: 'good', score: 8.9, text: '들깨 칼국수는 여기 기준으로 판단하게 된다.', ago: '7시간 전', liked: false, likes: 19000, comments: 50, photos: 0 },
    { id: 'FD3', user: '동네한바퀴', avatar: 3, rid: 'R09', grade: 'bad', score: 1.2, text: '기대가 컸다. 그게 문제였다.', ago: '2일 전', liked: false, likes: 4200, comments: 88, photos: 2 },
    { id: 'FD4', user: '주말미식', avatar: 2, rid: 'R10', grade: 'good', score: 8.7, text: '런치 오마카세는 이 가격에 반칙이다.', ago: '2일 전', liked: false, likes: 12000, comments: 240, photos: 2 },
    { id: 'FD5', user: '빵순이지도', avatar: 5, rid: 'R05', grade: 'good', score: 8.4, text: '2시 넘어 갔더니 소금빵이 없었다. 교훈 하나.', ago: '3일 전', liked: false, likes: 860, comments: 12, photos: 0 }
  ];

  var feedFollowing = [
    { id: 'FG1', user: '주말미식', avatar: 2, rid: 'R06', grade: 'soso', score: 5.5, text: '작업하러 가는 곳. 맛으로 가는 곳은 아님.', ago: '어제', liked: false, likes: 19000, comments: 50, photos: 0 },
    { id: 'FG2', user: '탐식가정주', avatar: 1, rid: 'R07', grade: 'good', score: 7.8, text: '2단계부터 진짜. 유부 추가 안 하면 손해.', ago: '어제', liked: false, likes: 7300, comments: 120, photos: 2 },
    { id: 'FG3', user: '동네한바퀴', avatar: 3, rid: 'R08', grade: 'soso', score: 7.1, text: '계란찜 하나로 먹고 나오는 날도 있다.', ago: '4일 전', liked: false, likes: 2100, comments: 33, photos: 2 }
  ];

  /* S11 랭킹 — 미식가 랭킹(기록 수 기준) */
  var rankPeople = [
    { rank: 1, user: '먹성좋은 골목호랑이 08', avatar: 3, records: 87, following: false },
    { rank: 2, user: '골목 미식가 01', avatar: 1, records: 58, following: false },
    { rank: 3, user: '매운맛 수집가 09', avatar: 4, records: 44, following: true },
    { rank: 4, user: '신선한 재료 사랑 05', avatar: 6, records: 16, following: false, me: true },
    { rank: 5, user: '디저트 마스터 03', avatar: 5, records: 9, following: false },
    { rank: 6, user: '비건 요리 연구가 06', avatar: 2, records: 3, following: false }
  ];

  /* S11 랭킹 — 식당 랭킹 */
  var rankPlaces = ['R05', 'R04', 'R01', 'R10', 'R06', 'R08', 'R09'].map(function (id, i) {
    var r = byId(id);
    return { rank: i + 1, rid: id, name: r.name, meta: r.categoryLabel + ' · ' + r.area + ' · 기록 ' + r.records.toLocaleString('ko-KR'), score: r.allScore, grade: r.grade, tone: r.tone, category: r.category };
  });

  /* 온보딩 후보 식당(선택 단계) */
  var onboardingPool = restaurants.map(function (r) {
    return { id: r.id, name: r.name, area: r.area, categoryLabel: r.categoryLabel, category: r.category, tone: r.tone };
  });

  /* 기록 플로우 비교쌍 후보 — 같은 등급 안에서만 비교(캐논) */
  function comparePool(grade, excludeId) {
    var seed = myRecords.filter(function (m) { return m.grade === grade && m.rid !== excludeId; });
    return seed.map(function (m) {
      var r = byId(m.rid);
      return { rid: m.rid, name: r.name, area: r.area, categoryLabel: r.categoryLabel, tone: r.tone, score: m.score };
    });
  }

  function byId(id) {
    for (var i = 0; i < restaurants.length; i++) if (restaurants[i].id === id) return restaurants[i];
    return null;
  }

  global.HOTAM_DATA = {
    GRADE: GRADE,
    restaurants: restaurants,
    myRecords: myRecords,
    friendRecords: friendRecords,
    feedRecommend: feedRecommend,
    feedFollowing: feedFollowing,
    onboardingPool: onboardingPool,
    comparePool: comparePool,
    rankPeople: rankPeople,
    rankPlaces: rankPlaces,
    byId: byId,
    me: {
      nick: '신선한 재료 사랑 05', handle: '@jungju', avatar: 6,
      records: 16, followers: 646, following: 721,
      rank: 4, topPct: 1
    }
  };
})(window);
