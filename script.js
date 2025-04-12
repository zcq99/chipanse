// 百度翻译API配置
const BAIDU_APP_ID = '20250412002331105';
const BAIDU_KEY = 'Vm87jNXqfZmUmQrGBTRc';

class TranslationApp {
    constructor() {
        this.searchInput = document.getElementById('searchInput');
        this.translateBtn = document.getElementById('translateBtn');
        this.suggestions = document.getElementById('suggestions');
        this.definition = document.getElementById('definition');
        this.examples = document.getElementById('examples');
        this.translation = document.getElementById('translation');
        this.searchHistory = document.getElementById('searchHistory');
        
        this.history = JSON.parse(localStorage.getItem('searchHistory')) || [];
        this.initializeEventListeners();
        this.renderHistory();
    }

    initializeEventListeners() {
        this.translateBtn.addEventListener('click', () => this.handleTranslation());
        this.searchInput.addEventListener('input', () => this.handleInput());
    }

    async handleTranslation() {
        const text = this.searchInput.value.trim();
        if (!text) return;

        try {
            // 检测输入语言
            const detectedLang = await this.detectLanguage(text);
            const targetLang = detectedLang === 'ja' ? 'zh' : 'ja';

            // 获取翻译
            const translation = await this.translate(text, targetLang);
            
            // 更新UI
            this.updateResults(text, translation);
            this.addToHistory(text, translation);
        } catch (error) {
            console.error('Translation error:', error);
            this.translation.innerHTML = '翻译出错，请稍后重试';
        }
    }

    async detectLanguage(text) {
        return /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]/.test(text) 
            ? 'ja' 
            : 'zh';
    }

    async translate(text, targetLang) {
        try {
            const salt = new Date().getTime();
            const str = BAIDU_APP_ID + text + salt + BAIDU_KEY;
            const sign = md5(str);

            const params = new URLSearchParams({
                q: text,
                from: targetLang === 'ja' ? 'zh' : 'jp',
                to: targetLang === 'ja' ? 'jp' : 'zh',
                appid: BAIDU_APP_ID,
                salt: salt,
                sign: sign
            });

            const response = await fetch(`https://api.fanyi.baidu.com/api/trans/vip/translate?${params}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            const data = await response.json();
            if (data.error_code) {
                throw new Error(`百度翻译错误: ${data.error_msg}`);
            }
            return data.trans_result[0].dst;
        } catch (error) {
            console.error('Translation error:', error);
            throw new Error('翻译服务暂时不可用');
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
            <p>${translation}</p>
        `;
    }

    addToHistory(original, translated) {
        const historyItem = { original, translated, timestamp: Date.now() };
        this.history.unshift(historyItem);
        if (this.history.length > 10) this.history.pop();
        localStorage.setItem('searchHistory', JSON.stringify(this.history));
        this.renderHistory();
    }

    renderHistory() {
        this.searchHistory.innerHTML = this.history
            .map(item => `
                <div class="history-item">
                    <div>${item.original} ➔ ${item.translated}</div>
                    <div class="timestamp">${new Date(item.timestamp).toLocaleString()}</div>
                </div>
            `)
            .join('');
    }
}

// MD5加密函数
function md5(string) {
    return CryptoJS.MD5(string).toString();
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new TranslationApp();
});