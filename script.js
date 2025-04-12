// 百度翻译API配置
// 删除这些硬编码的配置
// const BAIDU_APP_ID = '20250412002331105';
// const BAIDU_KEY = 'Vm87jNXqfZmUmQrGBTRc';

class TranslationApp {
    constructor() {
        this.searchInput = document.getElementById('searchInput');
        this.translateBtn = document.getElementById('translateBtn');
        this.suggestions = document.getElementById('suggestions');
        this.definition = document.getElementById('definition');
        this.examples = document.getElementById('examples');
        this.translation = document.getElementById('translation');
        this.searchHistory = document.getElementById('searchHistory');
        this.switchBtn = document.getElementById('switchBtn');
        this.fromLang = document.getElementById('fromLang');
        this.toLang = document.getElementById('toLang');
        this.speechSynthesis = window.speechSynthesis;
        this.isChineseToJapanese = true;
        
        try {
            this.history = JSON.parse(localStorage.getItem('searchHistory'));
            if (!Array.isArray(this.history)) {
                this.history = [];
            }
        } catch (error) {
            this.history = [];
        }
        
        this.initializeEventListeners();
        this.renderHistory();
    }

    initializeEventListeners() {
        this.translateBtn.addEventListener('click', () => this.handleTranslation());
        this.searchInput.addEventListener('input', () => this.handleInput());
        // 添加切换按钮事件监听
        this.switchBtn.addEventListener('click', () => this.switchTranslationDirection());
    }

    // 添加切换翻译方向的方法
    switchTranslationDirection() {
        this.isChineseToJapanese = !this.isChineseToJapanese;
        this.fromLang.textContent = this.isChineseToJapanese ? '中文' : '日语';
        this.toLang.textContent = this.isChineseToJapanese ? '日语' : '中文';
        this.searchInput.placeholder = `输入${this.fromLang.textContent}...`;
    }

    async handleTranslation() {
        const text = this.searchInput.value.trim();
        if (!text) return;

        // 添加加载状态
        this.translation.innerHTML = '正在翻译...';
        
        try {
            const translation = await this.translate(text);
            
            // 更新UI
            this.updateResults(text, translation);
            this.addToHistory(text, translation);
        } catch (error) {
            console.error('Translation error:', error);
            this.translation.innerHTML = '翻译出错，请稍后重试';
        }
    }

    async translate(text) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(`${this.serverUrl}/translate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text,
                    from: this.isChineseToJapanese ? 'zh' : 'jp',
                    to: this.isChineseToJapanese ? 'jp' : 'zh'
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Translation response:', data);

            if (data.error_code) {
                console.error('API Error:', data);
                throw new Error(`翻译API错误: ${data.error_msg}`);
            }
            if (!data.trans_result || !data.trans_result[0]) {
                console.error('Invalid response:', data);
                throw new Error('服务器返回数据格式错误');
            }
            return data.trans_result[0].dst;
        } catch (error) {
            console.error('Detailed error:', error);
            if (error.name === 'AbortError') {
                throw new Error('服务器响应超时，请检查网络连接');
            } else if (error.message.includes('Failed to fetch')) {
                throw new Error('无法连接到翻译服务器，请确保服务器已启动');
            }
            throw error;
        }
    }

    handleInput() {
        const text = this.searchInput.value.trim();
        if (text.length > 0) {
            this.showSuggestions(text);
        } else {
            this.suggestions.style.display = 'none';
        }
    }

    showSuggestions(text) {
        const suggestedWords = this.history
            .filter(item => item.original.includes(text))
            .map(item => item.original)
            .slice(0, 5);

        if (suggestedWords.length > 0) {
            this.suggestions.innerHTML = suggestedWords
                .map(word => `<div class="suggestion-item">${word}</div>`)
                .join('');
            this.suggestions.style.display = 'block';
        } else {
            this.suggestions.style.display = 'none';
        }
    }

    updateResults(original, translation) {
        this.translation.innerHTML = `
            <h3>翻译结果</h3>
            <div class="translation-result">
                <p>${translation}</p>
                <button class="speak-btn" onclick="window.app.speak('${translation}')">
                    <span class="speak-icon">🔊</span>
                </button>
            </div>
        `;
    }

    speak(text) {
        this.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        const voices = this.speechSynthesis.getVoices();
        
        if (!this.isChineseToJapanese) {
            // 中文输出
            utterance.lang = 'zh-CN';
            // 优先使用 Microsoft 的中文语音
            const chineseVoice = voices.find(voice => 
                voice.name.includes('Microsoft') && voice.name.includes('Xiaoxiao')
            ) || voices.find(voice => 
                voice.lang.startsWith('zh')
            );
            
            if (chineseVoice) {
                utterance.voice = chineseVoice;
                utterance.rate = 0.9;  // 稍微降低语速
            }
        } else {
            // 日语输出
            utterance.lang = 'ja-JP';
            const japaneseVoice = voices.find(voice => 
                voice.name.includes('Microsoft') && voice.name.includes('Nanami')
            ) || voices.find(voice => 
                voice.lang.includes('ja')
            );
            
            if (japaneseVoice) {
                utterance.voice = japaneseVoice;
                utterance.rate = 1.0;
            }
        }

        utterance.volume = 1.0;
        utterance.pitch = 1.0;

        // 添加错误处理
        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
        };

        this.speechSynthesis.speak(utterance);
    }

    addToHistory(original, translated) {
        const historyItem = { original, translated, timestamp: Date.now() };
        this.history.unshift(historyItem);
        if (this.history.length > 10) this.history.pop();
        localStorage.setItem('searchHistory', JSON.stringify(this.history));
        this.renderHistory();
    }

    renderHistory() {
        if (!this.history) return;
        
        this.searchHistory.innerHTML = this.history
            .map(item => `
                <div class="history-item">
                    <div class="history-text">
                        <span>${item.original}</span>
                        <span>➔</span>
                        <span>${item.translated}</span>
                    </div>
                    <div class="history-controls">
                        <div class="timestamp">${new Date(item.timestamp).toLocaleString()}</div>
                        <button class="speak-btn" onclick="window.app.speak('${item.translated}')">
                            <span class="speak-icon">🔊</span>
                        </button>
                    </div>
                </div>
            `)
            .join('');
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TranslationApp();
});