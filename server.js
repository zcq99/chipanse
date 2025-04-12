const express = require('express');
const cors = require('cors');
const axios = require('axios');
const md5 = require('md5');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

const BAIDU_APP_ID = '20250412002331105';
const BAIDU_KEY = 'Vm87jNXqfZmUmQrGBTRc';

app.post('/translate', async (req, res) => {
    try {
        const { text, from, to } = req.body;
        const salt = new Date().getTime();
        const sign = md5(BAIDU_APP_ID + text + salt + BAIDU_KEY);

        const response = await axios.post('https://fanyi-api.baidu.com/api/trans/vip/translate', null, {
            params: {
                q: text,
                from,
                to,
                appid: BAIDU_APP_ID,
                salt,
                sign
            }
        });

        console.log('Baidu API response:', response.data); // 添加服务器端日志
        res.json(response.data);
    } catch (error) {
        console.error('Translation error:', error.response?.data || error.message);
        res.status(500).json({ error: '翻译服务暂时不可用' });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});