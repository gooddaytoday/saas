// Опциональные матчеры для Jest DOM
import '@testing-library/jest-dom';

// Глобальные моки и настройки
global.matchMedia =
  global.matchMedia ||
  function (query) {
    return {
      matches: false,
      media: query,
      onchange: null,
      addListener: function () {},
      removeListener: function () {},
      addEventListener: function () {},
      removeEventListener: function () {},
      dispatchEvent: function () {},
    };
  };

// Мок для IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}

  observe() {
    return null;
  }

  disconnect() {
    return null;
  }

  unobserve() {
    return null;
  }
};

// Гибридный подход: подавление только действительно безопасных ошибок глобально
// Для ожидаемых ошибок в тестах используется локальное подавление в каждом тесте
const originalError = console.error;
const originalWarn = console.warn;

console.error = (...args) => {
  const fullString = args.join(' ');

  // Паттерны БЕЗОПАСНЫХ ошибок - они никогда не должны быть регрессиями
  const safeSuppressionPatterns = [
    // React 18 старого API - никогда не будет проблемой в нашем коде
    'Warning: ReactDOM.render is no longer supported',

    // Material-UI пропы которые мы явно обработали в моках
    // и которые не должны попадать в DOM
    'Warning: React does not recognize the `disable',

    // Пропы мок-компонентов которые не должны попадать в DOM
    // Эти предупреждения безопасны - они связаны с тестированием моков
    'textareaHeight',
    'parentComponent',
  ];

  if (safeSuppressionPatterns.some((pattern) => fullString.includes(pattern))) {
    return; // ✓ Безопасно подавить
  }

  // Все остальные ошибки (включая toThrow ошибки) должны быть явно подавлены в тестах
  originalError.call(console, ...args);
};

// Также подавляем console.warn для React warnings
console.warn = (...args) => {
  const fullString = args.join(' ');

  const safeWarnPatterns = ['textareaHeight', 'parentComponent'];

  if (safeWarnPatterns.some((pattern) => fullString.includes(pattern))) {
    return; // ✓ Безопасно подавить
  }

  originalWarn.call(console, ...args);
};
