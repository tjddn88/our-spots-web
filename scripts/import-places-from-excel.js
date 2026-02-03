#!/usr/bin/env node

/**
 * 엑셀 파일에서 장소 일괄 등록 스크립트
 *
 * 사용법:
 *   node scripts/import-places-from-excel.js /path/to/file.xlsx
 */

const fs = require('fs');
const path = require('path');

// .env.local 파일 로드
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

const KAKAO_REST_API_KEY = '157e20da2dcc2a1ce196553f72cd72ca'; // REST API 키 (주소검색용)
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

let jwtToken = null;

// 로그인해서 JWT 토큰 획득
async function login() {
  if (!ADMIN_PASSWORD) {
    console.error('❌ ADMIN_PASSWORD 환경변수가 필요합니다. .env.local에 설정해주세요.');
    process.exit(1);
  }
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: ADMIN_PASSWORD })
  });
  const data = await res.json();
  if (data.success && data.data?.token) {
    jwtToken = data.data.token;
    return true;
  }
  console.error('❌ 로그인 실패:', data.error || '알 수 없는 오류');
  return false;
}

// 카카오 주소 검색 API
async function getCoordinates(address, name) {
  // 먼저 주소로 검색
  let url = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`;
  let res = await fetch(url, {
    headers: { 'Authorization': `KakaoAK ${KAKAO_REST_API_KEY}` }
  });
  let data = await res.json();

  if (data.documents && data.documents.length > 0) {
    return {
      lat: parseFloat(data.documents[0].y),
      lng: parseFloat(data.documents[0].x)
    };
  }

  // 주소로 못 찾으면 키워드로 검색
  url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(name + ' ' + address)}`;
  res = await fetch(url, {
    headers: { 'Authorization': `KakaoAK ${KAKAO_REST_API_KEY}` }
  });
  data = await res.json();

  if (data.documents && data.documents.length > 0) {
    return {
      lat: parseFloat(data.documents[0].y),
      lng: parseFloat(data.documents[0].x)
    };
  }

  return null;
}

// 장소 생성 API
async function createPlace(place) {
  const res = await fetch(`${API_BASE_URL}/api/places`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwtToken}`
    },
    body: JSON.stringify(place)
  });
  const data = await res.json();
  if (!data.success) {
    console.log(`(${data.error || '알 수 없는 오류'})`);
  }
  return data.success;
}

// 기존 장소 조회
async function getExistingPlaces() {
  const res = await fetch(`${API_BASE_URL}/api/places`);
  const data = await res.json();
  if (!data.success) return [];
  return data.data.map(p => p.name.toLowerCase());
}

async function main() {
  const excelPath = process.argv[2];
  if (!excelPath) {
    console.error('사용법: node scripts/import-places-from-excel.js /path/to/file.xlsx');
    process.exit(1);
  }

  console.log('🚀 엑셀 장소 일괄 등록 시작\n');
  console.log(`파일: ${excelPath}`);
  console.log(`API: ${API_BASE_URL}\n`);

  // 로그인
  console.log('🔐 로그인 중...');
  if (!await login()) {
    process.exit(1);
  }
  console.log('✅ 로그인 성공\n');

  // Python으로 엑셀 읽기
  const { execSync } = require('child_process');
  const pythonScript = `
import json
from openpyxl import load_workbook
wb = load_workbook('${excelPath}')
ws = wb.active
rows = []
headers = None
for i, row in enumerate(ws.iter_rows(values_only=True)):
    if i == 0:
        headers = row
    else:
        rows.append(dict(zip(headers, row)))
print(json.dumps(rows, ensure_ascii=False))
`;

  let places;
  try {
    const result = execSync(`python3 -c "${pythonScript}"`, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    places = JSON.parse(result);
  } catch (err) {
    console.error('❌ 엑셀 파일 읽기 실패:', err.message);
    process.exit(1);
  }

  console.log(`📍 총 ${places.length}개 장소 발견\n`);

  // 기존 장소 조회 (중복 방지)
  console.log('📋 기존 장소 목록 조회 중...');
  const existingPlaces = await getExistingPlaces();
  console.log(`   기존 ${existingPlaces.length}개 장소\n`);

  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (const place of places) {
    const name = place.name?.trim();
    const address = place.address?.trim();
    const grade = place.grade;
    const type = place.type?.trim();

    if (!name || !address) {
      console.log(`⚠️ [SKIP] 이름 또는 주소 없음`);
      skipped++;
      continue;
    }

    // 중복 체크
    if (existingPlaces.includes(name.toLowerCase())) {
      console.log(`⏭️ [SKIP] ${name} - 이미 존재`);
      skipped++;
      continue;
    }

    process.stdout.write(`[${success + failed + skipped + 1}/${places.length}] ${name}... `);

    try {
      // 좌표 조회
      const coords = await getCoordinates(address, name);
      if (!coords) {
        console.log('❌ 좌표 찾기 실패');
        failed++;
        continue;
      }

      // 장소 생성
      const created = await createPlace({
        name,
        address,
        latitude: coords.lat,
        longitude: coords.lng,
        type: type || 'RESTAURANT',
        grade: grade || 3,
        description: place.description?.trim() || null
      });

      if (created) {
        console.log(`✅ (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`);
        success++;
      } else {
        console.log('❌ 생성 실패');
        failed++;
      }

      // API 속도 제한 방지
      await new Promise(resolve => setTimeout(resolve, 150));

    } catch (err) {
      console.log(`❌ 에러: ${err.message}`);
      failed++;
    }
  }

  console.log('\n========== 결과 ==========');
  console.log(`✅ 성공: ${success}개`);
  console.log(`⏭️ 스킵: ${skipped}개`);
  console.log(`❌ 실패: ${failed}개`);
  console.log('==========================\n');
}

main();
