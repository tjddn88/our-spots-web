#!/usr/bin/env node

/**
 * Google Places API 동기화 스크립트
 *
 * 사용법:
 *   node scripts/sync-google-places.js
 *
 * .env.local 파일에서 GOOGLE_API_KEY를 읽어옵니다.
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

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

let jwtToken = null;

if (!GOOGLE_API_KEY) {
  console.error('❌ GOOGLE_API_KEY가 설정되지 않았습니다.');
  console.error('   .env.local 파일에 GOOGLE_API_KEY=your_key 추가하세요.');
  process.exit(1);
}

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

async function fetchAllPlaces() {
  const res = await fetch(`${API_BASE_URL}/api/places`);
  const data = await res.json();
  if (!data.success) throw new Error('Failed to fetch places');
  return data.data;
}

async function searchGooglePlace(name, address, lat, lng) {
  // 좌표 기반 검색 (더 정확함)
  const query = encodeURIComponent(`${name} ${address}`);
  const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${query}&inputtype=textquery&locationbias=point:${lat},${lng}&fields=place_id,rating,user_ratings_total,name&key=${GOOGLE_API_KEY}`;

  const res = await fetch(url);
  const data = await res.json();

  if (data.status === 'OK' && data.candidates && data.candidates.length > 0) {
    return data.candidates[0];
  }
  return null;
}

async function updatePlace(id, googleData) {
  const res = await fetch(`${API_BASE_URL}/api/places/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwtToken}`
    },
    body: JSON.stringify({
      googlePlaceId: googleData.place_id,
      googleRating: googleData.rating,
      googleRatingsTotal: googleData.user_ratings_total
    })
  });
  return res.ok;
}

async function main() {
  console.log('🚀 Google Places 동기화 시작\n');
  console.log(`API URL: ${API_BASE_URL}`);
  console.log(`Google API Key: ${GOOGLE_API_KEY.substring(0, 10)}...`);
  console.log('');

  // 로그인
  console.log('🔐 로그인 중...');
  if (!await login()) {
    process.exit(1);
  }
  console.log('✅ 로그인 성공\n');

  try {
    // 1. 모든 장소 조회
    console.log('📍 장소 목록 조회 중...');
    const allPlaces = await fetchAllPlaces();

    // Google 평점 없는 장소만 필터링
    const places = allPlaces.filter(p => !p.googleRating);
    console.log(`   총 ${allPlaces.length}개 장소 중 ${places.length}개 미동기화\n`);

    if (places.length === 0) {
      console.log('✅ 모든 장소가 이미 동기화되어 있습니다.');
      return;
    }

    let success = 0;
    let notFound = 0;
    let failed = 0;

    // 2. 각 장소에 대해 Google Places 검색
    for (const place of places) {
      process.stdout.write(`[${place.id}] ${place.name}... `);

      try {
        const googleData = await searchGooglePlace(
          place.name,
          place.address,
          place.latitude,
          place.longitude
        );

        if (googleData) {
          // 3. 업데이트
          const updated = await updatePlace(place.id, googleData);
          if (updated) {
            console.log(`✅ ${googleData.rating || 'N/A'}점 (${googleData.user_ratings_total || 0}개 리뷰)`);
            success++;
          } else {
            console.log('❌ 업데이트 실패');
            failed++;
          }
        } else {
          console.log('⚠️ Google에서 찾을 수 없음');
          notFound++;
        }

        // API 속도 제한 방지 (200ms 대기)
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (err) {
        console.log(`❌ 에러: ${err.message}`);
        failed++;
      }
    }

    // 4. 결과 출력
    console.log('\n========== 결과 ==========');
    console.log(`✅ 성공: ${success}개`);
    console.log(`⚠️ 미발견: ${notFound}개`);
    console.log(`❌ 실패: ${failed}개`);
    console.log('==========================\n');

  } catch (err) {
    console.error('❌ 오류 발생:', err.message);
    process.exit(1);
  }
}

main();
