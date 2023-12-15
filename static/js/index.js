const path = require('path');
const { kmeans } = require('ml-kmeans');

const folderPath = './static/json';
const files = ['北京.json', '上海.json', '广州.json', '深圳.json', '成都.json', '香港.json', '郑州.json',  
'重庆.json', '杭州.json', '佛山.json', '兰州.json', '南京.json', '南宁.json', '南昌.json', 
'厦门.json', '合肥.json', '呼和浩特.json', '哈尔滨.json', '大连.json', '天津.json', '太原.json', 
'宁波.json', '常州.json', '徐州.json',  '无锡.json', '昆明.json', '乌鲁木齐.json',
'武汉.json', '沈阳.json', '洛阳.json', '济南.json',  '温州.json', '石家庄.json', 
'福州.json', '苏州.json', '西安.json', '贵阳.json',  '长春.json', '东莞.json',
'长沙.json', '青岛.json', '芜湖.json', '滁州.json', '绍兴.json', '金华.json', 
'台州.json', '湘潭.json', '湘西.json', '南通.json', '澳门.json']

const svgFolderPath = './static/svg/city';
// const svgFiles = files.map(fileName => fileName.replace('.json', '.svg'));

let subwayLinesList = [];
let defaultSubwayLinesListLen;

class Args {
    constructor(kmeans_k, opacity_multiply_factor, city_boundary, draw_offset, city_circle_r, city_circle_thickness,
        thickness_offset, thickness_weight, interchange_st_circle_r_weight, hover_text_fontsize, hover_text_offset,
        hover_text_animation_len, city_background_scale, city_background_tranlateX, city_background_tranlateY) {
        
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
        this.hover_text_animation_len = hover_text_animation_len || 500/3;
        this.city_background_scale = city_background_scale || 0.4;
        this.city_background_tranlateX = city_background_tranlateX || 105;
        this.city_background_tranlateY = city_background_tranlateY || 10;
    }

    scale(factor) {
        this.city_boundary *= factor;
        this.draw_offset *= factor;
        this.city_circle_r *= factor;
        this.city_circle_thickness *= factor;
        this.thickness_offset *= factor;
        this.thickness_weight *= factor;
        this.interchange_st_circle_r_weight *= factor;
        this.hover_text_fontsize *= (factor * 0.8);
        this.hover_text_offset *= factor;
        this.hover_text_animation_len *= factor;
        this.city_background_scale *= factor;
        this.city_background_tranlateX /= factor;
        this.city_background_tranlateY /= factor;
    }
}

const default_args = new Args();
const visualizationContainer = document.getElementById('visualization-container');
const in_date = document.getElementById('first');
const out_date = document.getElementById('second');

function setMouseOverText(svg, args, target, isLine=true, lineInfo= '线路名称： 起始站： 终点站： 站点数：') {
    // 设置线悬停时的效果和文字
    const stroke_width = target.getAttribute('stroke-width');
    const stroke = target.getAttribute('stroke');
    const opacity = target.getAttribute('opacity');

    // Additional code to handle mouseover event
    target.addEventListener('mouseover', function(event) {
        // Highlight the target
        target.setAttribute('stroke-width', (parseFloat(stroke_width) + 2).toFixed(2));
        target.setAttribute('opacity', '1');

        // Dim other elements in the SVG
        const allElements = svg.children;
        for (const element of allElements) {
            if (element !== target) {
                element.setAttribute('opacity', 
                    (parseFloat(element.getAttribute('opacity')) * args.opacity_multiply_factor).toFixed(2)
                );
            }
        }

        // Create a text element for displaying information
        const text = document.createElementNS("http://www.w3.org/2000/svg", 'text');

        if (isLine){
            const x1 = parseFloat(target.getAttribute('x1'));
            const y1 = parseFloat(target.getAttribute('y1'));
            const x2 = parseFloat(target.getAttribute('x2'));
            const y2 = parseFloat(target.getAttribute('y2'));

            let angle;
            if (x2 - x1 === 0) {
                // Points are on the same horizontal line
                angle = (y2 - y1 >= 0) ? -90 : 90;
            } else {
                angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
            }

            if (angle > 90 || angle < -90) {
                // If the line is in the bottom half, adjust angle
                angle += 180;
            }

            let textX = (x1 + x2) / 2 - (parseFloat(stroke_width) + 2 + args.hover_text_offset) * Math.sin((angle / 180) * Math.PI);
            let textY = (y1 + y2) / 2 + (parseFloat(stroke_width) + 2 + args.hover_text_offset) * Math.cos((angle / 180) * Math.PI);

            // Set text attributes
            text.setAttribute('x', textX);
            text.setAttribute('y', textY);
            text.setAttribute('fill', stroke); // Use line color for text
            text.setAttribute('font-size', (args.hover_text_fontsize).toFixed(2));
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'middle');
            text.setAttribute('transform', `rotate(${angle},${textX},${textY})`);
        }else{
            const cx = parseFloat(target.getAttribute('cx'));
            const cy = parseFloat(target.getAttribute('cy'));
            const radius = parseFloat(target.getAttribute('r'));
            text.setAttribute('x', cx);
            text.setAttribute('y', cy + radius + args.hover_text_offset);
            text.setAttribute('fill', stroke); // Use line color for text
            text.setAttribute('font-size', (args.hover_text_fontsize).toFixed(2));
            text.setAttribute('text-anchor', 'middle');
            // text.setAttribute('dominant-baseline', 'middle');
        }
        
        text.style.fontFamily = 'Noto Sans SC, sans-serif';
        text.style.pointerEvents = "none";
        text.textContent = lineInfo;

        const textLength = text.getComputedTextLength();
        const animate = document.createElementNS("http://www.w3.org/2000/svg", 'animate');
        animate.setAttribute('attributeName', 'x');
        animate.setAttribute('values', `${-textLength}; ${args.hover_text_animation_len}`);
        animate.setAttribute('dur', '5s'); // 持续时间
        animate.setAttribute('repeatCount', 'indefinite'); // 无限循环

        text.appendChild(animate);

        // Append text element to the SVG
        svg.appendChild(text);

        // Save the text element reference to remove it on mouseout
        target.hoverText = text;
    });

    // Additional code to handle mouseout event
    target.addEventListener('mouseout', function(event) {
        target.setAttribute('stroke-width', stroke_width);
        target.setAttribute('opacity', opacity);

        // Restore opacity of other elements in the SVG
        const allElements = svg.children;
        for (const element of allElements) {
            if (element !== target) {
                element.setAttribute('opacity', 
                    (parseFloat(element.getAttribute('opacity')) / args.opacity_multiply_factor).toFixed(2)
                );
            }
        }

        // Remove the displayed information when mouse moves away from the target
        if (target.hoverText) {
            svg.removeChild(target.hoverText);
            target.hoverText = null;
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

    line.classList.add('opacity-change');
    return line;
}

function drawCircle(cx, cy, radius, fill, stroke, stroke_width, opacity, fill_opacity, pointerEvents=true, animation=false) {
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

    circle.classList.add('opacity-change');

    if (animation){
        // 添加一个创建时半径从0到targetRadius的动画效果
        const styleTag = document.createElement('style');
        document.head.appendChild(styleTag);
        const styleSheet = styleTag.sheet;
        const targetRadius = radius;
        const targetRadiusString = targetRadius.toString().replace('.', '_');
        // 创建一个规则，包含动态的目标半径
        const rule = `@keyframes expandRadius_${targetRadiusString} {
            from {
                r: 0;
            }
            to {
                r: ${targetRadius};
            }
        }`;

        const rule2 = `
            .radius-change_${targetRadiusString} {
                animation: expandRadius_${targetRadiusString} 1s ease-out;
            }
        `

        // 将规则添加到样式表中
        styleSheet.insertRule(rule);
        styleSheet.insertRule(rule2);

        // 将动画类直接添加到 circle 元素上
        circle.classList.add(`radius-change_${targetRadiusString}`);
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

function convertDateString(inputString) {
    // Extract year, month, and day from the input string
    const match = inputString.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);

    if (!match) {
        // Handle invalid input
        return 'Invalid Date';
    }

    const [, year, month, day] = match;

    // Create a new Date object using the extracted values
    const parsedDate = new Date(`${year}-${month}-${day}`);

    // Format the date as 'YYYY-MM-DD'
    const formattedDate = parsedDate.toISOString().split('T')[0];

    return formattedDate;
}

function setVisiblility(line){
    const inDate = new Date(in_date.textContent);
    const outDate = new Date(out_date.textContent);

    // 获取 'year_month_date' 属性值
    const stringDate = line.getAttribute('start_date');
    const lineDate = new Date(stringDate);

    // 判断属性值是否在起始日期和终止日期之间
    if ((inDate <= lineDate) && (lineDate <= outDate)) {
        // 在范围内，设为可见
        line.style.visibility = 'visible';
    } else {
        // 不在范围内，设为不可见
        line.style.visibility = 'hidden';
    }
}

function parseData(jsonData, svg, subcaptionId, args, initialCaption){
    // This function parses a city JSON file

    const city_subway_name = jsonData.s;
    const city_subway_id = jsonData.i;
    const city_center = jsonData.o.split(',');

    const subcaption_text = "|" + city_subway_name + "[" + city_subway_id + "]";
    const subcaption = document.getElementById(subcaptionId);
    subcaption.innerHTML = `${subcaption_text}`;

    const backgroundImage = document.createElementNS("http://www.w3.org/2000/svg", 'image');
    backgroundImage.setAttribute('href', path.join(svgFolderPath, initialCaption+'.svg'));
    backgroundImage.setAttribute('opacity', '0.5');
    backgroundImage.classList.add('opacity-change');
    backgroundImage.style.position = 'absolute';
    backgroundImage.style.top = '0';
    backgroundImage.style.left = '0';
    backgroundImage.style.transform = `scale(${args.city_background_scale}, ${args.city_background_scale}) translate(-${args.city_background_tranlateX}%, -${args.city_background_tranlateY}%)`;
    backgroundImage.style.pointerEvents = "none";
    svg.appendChild(backgroundImage);


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

    // Iterate all the subway lines
    for (const subwayline of jsonData.l) {
        const line_name = subwayline.ln;
        const is_loop = subwayline.lo;
        const color = subwayline.cl;
        const station_num = subwayline.st.length;
        const start_date = subwayline.start_date;
        const start_st_name = subwayline.st[0].n;
        const terminal_st_name = subwayline.st[station_num - 1].n;
        const textinfo = line_name + ' ' + start_st_name + '-' + terminal_st_name + ' ' + station_num.toFixed(0) + '站 ' + start_date + '开通';
        
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
            circle_intro.setAttribute('start_date', convertDateString(start_date));
            setVisiblility(circle_intro);
            subwayLinesList.push(circle_intro);
            svg.appendChild(circle_intro);
            circle_extro = drawCircle((x1+x2)/2, (y1+y2)/2, calculateRadius(x1, y1, x2, y2), 'none', '#' + color, thickness.toFixed(2) + 'px', '0.75', '0');
            circle_extro.setAttribute('start_date', convertDateString(start_date));
            setVisiblility(circle_extro);
            subwayLinesList.push(circle_extro);
            svg.appendChild(circle_extro);
            setMouseOverText(svg, args, circle_extro, false, textinfo);
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
            line.setAttribute('start_date', convertDateString(start_date));
            setVisiblility(line);
            subwayLinesList.push(line);
            svg.appendChild(line);
            setMouseOverText(svg, args, line, true, textinfo);
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
            circle = drawCircle(clus.centroid[0], clus.centroid[1], clus.size * args.interchange_st_circle_r_weight, 'black', 'black', '1px', '0.4', '0.4', false, true);
            svg.appendChild(circle);
        });
    }
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
            parseData(data, svg, subcaptionId, args, initialCaption)
        }
    });

    // Set the initial caption text
    const caption = document.getElementById(captionId);
    caption.textContent = initialCaption;
}

function init(default_args){
    // 全部城市的界面
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

    setTimeout(function() {
        defaultSubwayLinesListLen = subwayLinesList.length;
    }, 200);

    // 点击某个城市后的触发事件
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
            overlay.appendChild(v_c_pair);

            const args = new Args(default_args.kmeans_k);
            args.scale(3.0);
            initializeVCPair(args, visualizationId, filePaths, captionId, initialCaption, subcaptionId);
        });
    }

    foregroundSvg.addEventListener('click', function() {

        if (overlay.firstChild){
            overlay.removeChild(overlay.firstChild);
        }

        subwayLinesList.splice(defaultSubwayLinesListLen);

        foregroundSvg.style.display = "none";
        overlay.classList.add('blur-out');
        // overlay.style.display = 'none';
        overlay.addEventListener('animationend', function() {
            overlay.style.display = 'none';
            // Remove the animation classes to reset for the next time
            overlay.classList.remove('blur-in', 'blur-out');
        }, { once: true });
    });

}

function destroy(){
    while (visualizationContainer.firstChild) {
        visualizationContainer.removeChild(visualizationContainer.firstChild);
    }
    subwayLinesList = [];
}

// main function
init(default_args);

$('select[data-menu]').each(function() {

    let select = $(this),
        options = select.find('option'),
        menu = $('<div />').addClass('select-menu'),
        button = $('<div />').addClass('button'),
        list = $('<ul />'),
        arrow = $('<em />').prependTo(button);

    options.each(function(i) {
        let option = $(this);
        list.append($('<li />').text(option.text()));
    });

    menu.css('--t', select.find(':selected').index() * -41 + 'px');

    select.wrap(menu);

    button.append(list).insertAfter(select);

    list.clone().insertAfter(button);

});

$(document).on('click', '.select-menu', function(e) {

    let menu = $(this);

    if(!menu.hasClass('open')) {
        menu.addClass('open');
    }

});

$(document).on('click', '.select-menu > ul > li', function(e) {

    let li = $(this),
        menu = li.parent().parent(),
        select = menu.children('select'),
        selected = select.find('option:selected'),
        index = li.index();

    menu.css('--t', index * -41 + 'px');
    selected.attr('selected', false);
    select.find('option').eq(index).attr('selected', true);

    menu.addClass(index > selected.index() ? 'tilt-down' : 'tilt-up');

    setTimeout(() => {
        menu.removeClass('open tilt-up tilt-down');
    }, 500);

    default_args.kmeans_k = parseInt(select.val(), 10);
    destroy();
    init(default_args);
});

$(document).click(e => {
    e.stopPropagation();
    if($('.select-menu').has(e.target).length === 0) {
        $('.select-menu').removeClass('open');
    }
})


// 创建一个 Mutation Observer 实例，传入一个回调函数
const in_observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
    const inDate = new Date(mutation.target.textContent);
    const outDate = new Date(out_date.textContent);
    for (const line of subwayLinesList) {
        // 获取 'year_month_date' 属性值
        const stringDate = line.getAttribute('start_date');
        const lineDate = new Date(stringDate);
    
        // 判断属性值是否在起始日期和终止日期之间
        if ((inDate <= lineDate) && (lineDate <= outDate)) {
            // 在范围内，设为可见
            line.style.visibility = 'visible';
        } else {
            // 不在范围内，设为不可见
            line.style.visibility = 'hidden';
        }
    }
    });
});

const out_observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
    const inDate = new Date(in_date.textContent);
    const outDate = new Date(mutation.target.textContent);
    for (const line of subwayLinesList) {
        // 获取 'year_month_date' 属性值
        const stringDate = line.getAttribute('start_date');
        const lineDate = new Date(stringDate);
    
        // 判断属性值是否在起始日期和终止日期之间
        if ((inDate <= lineDate) && (lineDate <= outDate)) {
            // 在范围内，设为可见
            line.style.visibility = 'visible';
        } else {
            // 不在范围内，设为不可见
            line.style.visibility = 'hidden';
        }
    }
    });
});

// 配置 Mutation Observer 以监视子节点的内容变化
const config = { childList: true, subtree: true };

// 启动 Mutation Observer，并传入目标元素和配置
in_observer.observe(in_date, config);
out_observer.observe(out_date, config);
