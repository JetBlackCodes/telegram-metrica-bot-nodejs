process.env.NTBA_FIX_319 = 1;
var TelegramBot = require('node-telegram-bot-api');
const config = require('./config');
const axios = require('axios');

const YM_API_URL = "https://api-metrika.yandex.ru/stat/v1/data"

var bot = new TelegramBot(config.TOKEN_TG, { polling: true });

bot.on("polling_error", (err) => console.log(err));

bot.onText(/\/start/, function (msg) {
    bot.sendSticker(msg.chat.id, 'CAACAgIAAxkBAAMFXy5dtcL5BuUJC7ck39a9LB88L0QAAnoAA8GcYAzQYF2JVEK8_hoE', {
        "reply_markup": {
            "keyboard": [["Операционные системы АО", "Браузеры АО"]],
            "resize_keyboard": true
        }
    });

    if (msg.chat.type === "private") {
        bot.sendMessage(msg.chat.id, `Не думал, что ты зайдешь, ${msg.from.first_name}!\nЯ - <b>АО/ГПБ Метрика</b>, бот для показа Яндекс Метрики проекта старое-ЭДО за последний месяц`, {parse_mode : "HTML"})
    }
    else {
        bot.sendMessage(msg.chat.id, `Ого сколько вас тут! ${msg.from.first_name} спасибо что пригласил на тусу!\nЯ - <b>АО/ГПБ Метрика</b>, бот для показа Яндекс Метрики проекта старое-ЭДО за последний месяц`, {parse_mode : "HTML"})
    }
})

bot.on('message', function (msg) {
    let metrics, dimensions, title;

    if (msg.text === "Браузеры АО" || msg.text === "Операционные системы АО"){
        if (msg.text === "Браузеры АО"){
            metrics = ['ym:s:visits', 'ym:s:users']
            dimensions = ['ym:s:browserAndVersionMajor']
            title = "<b>Версия браузера: Посещения - Юзеры</b>\n\n"
        }
        else if (msg.text === "Операционные системы АО"){
            metrics = ['ym:s:visits', 'ym:s:users']
            dimensions = ['ym:s:operatingSystem']
            title = "<b>Версия ОС: Посещения - Юзеры</b>\n\n"
        }

        const metrics_string = metrics.join(',');
        const dimensions_string = dimensions.join(',');

        axios.get(`${YM_API_URL}?metrics=${metrics_string}&dimensions=${dimensions_string}&date1=30daysAgo&date2=today&ids=${config.counterIdAO}&oauth_token=${config.TOKEN_YM}`)
            .then(function (response) {
                const resultData = response.data.data;
                const array = [];

                for (let i of resultData) {
                    const name = i['dimensions'][0]['name'];
                    const my_metrics = i['metrics'];
                    const visits = my_metrics[0];
                    const users = my_metrics[1];
                    const stroka = `<b>${name}:</b> ${visits} - ${users}`;
                    array.push(stroka);
                }

                const result = title.concat(array.join('\n'));

                if(result.length > 4096){
                    for (let j = 0; j < result.length; j+=4096) {
                        bot.sendMessage(msg.chat.id, result.substring(j, j+4096), {parse_mode : "HTML"});
                    }
                }
                else bot.sendMessage(msg.chat.id, result, {parse_mode : "HTML"})

            })
            .catch(function (error) {
                console.log(error);
            });
    }

else bot.sendMessage(msg.chat.id, 'Я не могу знать всего, но смысл жизни точно - 42');
});



