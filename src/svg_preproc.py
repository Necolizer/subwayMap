import os
import xml.etree.ElementTree as ET
import re

def extract_commands_and_numbers(input_string):
    # 使用正则表达式匹配连续的字母和数字
    matches = re.findall(r'([a-zA-Z]+)([0-9]+)\s*([0-9]+)?', input_string)

    # 初始化列表
    commands_list = []
    numbers_list = []

    # 遍历匹配结果
    for match in matches:
        command = match[0]
        number1 = int(match[1])

        # 如果有第二个数字，将其添加到列表
        if match[2]:
            number2 = int(match[2])
            numbers_list.append([number1, number2])
        else:
            numbers_list.append([number1])

        # 将字母添加到列表
        commands_list.append(command)

    return commands_list, numbers_list

def adjust_path_positions(input_folder, output_folder):
    # 确保输出文件夹存在
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    # 遍历输入文件夹中的所有SVG文件
    for filename in os.listdir(input_folder):
        if filename.endswith(".svg"):
            input_filepath = os.path.join(input_folder, filename)

            # 读取SVG文件
            tree = ET.parse(input_filepath)
            root = tree.getroot()

            # 获取路径元素
            paths = root.findall('.//{http://www.w3.org/2000/svg}path')

            # 初始化包围盒的最小和最大坐标
            min_x = float('inf')
            max_x = float('-inf')
            min_y = float('inf')
            max_y = float('-inf')

            # 正则表达式用于匹配坐标
            coord_pattern = re.compile(r'([-+]?\d*\.\d+|\d+)')

            # 计算所有路径的最小包围盒
            for path in paths:
                path_data = path.get('d')
                matches = coord_pattern.findall(path_data)

                for i in range(0, len(matches), 2):
                    x = float(matches[i])
                    y = float(matches[i + 1])

                    min_x = min(min_x, x)
                    max_x = max(max_x, x)
                    min_y = min(min_y, y)
                    max_y = max(max_y, y)

            # 计算包围盒中心坐标
            bbox_center_x = (min_x + max_x) / 2
            bbox_center_y = (min_y + max_y) / 2

            # 获取SVG的宽度和高度
            width = float(root.attrib['width'].replace('px', ''))
            height = float(root.attrib['height'].replace('px', ''))

            # 计算画布中心坐标
            canvas_center_x = width / 2
            canvas_center_y = height / 2

            # 计算移动的差值
            diff_x = round(canvas_center_x - bbox_center_x)
            diff_y = round(canvas_center_y - bbox_center_y)

            # 遍历每个路径元素，移动坐标并加上M和L命令
            for path in paths:
                path_data = path.get('d')
                # matches = coord_pattern.findall(path_data)
                commands_list, numbers_list = extract_commands_and_numbers(path_data)

                path_commands = ""

                for i, xy in enumerate(numbers_list):
                    path_commands += commands_list[i]
                    x = round(float(xy[0]) + round(diff_x))
                    path_commands += str(x)
                    path_commands += ' '

                    y = round(float(xy[1]) + round(diff_y))
                    path_commands += str(y)


                # 更新路径数据
                path.set('d', path_commands)
                path.set('viewBox', "-95 -49 1140 587")
                path.set('style', "transform: translate3d(-95px, -49px, 0px);")

            # 保存调整后的SVG文件
            output_filepath = os.path.join(output_folder, filename)
            tree.write(output_filepath)

if __name__ == "__main__":
    input_folder_path = r'./old_svgs'  # 替换成你的输入文件夹路径
    output_folder_path = r'./new_svgs'  # 替换成你的输出文件夹路径

    adjust_path_positions(input_folder_path, output_folder_path)
    print("SVG files processed and saved to the output folder.")

