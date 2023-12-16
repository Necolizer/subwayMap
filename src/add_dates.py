import requests
from bs4 import BeautifulSoup
import os
import json


def fetch_all_tables_from_baidu_baike(url):
    response = requests.get(url)

    if response.status_code == 200:
        soup = BeautifulSoup(response.text, 'html.parser')
        tables = soup.find_all('table')
        if tables:
            for table in tables:
                rows = table.find_all('tr')
                for row in rows:
                    columns = row.find_all(['th', 'td'])
                    # for column in columns:
                    column_list = [column.get_text(strip=True) for column in columns]
                    if len(column_list) == 2:
                        all_list.append(column_list)
                    elif len(column_list) > 2:
                        tmp_list = []
                        tmp_list.append(column_list[-3])
                        tmp_list.append(column_list[-2])
                        all_list.append(tmp_list)
        else:
            print("未找到表格信息")
    else:
        print("无法获取页面内容")


json_folder_path = r"./new_json"
file_names = os.listdir(json_folder_path)
all_json_file = []
for file in file_names:
    file_name, file_extension = os.path.splitext(file)
    all_json_file.append(file_name)

all_list = []
url = 'https://baike.baidu.com/item/%E4%B8%AD%E5%9B%BD%E5%9F%8E%E5%B8%82%E8%BD%A8%E9%81%93%E4%BA%A4%E9%80%9A%E7%BA%BF%E8%B7%AF/24346585'
fetch_all_tables_from_baidu_baike(url)
tuple_list = [tuple(sub_list) for sub_list in all_list]
unique_tuples = list(set(tuple_list))
unique_list = [list(sub_tuple) for sub_tuple in unique_tuples]
key_value_pairs = {item[0]: item[1] for item in unique_list if
                   '地铁' in item[0] or
                   '轨道交通' in item[0] or
                   '港铁' in item[0] or
                   '台州' in item[0] or
                   '北京现代有轨电车西郊线' in item[0] or
                   '上海磁浮' in item[0]}
processed_data = {}

for key, value in key_value_pairs.items():
    line_info = ""
    location = ""
    if '地铁' in key:
        location, line_info = key.split('地铁')
    elif '轨道交通' in key:
        location, line_info = key.split('轨道交通')
    elif '港铁' in key:
        _, line_info = key.split('港铁')
        location = '香港'
    elif '台州' in key:
        line_info = 'S1线'
        location = '台州'
    elif '上海磁浮' in key:
        line_info = '磁悬浮'
        location = '上海'
    elif '北京现代有轨电车西郊线' in key:
        line_info = '西郊线'
        location = '北京'
    # line, date = line_info.split(':')
    line = line_info
    date = value
    if line == '大兴机场线':
        line = '大兴国际机场线'
    if line == '迪士尼线':
        line = '迪士尼'
    if location not in processed_data:
        # processed_data[location] = [{"line": line, "date": date}]
        processed_data[location] = {}
        processed_data[location][line] = date
    else:
        # processed_data[location].append({"line": line, "date": date})
        processed_data[location][line] = date

processed_data['湘潭'] = {'长株潭西环线': '2023年6月28日'}
processed_data['澳门'] = {'氹仔线': '2019年12月10日'}
processed_data['湘西'] = {'凤凰磁浮观光快线': '2022年5月1日'}

processed_data['大连']['保税区线'] = '2019年12月28日'
processed_data['大连']['九里线'] = '2008年12月28日'
processed_data['大连']['九里支线'] = '2008年12月28日'
processed_data['佛山']['广佛线'] = '2010年11月3日'
processed_data['佛山']['7号线'] = '2022年5月1日'
processed_data['广州']['广佛线'] = '2010年11月3日'
processed_data['广州']['14号线支线(知识城线)'] = '2017年12月28日'
processed_data['广州']['佛山2号线'] = '2021年12月28日'
processed_data['广州']['3号线(北延段)'] = '2010年10月30日'
processed_data['杭州']['杭海城际'] = '2021年6月28日'
processed_data['绍兴']['1号线'] = '2021年6月28日'
processed_data['郑州']['城郊线'] = '2017年1月12日'
processed_data['郑州']['郑许线'] = '2022年10月1日'
processed_data['重庆']['江跳线'] = '2022年8月6日'
processed_data['长沙']['长株潭西环线'] = '2023年6月28日'
processed_data['长沙']['磁浮快线'] = '2016年5月6日'
processed_data['深圳']['1号线/罗宝线'] = '2004年12月28日'
processed_data['深圳']['坪山云巴1号线'] = '2022年12月28日'
processed_data['深圳']['2号线/8号线'] = '2010年12月28日'
processed_data['深圳']['3号线/龙岗线'] = '2010年12月28日'
processed_data['深圳']['4号线/龙华线'] = '2004年12月28日'
processed_data['深圳']['5号线/环中线'] = '2011年6月22日'
processed_data['深圳']['6号线/光明线'] = '2020年8月18日'
processed_data['深圳']['6号线支线'] = '2022年11月28日'
processed_data['深圳']['7号线/西丽线'] = '2016年10月28日'
processed_data['深圳']['9号线/梅林线'] = '2016年10月28日'
processed_data['深圳']['10号线/坂田线'] = '2020年8月18日'
processed_data['深圳']['11号线/机场线'] = '2016年6月28日'
processed_data['深圳']['12号线/南宝线'] = '2022年11月28日'
processed_data['深圳']['14号线/东部快线'] = '2022年10月28日'
processed_data['深圳']['16号线/龙坪线'] = '2022年12月28日'
processed_data['深圳']['20号线'] = '2021年12月28日'
processed_data['重庆']['6号线支线(国博线)'] = '2013年5月15日'
processed_data['重庆']['3号线北延伸段'] = '2016年12月28日'
processed_data['杭州']['绍兴1号线'] = '2021年6月28日'
processed_data['佛山']['佛山2号线'] = '2021年12月28日'
processed_data['佛山']['南海有轨电车1号线'] = '2021年8月18日'
processed_data['南京']['S8号线(宁天线)'] = '2014年8月1日'
processed_data['南京']['S3号线(宁和线)'] = '2017年12月6日'
processed_data['南京']['S1号线(机场线)'] = '2014年7月1日'
processed_data['南京']['S7号线(宁溧线)'] = '2018年5月26日'
processed_data['南京']['S9号线(宁高线)'] = '2017年12月30日'
processed_data['武汉']['21号线(阳逻线)'] = '2017年12月26日'
processed_data['苏州']['4号线支线'] = '2017年4月15日'
processed_data['金华']['金义东线金义段'] = '2022年8月30日'
processed_data['金华']['金义东线义东段'] = '2022年12月28日'
processed_data['北京']['1号线八通线'] = '1971年1月15日'
processed_data['北京']['4号线大兴线'] = '2009年9月28日'
keys_to_delete = []
for key in processed_data.keys():
    if key not in all_json_file:
        print(f"'{key}' 不在 JSON 文件夹中")
        keys_to_delete.append(key)

# 从processed_data中删除不在JSON文件夹中的键值对
for key in keys_to_delete:
    del processed_data[key]

for key, value in processed_data.items():
    if isinstance(value, set):
        processed_data[key] = list(value)

# with open('key_value_pairs.json', 'w', encoding='utf-8') as file:
#     json.dump(processed_data, file, ensure_ascii=False, indent=4)

print('-----------------------------')

for i in all_json_file:
    if i not in processed_data.keys():
        print(i)

print(len(processed_data.keys()))
print(len(all_json_file))

file_names = os.listdir(json_folder_path)
json_files = [os.path.join(json_folder_path, file) for file in file_names if file.endswith('.json')]

for file_path in json_files:
    with open(file_path, 'r', encoding='utf-8') as file:
        content = json.load(file)
        file_name_with_extension = os.path.basename(file_path)
        location = os.path.splitext(file_name_with_extension)[0]
        for i in content['l']:
            line = i['ln']
            lines = processed_data.get(location, {})
            date = lines.get(line)
            if date:
                i['start_date'] = date
            else:
                baike_lines = processed_data[location].keys()
                for bl in baike_lines:
                    if bl in line:
                        date = lines.get(bl)
                if not any(bl in line for bl in baike_lines):
                    print(location, line)

        new_json_folder_path = r"./new_json_1"
        os.makedirs(new_json_folder_path, exist_ok=True)
        new_file_path = new_json_folder_path + f'/{file_name_with_extension}'  # 新文件名，可以根据需要修改

        with open(new_file_path, 'w', encoding='utf-8') as new_file:
            json.dump(content, new_file, ensure_ascii=False, indent=4)

