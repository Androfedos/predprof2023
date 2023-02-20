from flask import Flask, request, render_template, session
import sqlite3
import os
import json
import aiohttp
import asyncio
from pprint import pprint
from statistics import mean
import time
import requests

def get_db_connection():
    conn = sqlite3.connect('database.db')
    # conn.row_factory = sqlite3.Row
    return conn

#INSERT OR REPLACE INTO States (wnd, aw, swat1, swat2, swat3, swat4, swat5, swat6, minT, maxAH, maxSH) VALUES (0, 0, 0, 0, 0, 0, 0, 0, 35, 60, 72) WHERE id = 1;

with open('base/shema.sql') as f:
    connection = get_db_connection()
    connection.executescript(f.read())
    print("Обнуление базы")
    connection.close()

app = Flask(__name__)
app.secret_key = b'_5#y2L"F4Q8z\dfsdf2'

headers={"X-Auth-Token": "HCbIZh"}   
# For Windows Users 
asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

@app.route('/')
@app.route('/cur_air_temp')
def cur_air_temp():
    return render_template('current_air_temp.html', the_title="Текущая температура воздуха") 

@app.route('/cur_air_hum')
def cur_air_hum():
    return render_template('current_air_hum.html', the_title="Текущущая влажность воздуха") 

@app.route('/cur_soil_hum')
def cur_soil_hum():
    return render_template('current_soil_hum.html', the_title="Текущая влажность почвы") 

@app.route('/ajax/at/current')
def at_current():
    connection = get_db_connection()
    counters = current_counters()
    save(counters)
    at = slice_array(counters["ath"], "temperature")
    res = {}
    res['temperature'] = at
    states = get_states(connection)
    res['state'] = states["wnd"]
    if at[4] < states["minT"] and states["wnd"] == 0:
        res['enabled'] = False
    else:
        res['enabled'] = True
    return json.dumps(res)

@app.route('/ajax/ah/current')
def ah_current():
    connection = get_db_connection()
    counters = current_counters()
    save(counters)
    ah = slice_array(counters["ath"], "humidity")
    res = {}
    res['humidity'] = ah
    states = get_states(connection)
    res['state'] = states["aw"]
    if ah[4] > states["maxAH"] and states["aw"] == 0:
        res['enabled'] = False
    else:
        res['enabled'] = True
    return json.dumps(res)


@app.route('/ajax/sh/current')
def sh_current():
    counters = current_counters()
    save(counters)
    sh = slice_array(counters["sh"], "humidity")

    res = {}
    res['humidity'] = sh
    connection = get_db_connection()
    states = get_states(connection)
    res['states'] = []
    res['enabled'] = []
    for i in range(1,7):
        res['states'].append(states[f"swat{i}"])    
        if sh[i-1] > states['maxSH'] and states[f"swat{i}"] == 0:
            res['enabled'].append(False)
        else:
            res['enabled'].append(True)
    return json.dumps(res)

@app.route('/settings', methods=['GET', 'POST'])
def settings():
    connection = get_db_connection()
    values = get_states(connection)
    if request.method == 'POST':
        cur = connection.cursor()
        cur.execute(f"UPDATE States SET minT={request.form['minT']}, maxAH={request.form['maxAH']}, maxSH={request.form['maxSH']} WHERE id=1")
        connection.commit()
        connection.close()
        values = request.form

    return render_template('settings.html', the_title='Настройки', values=values)


@app.route('/dynamics_at/<int:num>')
def dynamics_at(num):
    title = f"Динамика температуры воздуха датчика {num}" if num < 5 else "Динамика средней температуры воздуха"
    return render_template('dynamics_at.html', the_title=title, the_num=num)

@app.route('/dynamics_ah/<int:num>')
def dynamics_ah(num):
    title = f"Динамика влажности воздуха датчика {num}" if num < 5 else "Динамика средней влажности воздуха"
    return render_template('dynamics_ah.html', the_title=title, the_num=num)

@app.route('/dynamics_sh/<int:num>')
def dynamics_sh(num):
    title = f"Динамика влажности почвы датчика {num}" if num < 7 else "Динамика среднего"
    return render_template('dynamics_sh.html', the_title=title, the_num=num)


@app.route('/ajax/at/<int:num>')
def data_at(num):
    counters = current_counters()
    save(counters)
    connection = get_db_connection()
    cur = connection.cursor()
    fld = f"temp{num}" if num < 4 else "temp_aver"
    res = cur.execute(f"SELECT datetime(created, 'localtime'), {fld} FROM Counters").fetchall()
    connection.close()
    return json.dumps(res)

@app.route('/ajax/ah/<int:num>')
def data_ah(num):
    counters = current_counters()
    save(counters)
    connection = get_db_connection()
    cur = connection.cursor()
    fld = f"hum{num}" if num < 4 else "hum_aver"
    res = cur.execute(f"SELECT datetime(created, 'localtime'), {fld} FROM Counters").fetchall()
    connection.close()
    return json.dumps(res)

@app.route('/ajax/sh/<int:num>')
def data_sh(num):
    counters = current_counters()
    save(counters)
    connection = get_db_connection()
    cur = connection.cursor()
    fld = f"soilhum{num}" if num < 7 else "soilhum_aver"
    res = cur.execute(f"SELECT datetime(created, 'localtime'), {fld} FROM Counters").fetchall()
    connection.close()
    return json.dumps(res)

@app.route('/ajax/window_button') #Обработка кнопки форточки
def window_button():
    connection = get_db_connection()
    states = get_states(connection)
    val = 1 - states['wnd']
    res = requests.patch(f'https://dt.miet.ru/ppo_it/api/fork_drive?state={val}', headers=headers)
    if res.status_code == 200:
        cur = connection.cursor()
        cur.execute(f"UPDATE States SET wnd={val} WHERE id=1")
        connection.commit()
        connection.close()
    else:
        val = 1 - val
    resp = {'windows':val}
    return json.dumps(resp)

@app.route('/ajax/water_button/<int:num>') #Обработка кнопки полива
def water_button(num):
    connection = get_db_connection()
    states = get_states(connection)
    val = 1 - states[f'swat{num}']
    res = requests.patch(f'https://dt.miet.ru/ppo_it/api/watering?id={num}&state={val}', headers=headers)
    if res.status_code == 200:
        cur = connection.cursor()
        cur.execute(f"UPDATE States SET swat{num}={val} WHERE id='1'")
        connection.commit()
        connection.close
    else:
        val = 1 - val
    resp = {'watering':val}
    return json.dumps(resp)
    # with aiohttp.ClientSession('https://dt.miet.ru', headers=headers) as httpsession:
    #     httpsession.patch()

@app.route("/ajax/load_w_buttons/") #Загрузка статуса полива
def wateringbuttons():
    connection = get_db_connection()
    states = get_states(connection)
    res = [states[f'swat{num}'] for num in range(1,7)]
    resp = {}
    for num in range(1,7):
        resp[f'swat{num}'] = res[num - 1]
    pprint(resp)
    return json.dumps(resp)

@app.route("/ajax/load_wnd/") #Загрузка статуса форотчки
def loadwnd():
    connection = get_db_connection()
    states = get_states(connection)
    resp = {"windows": states["wnd"]}
    connection.close()
    return json.dumps(resp)

@app.route('/ajax/wetter_button/') #Обработка кнопки увлажнителя
def wetter_button():
    connection = get_db_connection()
    states = get_states(connection)
    val = 1 - states['aw']
    res = requests.patch(f'https://dt.miet.ru/ppo_it/api/total_hum?state={val}', headers=headers)
    if res.status_code == 200:
        cur = connection.cursor()
        cur.execute(f"UPDATE States SET aw={val} WHERE id=1")
        connection.commit()
        connection.close()
    else:
        val = 1 - val
    resp = {'wetter':val}
    return json.dumps(resp)

@app.route("/ajax/load_wet/")
def load_wet():
    connection = get_db_connection()
    states = get_states(connection)
    resp = {"wetter": states["aw"]}
    return json.dumps(resp)
    
def get_states(connection): #Получить значение таблицы States
    connection.row_factory = sqlite3.Row
    cur = connection.cursor()
    states = cur.execute("SELECT * from States").fetchone()
    return states




# Массив объектов (словарей) превращает в массив чисел, взятых из поля key словаря
def slice_array(obj_arr, key):
    return [obj[key] for obj in obj_arr]

def save(counters):
    '''Сохранение текущих счетчиков в бд. counters словарь, который возвращается из async_req'''

    ah = slice_array(counters["ath"], "humidity")
    at = slice_array(counters["ath"], "temperature")
    sh = slice_array(counters["sh"], "humidity")

    connection = get_db_connection()
    cur = connection.cursor()
    cur.execute("INSERT INTO Counters (hum1, hum2, hum3, hum4, hum_aver, temp1, temp2, temp3, temp4, temp_aver, soilhum1, soilhum2, soilhum3, soilhum4, soilhum5, soilhum6, soilhum_aver) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (ah[0], ah[1], ah[2], ah[3], ah[4], 
            at[0], at[1], at[2], at[3], at[4], 
            sh[0], sh[1], sh[2], sh[3], sh[4], sh[5], sh[6]))
    connection.commit()
    connection.close()

async def async_req():
    ''' Асинхронные параллельные запросы всех датчиков. 
    Результаты возвращаются в словаре вида
    {
        'ath': [{'humidity': 76.95, 'id': 1, 'temperature': 28.32},
                {'humidity': 44.39, 'id': 2, 'temperature': 28.5},
                {'humidity': 61.96, 'id': 3, 'temperature': 30.67},
                {'humidity': 36.71, 'id': 4, 'temperature': 29.66}
               ],
        'sh':  [{'humidity': 67.12, 'id': 1},
                {'humidity': 74.14, 'id': 2},
                {'humidity': 73.27, 'id': 3},
                {'humidity': 66.06, 'id': 4},
                {'humidity': 67.83, 'id': 5},
                {'humidity': 66.51, 'id': 6}
               ]
    }
    '''
    tasks = []
    result = {}
    # Единая сессия для всех запросов, чтобы не рвать соединение 
    async with aiohttp.ClientSession('https://dt.miet.ru', headers=headers) as httpsession:
        # Создаем задачи для запроса датчиков воздуха
        for hum in range(1, 5):
            tasks.append(asyncio.create_task(httpsession.get(f'/ppo_it/api/temp_hum/{hum}')))

        # Создаем задачи для запроса датчиков почвы
        for s in range(1,7):   
            tasks.append(asyncio.create_task(httpsession.get(f'/ppo_it/api/hum/{s}')))

        # Выполняем все запросы конкурентно (параллельно) и дожидаемся всех результатов
        responses = await asyncio.gather(*tasks)

        #Результаты в responses идут в том же порядке, что и в запросе. Кладем их в словарь result
        # Датчики воздуха
        result["ath"] = []
        ath = result["ath"]
        for i in range(4):
            jresp = json.loads(await responses[i].text())
            ath.append(jresp)

        # Датчики почвы
        result["sh"] = []
        sh = result["sh"]
        for i in range(4, 10):
            jresp = json.loads(await responses[i].text())
            sh.append(jresp)

        return result


def current_counters():
    '''Запрос датчиков через API. Синхронная обертка для async_req.
    Результаты возвращаются в словаре вида
    {
        'ath': [{'humidity': 76.95, 'id': 1, 'temperature': 28.32},
                {'humidity': 44.39, 'id': 2, 'temperature': 28.5},
                {'humidity': 61.96, 'id': 3, 'temperature': 30.67},
                {'humidity': 36.71, 'id': 4, 'temperature': 29.66},
                {'humidity': 36.71, 'id': 'average', 'temperature': 29.66}
               ],
        'sh':  [{'humidity': 67.12, 'id': 1},
                {'humidity': 74.14, 'id': 2},
                {'humidity': 73.27, 'id': 3},
                {'humidity': 66.06, 'id': 4},
                {'humidity': 67.83, 'id': 5},
                {'humidity': 66.51, 'id': 6},
                {'humidity': 66.51, 'id': 'average'}
               ]
    }
    '''

    start_timestamp = time.time()
    result = asyncio.run(async_req())
    task_time = round(time.time() - start_timestamp, 2)
    print(f"|async_req Total time: {task_time} s |")

    # Считаем и записываем в result средние
    hums = slice_array(result["ath"], "humidity")
    hum_avg = round(mean(hums),2)
    temps = slice_array(result["ath"], "temperature")
    temp_avg = round(mean(temps),2)
    result["ath"].append({'humidity': hum_avg, 'id': 'average', 'temperature': temp_avg});

    hums = slice_array(result["sh"], "humidity")
    hum_avg = round(mean(hums),2)
    result["sh"].append({'humidity': hum_avg, 'id': 'average'});

    # pprint(result)
    return result


if __name__ == '__main__':
    app.run(debug=False)