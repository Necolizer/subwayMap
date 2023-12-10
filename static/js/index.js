function drawLine(x1, y1, x2, y2, stroke, stroke_width, opacity, lineCap='butt', lineJoin='miter') {
    const svgNS = "http://www.w3.org/2000/svg";
    const line = document.createElementNS(svgNS, 'line');
    
    // Set line coordinates
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    
    // Set line styling
    line.setAttribute('stroke', stroke);
    line.setAttribute('stroke-width', stroke_width);
    line.setAttribute('opacity', opacity);
    
    // Additional attributes
    line.setAttribute('stroke-linecap', lineCap); // Options: butt, round, square
    line.setAttribute('stroke-linejoin', lineJoin); // Options: miter, round, bevel
    
    return line;
}

function drawCircle(cx, cy, radius, fill, stroke, stroke_width, opacity, fill_opacity) {
    const svgNS = "http://www.w3.org/2000/svg";
    const circle = document.createElementNS(svgNS, 'circle');

    // Set circle attributes
    circle.setAttribute('cx', cx);
    circle.setAttribute('cy', cy);
    circle.setAttribute('r', radius);

    // Set circle styling
    circle.setAttribute('fill', fill);
    circle.setAttribute('stroke', stroke);
    circle.setAttribute('stroke-width', stroke_width);
    circle.setAttribute('opacity', opacity);
    circle.setAttribute('fill-opacity', fill_opacity);

    return circle;
}

const { kmeans } = require('ml-kmeans');
const k = 6;
// const jsonFilePath = './static/json/成都.json';
// const visualization = document.getElementById('visualization1');
// const caption = document.getElementById('caption1');
// caption.textContent = '成都';
const raw_width = 1980;
const raw_height = 1280;
const city_boundary = 250;
const draw_offset = 25;
const city_circle_r = 142;

// function distort(x, k) {
//     return Math.tanh(k * (2 * x - 1)) / 2 + 0.5;
// }

function splitPString(s) {
    const numberStrings = s.split(' ');
    const number1 = draw_offset + Math.max(0, parseInt(numberStrings[0], 10) / raw_width) * city_boundary;
    const number2 = draw_offset + Math.max(0, parseInt(numberStrings[1], 10) / raw_height) * city_boundary;
    return [number1, number2];
}

function calculateRadius(x1, y1, x2, y2) {
    const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    const radius = distance / 2;
    return radius;
}

// const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
// svg.setAttribute("width", "100%");
// svg.setAttribute("height", "100%");
// visualization.appendChild(svg);


function parseData(jsonData, svg){
    //解析一个城市JSON的数据

    const city_subway_name = jsonData.s;
    const city_subway_id = jsonData.i;

    // 最外圈黑圆
    city_circle = drawCircle(150, 150, city_circle_r, '#E9D4C7', '#261E25', '15px', '0.9', '0.6');
    svg.appendChild(city_circle);

    let max_st_num = 0;
    let min_st_num = 100;
    jsonData.l.forEach(line =>{
        if (max_st_num < line.st.length){
            max_st_num = line.st.length;
        }
        if (min_st_num > line.st.length){
            min_st_num = line.st.length;
        }
    }
    )

    const trans_points = [];

    for (const subwayline of jsonData.l) {
        const line_name = subwayline.ln;
        const is_loop = subwayline.lo;
        const color = subwayline.cl;
        const station_num = subwayline.st.length;
        // subwayline.st.forEach(station => {
        //     if (station.t == "1"){
        //         const [w, h] = splitPString(station.p);
        //         circle = drawCircle(w, h, 3, '#' + color, 'black', '1px', '0.5', '0.5');
        //         svg.appendChild(circle);
        //     }
        // });
        
        subwayline.st.forEach(station => {
            if (station.t == "1"){
                const [w, h] = splitPString(station.p);
                trans_points.push([w, h]);
            }
        });

        if (is_loop == '1'){
            const first_station = subwayline.st[0];
            const [x1, y1] = splitPString(first_station.p);
            const mid_station = subwayline.st[Math.floor(station_num/2)];
            const [x2, y2] = splitPString(mid_station.p);
            thickness = 0.25 + (station_num-min_st_num)/(max_st_num-min_st_num) * 4.25;
            circle = drawCircle((x1+x2)/2, (y1+y2)/2, calculateRadius(x1, y1, x2, y2), '#' + color, '#' + color, thickness.toFixed(2) + 'px', '0.7', '0.5');
            svg.appendChild(circle);
        }else
        {
            const first_station = subwayline.st[0];
            const [x1, y1] = splitPString(first_station.p);
            const last_station = subwayline.st[station_num - 1];
            const [x2, y2] = splitPString(last_station.p);
            thickness = 0.25 + (station_num-min_st_num)/(max_st_num-min_st_num) * 5.75;
            line = drawLine(x1, y1, x2, y2, '#' + color, thickness.toFixed(2) + 'px', '0.7');
            svg.appendChild(line);
        }
    }

    const clustering_res = kmeans(trans_points, k).computeInformation(trans_points);
    clustering_res.forEach(clus => {
        circle = drawCircle(clus.centroid[0], clus.centroid[1], clus.size, 'black', 'black', '1px', '0.5', '0.5');
        svg.appendChild(circle);
    });
}

function initializeVCPair(visualizationId, filePaths, captionId, initialCaption) {
    const visualization = document.getElementById(visualizationId);
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    visualization.appendChild(svg);

    // Add your drawing logic here...
    $.ajax({
        url: filePaths,
        type: "GET",
        dataType: "json",
        success: 
        function (data) {
            parseData(data, svg)
        }
    });

    // Set the initial caption text
    const caption = document.getElementById(captionId);
    caption.textContent = initialCaption;
}

const path = require('path');
const folderPath = './static/json';
const visualizationContainer = document.getElementById('visualization-container');

const files = ['北京.json', '上海.json', '广州.json', '深圳.json', '成都.json', '东莞.json', 
'杭州.json', '乌鲁木齐.json', '佛山.json', '兰州.json', '南京.json', '南宁.json', '南昌.json', 
'厦门.json', '合肥.json', '呼和浩特.json', '哈尔滨.json', '大连.json', '天津.json', '太原.json', 
'宁波.json', '常州.json', '徐州.json',  '无锡.json', '昆明.json',  
'武汉.json', '沈阳.json', '洛阳.json', '济南.json',  '温州.json', '石家庄.json', 
'福州.json', '苏州.json', '西安.json', '贵阳.json', '郑州.json', '重庆.json', '长春.json', 
'长沙.json', '青岛.json', '香港.json']

// const files = ['广州.json', '成都.json']

for (let i = 0; i < files.length; i++){
    const city_name = files[i].split('.json')[0]
    const filePaths = path.join(folderPath, files[i]);
    const v_c_pair = document.createElement('div');
    v_c_pair.classList.add('v-c-pair-container');

    const visualizationId = `visualization${i}`;
    const captionId = `caption${i}`;
    const initialCaption = city_name;

    v_c_pair.innerHTML = `
        <div class="visualization" id="${visualizationId}"></div>
        <div class="caption zhimangxing" id="${captionId}">${initialCaption}</div>
    `;

    visualizationContainer.appendChild(v_c_pair);

    initializeVCPair(visualizationId, filePaths, captionId, initialCaption);
}



