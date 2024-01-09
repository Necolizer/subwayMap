# 中国城市地铁系统可视化

## Introduction
该项目旨在可视化中国城市地铁系统相关数据，项目主页：https://necolizer.github.io/subwayMap/

受到 1923 年 *Wassily Kandinsky* 的画作 *Circles in a Circle* 的启发，我们追求用抽象的艺术表达方式概括各个城市地铁线路拓扑结构的独特特点。

可视化目的与效果预期如下：
- **抽象表达拓扑结构**：借鉴艺术作品的冲击力和简洁性，以抽象艺术表现方式呈现城市地铁线路的拓扑结构，让人们更直观地理解地铁网络。
- **城市对比展示**：通过视觉方式展现中国不同城市的地铁网络，对比不同城市之间地铁系统的规模和布局，以便于比较和分析。
- **反映城市规划与经济特征**：根据换乘站点数量和分布进行可交互的K-Means聚类，结合聚类结果展现城市规划和区域经济发展特征，帮助读者理解城市的发展格局。
- **时间维度下的变迁展示**：随着时间推移，可交互地展现不同城市地铁线路的发展变迁，帮助人们了解地铁系统的演变和城市发展的历程。

推荐在PC端使用Chrome/Edge/Firefox浏览器访问[可视化项目主页](https://necolizer.github.io/subwayMap/)，其余平台或浏览器未测试

## Customization
### Browserify
`index.js`更改后需要使用browserify更新`indexBundle.js`，命令如下：
```bash
cd ./subwayMap
node_modules\.bin\browserify .\static\js\index.js -o .\static\js\indexBundle.js
```

## References
1. [*Circles in a Circle* (1923) - Wassily Kandinsky](https://www.wassilykandinsky.net/work-247.php)
2. [*globalmetro*|PKU Viz](https://vis.pku.edu.cn/blog/globalmetro/)
3. [ml-kmeans](https://github.com/mljs/kmeans)
4. [高德地图地铁线路](https://map.amap.com/subway/index.html?&1100)
5. [Json笔记-高德地铁数据分析](https://blog.csdn.net/qq78442761/article/details/122054519)
6. [全国地铁城市数据分析（python实现）](https://blog.csdn.net/a284365/article/details/117933425)
7. [Rubber Slider](https://codepen.io/aaroniker/pen/VwZOOxz)
8. [Dropdown menu interaction](https://codepen.io/aaroniker/pen/MWgjERQ)
9. [DataV.GeoAtlas](https://datav.aliyun.com/portal/school/atlas/area_selector)
