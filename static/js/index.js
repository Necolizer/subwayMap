// Function to fetch and parse JSON data
// async function fetchData(jsonFilePath) {
//     try {
//         // Fetch JSON file
//         const response = await fetch(jsonFilePath);
        
//         // Check if the fetch was successful
//         if (!response.ok) {
//             throw new Error('Failed to fetch data');
//         }

//         // Parse JSON and return the result
//         return await response.json();
//     } catch (error) {
//         console.error('Error fetching/parsing JSON:', error);
//         // You might want to handle or propagate the error based on your needs
//         throw error;
//     }
// }

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

function drawCircle(cx, cy, radius, fill, stroke, stroke_width, opacity) {
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

    return circle;
}

// function drawLinesPoints(visualization) {
    
//     const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
//     svg.setAttribute("width", "100%");
//     svg.setAttribute("height", "100%");
//     visualization.appendChild(svg);

//     const line = document.createElementNS(svg.namespaceURI, 'line');
//     line.setAttribute('x1', '50');
//     line.setAttribute('y1', '50');
//     line.setAttribute('x2', '250');
//     line.setAttribute('y2', '250');
//     line.setAttribute('stroke', 'black');
//     line.setAttribute('stroke-width', '2');
//     line.setAttribute('opacity', '0.7');
//     svg.appendChild(line);

//     // Example: Drawing a point
//     const point = document.createElementNS(svg.namespaceURI, 'circle');
//     point.setAttribute('cx', '150');
//     point.setAttribute('cy', '150');
//     point.setAttribute('r', '5');
//     point.setAttribute('fill', 'red');
//     point.setAttribute('opacity', '0.8');
//     point.addEventListener('mouseover', () => {
//         // Add code to show more information on mouseover
//         console.log('Mouseover on Point');
//     });
//     svg.appendChild(point);
// }

// Example usage:
const jsonFilePath = 'gz.json';
const visualization = document.getElementById('visualization');
const raw_width = 1280;
const raw_height = 720;
const city_boundary = 300;
// const city_circle_r = 300;

function splitPString(s) {
    const numberStrings = s.split(' ');
    const number1 = parseInt(numberStrings[0], 10) / raw_width * city_boundary;
    const number2 = parseInt(numberStrings[1], 10) / raw_height * city_boundary;
    return [number1, number2];
}

const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
svg.setAttribute("width", "100%");
svg.setAttribute("height", "100%");
visualization.appendChild(svg);

// fetchData(jsonFilePath)
//     .then(jsonData => {
        
//     })
//     .catch(error => {
//         // Handle the error
//         console.error('Error:', error);
//     });

function parseData(jsonData){
    const city = jsonData.s;
    const city_id = jsonData.i;
    for (const subwayline of jsonData.l) {
        const line_name = subwayline.ln;
        const is_loop = subwayline.lo;
        const color = subwayline.cl;
        const station_num = subwayline.st.length;
        subwayline.st.forEach(station => {
            if (station.t == "1"){
                const [w, h] = splitPString(station.p);
                circle = drawCircle(w, h, 3, 'black', 'black', '1px', '0.0');
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
            line = drawLine(x1, y1, x2, y2, '#' + color, '3px', '1.0');
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


