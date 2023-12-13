const path = require('path');
const { kmeans } = require('ml-kmeans');

class Args {
    constructor(kmeans_k, opacity_multiply_factor, city_boundary, draw_offset, city_circle_r, city_circle_thickness,
        thickness_offset, thickness_weight, interchange_st_circle_r_weight, hover_text_fontsize, hover_text_offset) {
        
        //不可以scale的值
        this.kmeans_k = kmeans_k || 6;
        this.opacity_multiply_factor = opacity_multiply_factor || 0.25,

        // 可以scale的值
        this.city_boundary = city_boundary || 80; //120;
        this.draw_offset = draw_offset || 100; //150; // Half the canvas width, and also height
        this.city_circle_r = city_circle_r || 95; //142;
        this.city_circle_thickness = city_circle_thickness || 10; //15;
        this.thickness_offset = thickness_offset || 0.2; //0.25;
        this.thickness_weight = thickness_weight || 3.8; //5.75;
        this.interchange_st_circle_r_weight = interchange_st_circle_r_weight || 0.67; //1.0;
        this.hover_text_fontsize = hover_text_fontsize || 8;
        this.hover_text_offset = hover_text_offset || 8;
    }

    scale(factor) {
        this.city_boundary *= factor;
        this.draw_offset *= factor;
        this.city_circle_r *= factor;
        this.city_circle_thickness *= factor;
        this.thickness_offset *= factor;
        this.thickness_weight *= factor;
        this.interchange_st_circle_r_weight *= factor;
        this.hover_text_fontsize *= factor;
        this.hover_text_offset *= factor;
    }
}

function setMouseOverText(svg, args, line, lineInfo= '线路名称： 起始站： 终点站： 站点数：') {
    // 设置线悬停时的效果和文字
    const x1 = parseFloat(line.getAttribute('x1'));
    const y1 = parseFloat(line.getAttribute('y1'));
    const x2 = parseFloat(line.getAttribute('x2'));
    const y2 = parseFloat(line.getAttribute('y2'));
    const stroke_width = line.getAttribute('stroke-width');
    const stroke = line.getAttribute('stroke');
    const opacity = line.getAttribute('opacity');

    // Additional code to handle mouseover event
    line.addEventListener('mouseover', function(event) {
        // Highlight the line
        line.setAttribute('stroke-width', (parseFloat(stroke_width) + 2).toFixed(2));
        line.setAttribute('opacity', '1');

        // Dim other elements in the SVG
        const allElements = svg.children;
        for (const element of allElements) {
            if (element !== line) {
                element.setAttribute('opacity', 
                    (parseFloat(element.getAttribute('opacity')) * args.opacity_multiply_factor).toFixed(2)
                );
            }
        }

        // Create a text element for displaying information
        const text = document.createElementNS("http://www.w3.org/2000/svg", 'text');

        let angle;
        if (y2 - y1 === 0) {
            // Points are on the same horizontal line
            angle = (x2 - x1 >= 0) ? 0 : 180;
        } else {
            angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
        }

        if (angle > 90 || angle < -90) {
            // If the line is in the bottom half, adjust angle and text anchor
            angle += 180;
        }

        let textX = (x1 + x2) / 2 + (parseFloat(stroke_width) + 2 + args.hover_text_offset) * Math.sin(angle);
        let textY = (y1 + y2) / 2 + (parseFloat(stroke_width) + 2 + args.hover_text_offset) * Math.cos(angle);

        // Set text attributes
        text.setAttribute('x', textX);
        text.setAttribute('y', textY);
        text.setAttribute('fill', stroke); // Use line color for text
        text.setAttribute('font-size', (args.hover_text_fontsize).toFixed(2));
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('transform', `rotate(${angle},${textX},${textY})`);

        // Set text content using lineInfo parameter
        text.textContent = lineInfo;

        // Append text element to the SVG
        svg.appendChild(text);

        // Save the text element reference to remove it on mouseout
        line.hoverText = text;
    });

    // Additional code to handle mouseout event
    line.addEventListener('mouseout', function(event) {
        line.setAttribute('stroke-width', stroke_width);
        line.setAttribute('opacity', opacity);

        // Restore opacity of other elements in the SVG
        const allElements = svg.children;
        for (const element of allElements) {
            if (element !== line) {
                element.setAttribute('opacity', 
                    (parseFloat(element.getAttribute('opacity')) / args.opacity_multiply_factor).toFixed(2)
                );
            }
        }

        // Remove the displayed information when mouse moves away from the line
        if (line.hoverText) {
            svg.removeChild(line.hoverText);
            line.hoverText = null;
        }
    });
}

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

function splitPString(s, city_center, draw_offset, city_boundary) {
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

function parseData(jsonData, svg, subcaptionId, args){
    // This function parses a city JSON file

    const city_subway_name = jsonData.s;
    const city_subway_id = jsonData.i;
    const city_center = jsonData.o.split(',');

    const subcaption_text = "|" + city_subway_name + "[" + city_subway_id + "]";
    const subcaption = document.getElementById(subcaptionId);
    subcaption.innerHTML = `${subcaption_text}`;

    // Draw the outside black circle
    city_circle = drawCircle(args.draw_offset, args.draw_offset, args.city_circle_r, '#E9D4C7', '#261E25', args.city_circle_thickness.toFixed(2) + 'px', '0.9', '0.6');
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
        //         const [w, h] = splitPString(station.p, city_center, args.draw_offset, args.city_boundary);
        //         circle = drawCircle(w, h, 3, '#' + color, 'black', '1px', '0.5', '0.5', false);
        //         svg.appendChild(circle);
        //     }
        // });
        
        // Push all the interchange stations in a list
        subwayline.st.forEach(station => {
            if (station.t == "1"){
                const [w, h] = splitPString(station.p, city_center, args.draw_offset, args.city_boundary);
                trans_points.push([w, h]);
            }
        });

        // Draw a circle or a line based on whether it's a loop
        if (is_loop == '1'){
            const first_station = subwayline.st[0];
            const [x1, y1] = splitPString(first_station.p, city_center, args.draw_offset, args.city_boundary);
            const mid_station = subwayline.st[Math.floor(station_num/2)];
            const [x2, y2] = splitPString(mid_station.p, city_center, args.draw_offset, args.city_boundary);
            let thickness;
            if (max_st_num !== min_st_num) {
                thickness = args.thickness_offset + (station_num - min_st_num) / (max_st_num - min_st_num) * args.thickness_weight;
            } else {
                // Handle the case when max_st_num is equal to min_st_num
                thickness = args.thickness_offset + 0.5 * args.thickness_weight;
            }
            circle_intro = drawCircle((x1+x2)/2, (y1+y2)/2, (calculateRadius(x1, y1, x2, y2) - thickness/2), '#' + color, 'none', '0', '1', '0.5', false);
            svg.appendChild(circle_intro);
            circle_extro = drawCircle((x1+x2)/2, (y1+y2)/2, calculateRadius(x1, y1, x2, y2), 'none', '#' + color, thickness.toFixed(2) + 'px', '0.75', '0');
            svg.appendChild(circle_extro);
            // subway_lines_and_circles.push(circle);
        }else
        {
            const first_station = subwayline.st[0];
            const [x1, y1] = splitPString(first_station.p, city_center, args.draw_offset, args.city_boundary);
            const last_station = subwayline.st[station_num - 1];
            const [x2, y2] = splitPString(last_station.p, city_center, args.draw_offset, args.city_boundary);
            let thickness;
            if (max_st_num !== min_st_num) {
                thickness = args.thickness_offset + (station_num - min_st_num) / (max_st_num - min_st_num) * args.thickness_weight;
            } else {
                // Handle the case when max_st_num is equal to min_st_num
                thickness = args.thickness_offset + 0.5 * args.thickness_weight;
            }
            line = drawLine(x1, y1, x2, y2, '#' + color, thickness.toFixed(2) + 'px', '0.75');
            svg.appendChild(line);
            setMouseOverText(svg, args, line);
            // subway_lines_and_circles.push(line);
        }
    }

    if (trans_points.length >= args.kmeans_k){
        // K-means clustering for all the interchange stations in this city
        const clustering_res = kmeans(
            trans_points, 
            args.kmeans_k,
            {seed: 0, initialization: 'kmeans++'}
        ).computeInformation(trans_points);
        clustering_res.forEach(clus => {
            circle = drawCircle(clus.centroid[0], clus.centroid[1], clus.size * args.interchange_st_circle_r_weight, 'black', 'black', '1px', '0.4', '0.4', false);
            svg.appendChild(circle);
        });
    }

    // subway_lines_and_circles.forEach(lc =>{
    //     svg.appendChild(lc);
    // });
}

function initializeVCPair(args, visualizationId, filePaths, captionId, initialCaption, subcaptionId) {
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
            parseData(data, svg, subcaptionId, args)
        }
    });

    // Set the initial caption text
    const caption = document.getElementById(captionId);
    caption.textContent = initialCaption;
}


// main function
const folderPath = './static/json';
const files = ['北京.json', '上海.json', '广州.json', '深圳.json', '成都.json', '郑州.json',  
'重庆.json', '杭州.json', '佛山.json', '兰州.json', '南京.json', '南宁.json', '南昌.json', 
'厦门.json', '合肥.json', '呼和浩特.json', '哈尔滨.json', '大连.json', '天津.json', '太原.json', 
'宁波.json', '常州.json', '徐州.json',  '无锡.json', '昆明.json', '乌鲁木齐.json',
'武汉.json', '沈阳.json', '洛阳.json', '济南.json',  '温州.json', '石家庄.json', 
'福州.json', '苏州.json', '西安.json', '贵阳.json',  '长春.json', '东莞.json',
'长沙.json', '青岛.json', '香港.json']

// 全部城市的界面
const default_args = new Args();
const visualizationContainer = document.getElementById('visualization-container');
// Iterate all the cities
for (let i = 0; i < files.length; i++){
    const city_name = files[i].split('.json')[0];
    const filePaths = path.join(folderPath, files[i]);
    const v_c_pair = document.createElement('div');
    v_c_pair.classList.add('v-c-pair-container.small');
    // const v_c_pairId = `v_c_pairId${i}`;
    // v_c_pair.setAttribute('id', v_c_pairId);

    const visualizationId = `visualization${i}`;
    const captionId = `caption${i}`;
    const initialCaption = city_name;
    const subcaptionId = `subcaption${i}`;

    v_c_pair.innerHTML = `
        <div class="visualization shadow" id="${visualizationId}"></div>
        <div class="text-container">
            <span class="caption zhimangxing" id="${captionId}">${initialCaption}</span>
            <span class="caption" id="${subcaptionId}"></span>
        </div>
    `;

    visualizationContainer.appendChild(v_c_pair);

    initializeVCPair(default_args, visualizationId, filePaths, captionId, initialCaption, subcaptionId);
}

// 点击某个城市后的触发事件
document.addEventListener("DOMContentLoaded", function () {
    const foregroundSvg = document.getElementById("foreground-svg");
    const overlay = document.getElementById('overlay');

    for (let i = 0; i < files.length; i++){
        const visualizationId = `visualization${i}`;
        document.getElementById(visualizationId).addEventListener('click', function() {
            overlay.classList.add('blur-in');
            overlay.style.display = 'block';
            foregroundSvg.style.display = "block";


            const sourceId = i; //parseInt('visualization0'.match(/\d+$/)[0]);

            const city_name = files[sourceId].split('.json')[0];
            const filePaths = path.join(folderPath, files[sourceId]);
            const v_c_pair = document.createElement('div');
            v_c_pair.classList.add('v-c-pair-container');
            // const v_c_pairId = `v_c_pairId_scaled${sourceId}`;
            // v_c_pair.setAttribute('id', v_c_pairId);
            const visualizationId = `visualization_scaled${sourceId}`;
            const captionId = `caption_scaled${sourceId}`;
            const initialCaption = city_name;
            const subcaptionId = `subcaption_scaled${sourceId}`;

            v_c_pair.innerHTML = `
                <div class="visualization" id="${visualizationId}"></div>
                <div class="text-container">
                    <span class="caption zhimangxinglarge" id="${captionId}">${initialCaption}</span>
                    <span class="caption large" id="${subcaptionId}"></span>
                </div>
            `;

            v_c_pair.classList.add('scaled-city');
            // v_c_pair.classList.add('scaled');
            overlay.appendChild(v_c_pair);

            const args = new Args();
            args.scale(3.0);
            initializeVCPair(args, visualizationId, filePaths, captionId, initialCaption, subcaptionId);
        });
    }

    foregroundSvg.addEventListener('click', function() {

        overlay.removeChild(overlay.querySelector('.v-c-pair-container'));

        foregroundSvg.style.display = "none";
        overlay.classList.add('blur-out');
        // overlay.style.display = 'none';
        overlay.addEventListener('animationend', function() {
            overlay.style.display = 'none';
            // Remove the animation classes to reset for the next time
            overlay.classList.remove('blur-in', 'blur-out');
        }, { once: true });
    });

});


