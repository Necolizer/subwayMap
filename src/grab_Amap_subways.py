# 修改自 https://blog.csdn.net/a284365/article/details/117933425

import time
import requests
import json
from lxml import etree
import os
from tqdm import tqdm

headers = {
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3947.100 Safari/537.36 2345Explorer/10.11.0.20694'}
    

def get_city(save_dir):
    url = 'http://map.amap.com/subway/index.html?&1100'
    time.sleep(2)
    res = requests.get(url=url, headers=headers)
    res.raise_for_status()
    res.encoding = res.apparent_encoding
    html = res.text
    Html = etree.HTML(html)

    res1 = Html.xpath('/html/body/div[1]/div[1]/div[1]/div[2]/div[1]/a')
    res2 = Html.xpath('/html/body/div[1]/div[1]/div[1]/div[2]/div[2]/div[2]/*')

    extra = [{'id': '3402', 'cityname':'wuhu', 'name':'芜湖'}, {'id': '3411', 'cityname':'chuzhou', 'name':'滁州'}, 
             {'id': '3306', 'cityname':'shaoxing', 'name':'绍兴'}, {'id': '3307', 'cityname':'jinhua', 'name':'金华'},
             {'id': '3310', 'cityname':'taizhou', 'name':'台州'}, {'id': '4303', 'cityname':'xiangtan', 'name':'湘潭'},
             {'id': '4331', 'cityname':'xiangxi', 'name':'湘西'}, {'id': '3206', 'cityname':'nantong', 'name':'南通'},
             {'id': '8200', 'cityname':'aomen', 'name':'澳门'}]
    
    with tqdm(total=len(extra), desc='Processing') as pbar:
        for i in extra:
            # 城市ID值
            ID = i['id']
            # 城市拼音名
            cityname = i['cityname']
            # 城市名
            name = i['name']
            get_message(ID, cityname, name, save_dir)
            pbar.update(1)

    with tqdm(total=len(res1), desc='Processing') as pbar:
        for i in res1:
            # 城市ID值
            ID = ''.join(i.xpath('.//@id'))  # 属性需要加上双斜杠
            # 城市拼音名
            cityname = ''.join(i.xpath('.//@cityname'))  # ./表示在当层目录下使用
            # 城市名
            name = ''.join(i.xpath('./text()'))
            get_message(ID, cityname, name, save_dir)
            city_ID.update({name: ID})
            pbar.update(1)

    with tqdm(total=len(res2), desc='Processing') as pbar:
        for i in res2:
            # 城市ID值
            ID = ''.join(i.xpath('.//@id'))
            # 城市拼音名
            cityname = ''.join(i.xpath('.//@cityname'))
            # 城市名
            name = ''.join(i.xpath('./text()'))
            get_message(ID, cityname, name, save_dir)
            pbar.update(1)

city_ID = {}

def get_message(ID, cityname, name, save_dir):
    """
    地铁线路信息获取
    """
    url = 'http://map.amap.com/service/subway?_1555502190153&srhdata=' + ID + '_drw_' + cityname + '.json'
    global stations
    response = requests.get(url=url, headers=headers)
    time.sleep(2)
    html = response.text
    result = json.loads(html)
    with open(os.path.join(save_dir, name+'.json'), "w", encoding = 'utf8') as f:
        json.dump(result, f, ensure_ascii=False, indent=4)


def change_center(path, new_path):
    with tqdm(total=len(os.listdir(path)), desc='Processing') as pbar:
        for city in os.listdir(path):
            with open(os.path.join(new_path, city), "w", encoding = 'utf8') as t:
                with open(os.path.join(path, city), 'r', encoding = 'utf8') as f:
                    js = json.load(f)

                    original_center = [ float(c) for c in js['o'].split(',')]
                    max_x = original_center[0]*2
                    max_y = original_center[1]*2

                    for line in js['l']:
                        for st in line['st']:
                            x_y = [ float(c) for c in st["p"].split(' ')]
                            if max_x < x_y[0]:
                                max_x = x_y[0]

                            if max_y < x_y[1]:
                                max_y = x_y[1]
                    
                    new_center = '{:.1f}'.format(max_x/2) + ',' + '{:.1f}'.format(max_y/2)
                    js['o'] = new_center
                    json.dump(js, t, ensure_ascii=False, indent=4)
                    pbar.update(1)


# def get_district(df_data):#用于得到每个地铁站点的行政区
#     url1 = 'https://www.youbianku.com/SearchResults?address='
#     # response=requests.get(url=url1,headers=headers)
#     # response.enconding='utf-8'
#     # print(response.text)
#     from selenium.webdriver.common.desired_capabilities import DesiredCapabilities
#     chrome_options = webdriver.ChromeOptions()
#     desired_capabilities = DesiredCapabilities.CHROME
#     desired_capabilities["pageLoadStrategy"] = "none"
#     chrome_options.add_argument('--headless')
#     chrome_options.add_argument('--disable-gpu')
#     driver = webdriver.Chrome(options=chrome_options,
#                               executable_path=r'C:\Users\Dcnightmare\Desktop\chromedriver')
#     list_city=[]
#     last_text=''
#     # driver.get(url='https://www.youbianku.com')
#     for i in list(zip(df_data['站点城市'].values, df_data['地铁站点名称'])):
#         driver.get(url=url1 + ''.join(list(i)))
#         # driver.find_element_by_id('mySearchInput').send_keys(''.join(list(i)))
#         # driver.find_element_by_id('mySearchButton').click()
#         html_from_page = driver.page_source
#         html = etree.HTML(html_from_page)
#         try:
#             text = html.xpath('//div[@class="mw-parser-output"]/div[1]//table//tr[2]/td/text()')[0]
#             text = text.split('市')[1].split('区')[0] + '区'
#         except Exception:
#             driver.execute_script("window.stop()")
#             list_city.append(last_text)
#             continue
#         if text=='区':
#             list_city.append(last_text)
#             continue
#         last_text=text
#         list_city.append(last_text)
#     df_data['行政区']=list_city

get_city(r'./old_json')
change_center(r'./old_json', r"./new_json")