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

const jsonFilePath = './static/json/广州.json';
const visualization = document.getElementById('visualization');
const raw_width = 1980;
const raw_height = 1280;
const city_boundary = 250;
const draw_offset = 25;
const city_circle_r = 145;

function splitPString(s) {
    const numberStrings = s.split(' ');
    const number1 = draw_offset + Math.max(0, parseInt(numberStrings[0], 10) / raw_width * city_boundary);
    const number2 = draw_offset + Math.max(0, parseInt(numberStrings[1], 10) / raw_height * city_boundary);
    return [number1, number2];
}

const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
svg.setAttribute("width", "100%");
svg.setAttribute("height", "100%");
visualization.appendChild(svg);


function parseData(jsonData){
    const city = jsonData.s;
    const city_id = jsonData.i;

    city_circle = drawCircle(150, 150, city_circle_r, '#E9D4C7', '#261E25', '9px', '0.9', '0.3');
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

    for (const subwayline of jsonData.l) {
        const line_name = subwayline.ln;
        const is_loop = subwayline.lo;
        const color = subwayline.cl;
        const station_num = subwayline.st.length;
        subwayline.st.forEach(station => {
            if (station.t == "1"){
                const [w, h] = splitPString(station.p);
                circle = drawCircle(w, h, 3, '#' + color, 'black', '1px', '0.5', '0.5');
                svg.appendChild(circle);
            }
        });
        if (is_loop == '1'){
            
        }else
        {
            const first_station = subwayline.st[0];
            const [x1, y1] = splitPString(first_station.p);
            const last_station = subwayline.st[station_num - 1];
            const [x2, y2] = splitPString(last_station.p);
            thickness = 0.25 + (station_num-min_st_num)/(max_st_num-min_st_num) * 2.75;
            line = drawLine(x1, y1, x2, y2, '#' + color, thickness.toFixed(2) + 'px', '0.7');
            svg.appendChild(line);
        }
    }
}


$.ajax({
    url: jsonFilePath,
    type: "GET",
    dataType: "json",
    success: 
    function (data) {
        parseData(data)
    }
});


