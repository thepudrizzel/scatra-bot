const i18next = require('i18next');
const fs = require('fs');
const path = require('path');

function setupI18n() {
  const languageFiles = fs.readdirSync(__dirname)
    .filter(file => file.endsWith('.json'));

  const resources = {};
  
  languageFiles.forEach(file => {
    const languageCode = path.basename(file, '.json');
    const languageData = require(`./${file}`);
    resources[languageCode] = languageData;
    console.log(`> Loaded language: ${languageCode}`);
  });

  i18next.init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

  console.log(`> Available languages: ${Object.keys(resources).join(', ')}`);
  return i18next;
}

function setLanguage(lang) {
  if (i18next.languages.includes(lang)) {
    i18next.changeLanguage(lang);
    return true;
  }
  return false;
}

function translate(key, options = {}) {
  return i18next.t(key, options);
}

function getAvailableLanguages() {
  return i18next.languages;
}

function getCurrentLanguage() {
  return i18next.language;
}

module.exports = {
  setupI18n,
  setLanguage,
  translate: translate,
  t: translate,
  getAvailableLanguages,
  getCurrentLanguage
};
