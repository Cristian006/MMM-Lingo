Module.register('MMM-Lingo', {

  /** @member {boolean} loaded - Flag to indicate if word sets have been loaded. */
  loaded: false,
  /** @member {?Timeout} wordSwitcher - Toggles between native and foreign word. */
  wordSwitcher: null,
  /** @member {?Interval} countdown - Updates countdown bar */
  countdown: null,

  /**
   * @member {Object} defaults - Defines the default config values.
   * @property {int} nativeTimeout - Time native word is displayed.
   * @property {int} foreignTimeout - Time foreign word is displayed.
   * @property {boolean} showTimeLeft - Show how much time is left until change.
   * @property {boolean} revert - Reverts native to foreign.
   * @property {boolean} color - Use color for countdown bar.
   * @property {string} width - Countdown bar width.
   * @property {string} provider - API provider to use.
   * @property {string} initialWord - Initial word to display.
   */
  defaults: {
      nativeTimeout: 10 * 1000,
      foreignTimeout: 20 * 1000,
      showTimeLeft: true,
      revert: false,
      color: false,
      width: '100%',
      provider: 'custom',
      updateInterval: 1000,
      initialWord: 'native',
  },

  /**
   * @member {Object} languageFlags - Maps language codes to emoji flags 
   */
  languageFlags: {
      es: '🇲🇽',
      en: '🇺🇸',
      fr: '🇫🇷',
      de: '🇩🇪',
      it: '🇮🇹',
      pt: '🇵🇹',
  },

  /** @member {string} displayState - Current display state (single or both) */
  displayState: 'single',

  /**
   * @function getTranslations
   * @description Translations for this module.
   * @override
   *
   * @returns {Object.<string, string>} Available translations for this module (key: language code, value: filepath).
   */
  getTranslations() {
      return {
          es: 'translations/es.json',
          en: 'translations/en.json'
      };
  },

  /**
   * @function getStyles
   * @description Style dependencies for this module.
   * @override
   *
   * @returns {string[]} List of the style dependency filepaths.
   */
  getStyles() {
      return ['MMM-Lingo.css'];
  },

  /**
   * @function start
   * @description Sends the config to the node_helper.
   * @override
   */
  start() {
      Log.info(`Starting module: ${this.name}`);
      this.sendSocketNotification('CONFIG', this.config);
  },

  /**
   * @function socketNotificationReceived
   * @description Handles incoming messages from node_helper.
   * @override
   *
   * @param {string} notification - Notification name
   * @param {*} payload - Detailed payload of the notification.
   */
  socketNotificationReceived(notification, payload) {
      if (notification === 'WORDSET') {
          this.wordSet = payload;
          this.displayState = 'single';
          this.setCurrentWord();
          clearTimeout(this.wordSwitcher);
          this.wordSwitcher = setTimeout(() => {
              this.displayState = 'both';
              this.setCurrentWord();
              // Set timer for next word
              setTimeout(() => {
                  this.sendSocketNotification('GET_NEXT_WORD');
              }, this.config.nativeTimeout);
          }, this.config.foreignTimeout);
      }
  },

  /**
   * @function setCurrentWord
   * @description Toggles between native and foreign word.
   * @param {boolean} translation - Flag to switch to foreign word.
   */
  setCurrentWord(translation) {
      clearInterval(this.countdown);
      if ((translation && !this.config.revert) || (!translation && this.config.revert)) {
          this.word = 'foreign';
      } else {
          this.word = 'native';
      }
      this.loaded = true;
      this.updateDom(300);
  },

  /**
   * @function getDom
   * @description Creates the UI as DOM for displaying in MagicMirror application.
   * @override
   *
   * @returns {Element}
   */
  getDom() {
      const wrapper = document.createElement('div');

      if (!this.loaded) {
          wrapper.innerHTML = this.translate('LOADING');
          wrapper.classList.add('dimmed', 'light');
      } else {
          const word = document.createElement('div');
          word.classList.add('main', 'center');
          
          // Create initial word element
          const initialWordPair = document.createElement('div');
          initialWordPair.classList.add('word-pair');
          const initialLang = this.config.initialWord;
          const initialFlag = this.languageFlags[this.wordSet[`${initialLang}Language`]] || '';
          initialWordPair.innerHTML = `${initialFlag} ${this.wordSet[`${initialLang}Word`]}`;
          
          if (this.displayState === 'both') {
              // Create separator
              const separator = document.createElement('div');
              separator.classList.add('word-separator');
              separator.innerHTML = '⟷';
              
              // Create second word element
              const secondWordPair = document.createElement('div');
              secondWordPair.classList.add('word-pair');
              const secondLang = initialLang === 'native' ? 'foreign' : 'native';
              const secondFlag = this.languageFlags[this.wordSet[`${secondLang}Language`]] || '';
              secondWordPair.innerHTML = `${secondFlag} ${this.wordSet[`${secondLang}Word`]}`;
              
              if (initialLang === 'native') {
                  word.appendChild(initialWordPair);
                  word.appendChild(separator);
                  word.appendChild(secondWordPair);
              } else {
                  word.appendChild(secondWordPair);
                  word.appendChild(separator);
                  word.appendChild(initialWordPair);
              }
          } else {
              word.appendChild(initialWordPair);
          }
          
          const heading = document.createElement('div');
          heading.classList.add('center', 'heading');
          heading.innerHTML = this.wordSet['category'];

          wrapper.appendChild(heading);
          wrapper.appendChild(word);

          if (this.config.showTimeLeft) {
              const countdown = document.createElement('div');
              countdown.classList.add('bar', 'nostripes');
              countdown.style.width = this.config.width;

              const span = document.createElement('span');
              if (this.config.color) {
                  span.classList.add('relax');
              }
              let countdownWidth = 100;
              const countdownStep = Math.floor(100 / (this.config[`${this.word}Timeout`] / this.config.updateInterval));
              span.style.width = `${countdownWidth}%`;

              Log.info(countdownStep);
              this.countdown = setInterval(() => {
                  countdownWidth -= countdownStep;
                  if (this.config.color) {
                      if (countdownWidth > 66) {
                          span.className = 'relax';
                      } else if (countdownWidth > 33) {
                          span.className = 'concentrate';
                      } else {
                          span.className = 'hurryup';
                      }
                  } else {
                      span.style.opacity = countdownWidth / 100;
                  }
                  span.style.width = `${countdownWidth}%`;
              }, this.config.updateInterval);

              countdown.appendChild(span);
              wrapper.appendChild(countdown);
          }
      }

      return wrapper;
  }
});
