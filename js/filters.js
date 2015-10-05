var supportedFilters = ["grayscale", "invert", "sepia", "blackAndWhite", "red", "green", "blue", "brightness", "contrast", "oldschool"];

var canvas = document.createElement("canvas");
supportedFilters.forEach((filter) => {
  var button = document.createElement("button");
  button.innerHTML = filter;
  button.onclick = () => {
    applyFilter({
      canvas,
      filter
    });
  };
  document.body.appendChild(button);
});
document.body.appendChild(canvas);

var fileInput = document.createElement("input");
fileInput.type = "file";
fileInput.onchange = function() {
  var img = new Image();
  img.src = URL.createObjectURL(this.files[0]);
  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0,0, img.width, img.height);

  };
};
document.body.appendChild(fileInput);

function applyFilter({canvas, filter, data}) {
  var ctx = canvas.getContext("2d");
  var imgData = ctx.getImageData(0,0,canvas.width, canvas.height).data;
  var newImgData = ctx.getImageData(0,0,canvas.width, canvas.height);
  if (filter == "blur") {
    if (typeof data !== "object" ||
        !data.radius) {
      data = {
        radius: 2
      };
    }
    if (data.radius % 2 == 0) {
      data.radius++;
    }
  }
  for (var i = 0; i < imgData.length; i++) {
    if (i % 4 !== 0) continue;
    var rgba = [imgData[i], imgData[i + 1], imgData[i + 2], imgData[i + 3]];
    var avg = (rgba[0] + rgba[1] + rgba[2]) / 3;
    switch (filter) {
      case "grayscale":
        rgba[0] = rgba[1] = rgba[2] = avg;
        break;
      case "invert":
        rgba[0] = 255 - rgba[0];
        rgba[1] = 255 - rgba[1];
        rgba[2] = 255 - rgba[2];
        break;
      case "sepia":
        rgba[0] = avg + 10;
        rgba[1] = rgba[2] = avg + 4;
        break;
      case "blackAndWhite":
        if (avg > 170) {
          rgba[0] = rgba[1] = rgba[2] = 255;
        }
        else if (avg > 85) {
          rgba[0] = rgba[1] = rgba[2] = 128;
        }
        else {
          rgba[0] = rgba[1] = rgba[2] = 0;
        }
        break;
      case "red":
        rgba[0] = 255;
        break;
      case "green":
        rgba[1] = 255;
        break;
      case "blue":
        rgba[2] = 255;
        break;
      case "opacity":
        data = data || 1;
        var hexaVal = data * 255;
        rgba[3] = hexaVal;
        break;
      case "brightness":
        data = data || 1.1;
        rgba[0] *= data;
        rgba[1] *= data;
        rgba[2] *= data;
        break;
      case "contrast":
        data = data || 1.1;
        rgba[0] /= data;
        rgba[1] /= data;
        rgba[2] /= data;
        break;
      case "blur":
        var x = i % canvas.width;
        var y = Math.floor(i / canvas.width);
        var squarePixelLength = Math.pow(data.radius, 2);
        var siblings = {
          r: new Array(squarePixelLength),
          g: new Array(squarePixelLength),
          b: new Array(squarePixelLength),
          a: new Array(squarePixelLength)
        };
        var n = Math.floor(data.radius / 2);
        var squareImgData = ctx.getImageData(x - n, y - n, data.radius, data.radius);
        var squareData = [].slice.call(squareImgData.data);
        for (var itnum = 0; itnum < squareData.length; i++) {
          if (itnum % 4 !== 0) continue;
          siblings.r.push(squareData[itnum]);
          siblings.g.push(squareData[itnum + 1]);
          siblings.b.push(squareData[itnum + 2]);
          siblings.a.push(squareData[itnum + 3]);
        }
        var avgR = getArrayAverage(siblings.r);
        var avgG = getArrayAverage(siblings.g);
        var avgB = getArrayAverage(siblings.b);
        var avgA = getArrayAverage(siblings.a);
        for (var itnum = 0; itnum < squareData.length; i++) {
          switch (itnum % 4) {
            case 0:
              squareData[itnum] = avgR;
              break;
            case 1:
              squareData[itnum] = avgG;
              break;
            case 2:
              squareData[itnum] = avgB;
              break;
            case 3:
              squareData[itnum] = avgA;
              break;
          }
        }
        squareImgData.data = new Uint8ClampedArray(squareData);
        ctx.putImageData(squareImgData, x - n, y - n);
        return;
        break;
    }
    newImgData.data[i] = rgba[0];
    newImgData.data[i+1] = rgba[1];
    newImgData.data[i+2] = rgba[2];
    newImgData.data[i+3] = rgba[3];

  }
    ctx.putImageData(newImgData,0,0);
}
function getColorPalette(limit=5) {
  var ctx = canvas.getContext("2d");
  var imgData = [...ctx.getImageData(0,0,canvas.width, canvas.height).data];
  var palette = [];
  var tolerance = 20;
  for (var i = 0; i < imgData.length; i++) {
    if (i % 4 == 0) {
      palette.push([imgData[i], imgData[i+1], imgData[i+2], imgData[i+3]]);
    }
  }
  var n = 0;
  while (palette.length >= limit) {
    var previousRgba = [];
    for (var i = 0; i < palette.length; i++) {
      if (tolerance == 255) break;
      var rgba = palette[i];
      if (i !== 0 &&
          !isDifferent(rgba, previousRgba, tolerance)) {
        palette.splice(i, 1);
      }
      previousRgba = rgba;
    }
    if (tolerance == 255) {
      palette = palette.splice(0, limit);
      break;
    }
    tolerance ++;
    n++;
  }
  return palette;
}
function appendPalette(palette) {
  for (var color of palette) {
    var div = document.createElement("div");
    div.style.background = `rgba(${color.join(",")})`;
    document.body.appendChild(div);
  }
}
function getArrayAverage(array = []) {
  var avg = array[0];
  for (var i = 1; i < array.length; i++) {
    avg = (avg + array[i]) / 2;
  }
  return avg;
}

function isDifferent(rgba1, rgba2, tolerance = 50) {
  tolerance = Math.min(255, tolerance);
  return Math.abs(rgba2[0] - rgba1[0]) > tolerance ||
          Math.abs(rgba2[1] - rgba1[1]) > tolerance ||
          Math.abs(rgba2[2] - rgba1[2]) > tolerance
}
