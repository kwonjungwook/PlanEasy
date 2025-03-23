const { getDefaultConfig } = require('@expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

// Firebase와 관련된 cjs 확장자 처리
defaultConfig.resolver.sourceExts.push('cjs');

// 필요한 경우 추가 설정
defaultConfig.resolver.assetExts.push('db', 'json');

// 성능 최적화 설정 추가
defaultConfig.maxWorkers = 4; // 워커 수 제한
defaultConfig.transformer.minifierConfig = {
  keep_classnames: true,
  keep_fnames: true
};

module.exports = defaultConfig;