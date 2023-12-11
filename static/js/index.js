function drawLine(x1, y1, x2, y2, stroke, stroke_width, opacity, lineCap='butt', lineJoin='miter') {
    // This function is used to draw a line

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
    
    // 鼠标悬停、显示信息
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;

    // Additional code to handle mouseover event
    line.addEventListener('mouseover', function(event) {
        // Create a text element for displaying information
        const text = document.createElementNS("http://www.w3.org/2000/svg", 'text');
        text.setAttribute('x', midX);
        text.setAttribute('y', midY);
        text.setAttribute('fill', 'black');
        text.setAttribute('font-size', '12');
        
        // Information about the line's starting and ending points
        const startingPoint = `Start: (${x1}, ${y1})`;
        const endingPoint = `End: (${x2}, ${y2})`;

        // Create two tspan elements for start and end points
        const startTspan = document.createElementNS("http://www.w3.org/2000/svg", 'tspan');
        startTspan.textContent = startingPoint;
        startTspan.setAttribute('x', midX);
        startTspan.setAttribute('dy', '1.2em');

        const endTspan = document.createElementNS("http://www.w3.org/2000/svg", 'tspan');
        endTspan.textContent = endingPoint;
        endTspan.setAttribute('x', midX);
        endTspan.setAttribute('dy', '1.2em');

        // Append tspans to text element
        text.appendChild(startTspan);
        text.appendChild(endTspan);

        // Append text element to the SVG
        svg.appendChild(text);

        // Save the text element reference to remove it on mouseout
        line.hoverText = text;
    });

    // Additional code to handle mouseout event
    line.addEventListener('mouseout', function(event) {
        // Remove the displayed information when mouse moves away from the line
        if (line.hoverText) {
            svg.removeChild(line.hoverText);
            line.hoverText = null;
        }
    });

    return line;
}

function drawCircle(cx, cy, radius, fill, stroke, stroke_width, opacity, fill_opacity, pointerEvents=true) {
    // This function is used to draw a circle

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

    if (!pointerEvents){
        circle.style.pointerEvents = "none";
    }

    return circle;
}

const { kmeans } = require('ml-kmeans');
const k = 6;
const city_boundary = 80; //120;
const draw_offset = 100; //150; // Half the canvas width, and also height
const city_circle_r = 95; //142;
const city_circle_thickness = 10; //15;
const thickness_offset = 0.16; //0.25;
const thickness_weight = 3.8; //5.75;
const interchange_st_circle_r_weight = 0.67; //1.0;

function splitPString(s, city_center) {
    // This function is used to convert position strings (e.g. "1000 400") to 
    // a list of integers indicating [x, y] position on the canvas
    // @ s: string (e.g. "1000 400")
    // @ city_center: list of string (e.g. ["6000", "200"])
    // Return: list of integers

    const numberStrings = s.split(' ');
    const city_centor_x = parseInt(city_center[0], 10);
    const city_centor_y = parseInt(city_center[1], 10);
    const number0 = draw_offset + (parseInt(numberStrings[0], 10) - city_centor_x) / city_centor_x * city_boundary;
    const number1 = draw_offset + (parseInt(numberStrings[1], 10) - city_centor_y) / city_centor_y * city_boundary;
    return [number0, number1];
}

function calculateRadius(x1, y1, x2, y2) {
    // This function gets the radius of the circle whose center is the middle point of line [x1, y1] to [x2, y2]

    const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    const radius = distance / 2;
    return radius;
}

function parseData(jsonData, svg, subcaptionId){
    // This function parses a city JSON file

    const city_subway_name = jsonData.s;
    const city_subway_id = jsonData.i;
    const city_center = jsonData.o.split(',');

    const subcaption_text = "|" + city_subway_name + "[" + city_subway_id + "]";
    const subcaption = document.getElementById(subcaptionId);
    subcaption.innerHTML = `${subcaption_text}`;

    // Draw the outside black circle
    city_circle = drawCircle(draw_offset, draw_offset, city_circle_r, '#E9D4C7', '#261E25', city_circle_thickness.toFixed(2) + 'px', '0.9', '0.6');
    svg.appendChild(city_circle);

    // Count the max and min number of stations per line in this city
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

    // Push all the interchange stations in a list
    const trans_points = [];
    // const subway_lines_and_circles = [];

    // Iterate all the subway lines
    for (const subwayline of jsonData.l) {
        const line_name = subwayline.ln;
        const is_loop = subwayline.lo;
        const color = subwayline.cl;
        const station_num = subwayline.st.length;
        // subwayline.st.forEach(station => {
        //     if (station.t == "1"){
        //         const [w, h] = splitPString(station.p, city_center);
        //         circle = drawCircle(w, h, 3, '#' + color, 'black', '1px', '0.5', '0.5', false);
        //         svg.appendChild(circle);
        //     }
        // });
        
        // Push all the interchange stations in a list
        subwayline.st.forEach(station => {
            if (station.t == "1"){
                const [w, h] = splitPString(station.p, city_center);
                trans_points.push([w, h]);
            }
        });

        // Draw a circle or a line based on whether it's a loop
        if (is_loop == '1'){
            const first_station = subwayline.st[0];
            const [x1, y1] = splitPString(first_station.p, city_center);
            const mid_station = subwayline.st[Math.floor(station_num/2)];
            const [x2, y2] = splitPString(mid_station.p, city_center);
            thickness = thickness_offset + (station_num-min_st_num)/(max_st_num-min_st_num) * thickness_weight;
            circle = drawCircle((x1+x2)/2, (y1+y2)/2, calculateRadius(x1, y1, x2, y2), '#' + color, '#' + color, thickness.toFixed(2) + 'px', '0.75', '0.5');
            svg.appendChild(circle);
            // subway_lines_and_circles.push(circle);
        }else
        {
            const first_station = subwayline.st[0];
            const [x1, y1] = splitPString(first_station.p, city_center);
            const last_station = subwayline.st[station_num - 1];
            const [x2, y2] = splitPString(last_station.p, city_center);
            thickness = thickness_offset + (station_num-min_st_num)/(max_st_num-min_st_num) * thickness_weight;
            line = drawLine(x1, y1, x2, y2, '#' + color, thickness.toFixed(2) + 'px', '0.75');
            svg.appendChild(line);
            // subway_lines_and_circles.push(line);
        }
    }

    if (trans_points.length >= k){
        // K-means clustering for all the interchange stations in this city
        const clustering_res = kmeans(trans_points, k).computeInformation(trans_points);
        clustering_res.forEach(clus => {
            circle = drawCircle(clus.centroid[0], clus.centroid[1], clus.size * interchange_st_circle_r_weight, 'black', 'black', '1px', '0.4', '0.4', false);
            svg.appendChild(circle);
        });
    }

    // subway_lines_and_circles.forEach(lc =>{
    //     svg.appendChild(lc);
    // });
}

function initializeVCPair(visualizationId, filePaths, captionId, initialCaption, subcaptionId) {
    // This function creates canvas and reads JSON file for a single city with id

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
            parseData(data, svg, subcaptionId)
        }
    });

    // Set the initial caption text
    const caption = document.getElementById(captionId);
    caption.textContent = initialCaption;
}


// main function
const path = require('path');
const folderPath = './static/json';
const visualizationContainer = document.getElementById('visualization-container');

const files = ['北京.json', '上海.json', '广州.json', '深圳.json', '成都.json', '郑州.json',  
'重庆.json', '杭州.json', '佛山.json', '兰州.json', '南京.json', '南宁.json', '南昌.json', 
'厦门.json', '合肥.json', '呼和浩特.json', '哈尔滨.json', '大连.json', '天津.json', '太原.json', 
'宁波.json', '常州.json', '徐州.json',  '无锡.json', '昆明.json', '乌鲁木齐.json',
'武汉.json', '沈阳.json', '洛阳.json', '济南.json',  '温州.json', '石家庄.json', 
'福州.json', '苏州.json', '西安.json', '贵阳.json',  '长春.json', '东莞.json',
'长沙.json', '青岛.json', '香港.json']

// const files = ['广州.json', '成都.json']

// Iterate all the cities
for (let i = 0; i < files.length; i++){
    const city_name = files[i].split('.json')[0]
    const filePaths = path.join(folderPath, files[i]);
    const v_c_pair = document.createElement('div');
    v_c_pair.classList.add('v-c-pair-container');

    const visualizationId = `visualization${i}`;
    const captionId = `caption${i}`;
    const initialCaption = city_name;
    const subcaptionId = `subcaption${i}`;

    v_c_pair.innerHTML = `
        <div class="visualization" id="${visualizationId}"></div>
        <div class="text-container">
            <span class="caption zhimangxing" id="${captionId}">${initialCaption}</span>
            <span class="caption" id="${subcaptionId}"></span>
        </div>
    `;

    visualizationContainer.appendChild(v_c_pair);

    initializeVCPair(visualizationId, filePaths, captionId, initialCaption, subcaptionId);
}



