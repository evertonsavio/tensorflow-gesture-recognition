const config = {
  video: {width: 640, height: 480, fps: 30},
};

const imageOrVideo = false;

const landmarkColors = {
  thumb: 'red',
  indexFinger: 'blue',
  middleFinger: 'yellow',
  ringFinger: 'green',
  pinky: 'pink',
  palmBase: 'white',
};

const gestureStrings = {
  thumbs_up: '👍',
  thumbs_down: '👎',
};

async function main() {
  let fileInput = document.getElementById('fileinput');
  fileInput.addEventListener('change', function (ev) {
    if (ev.target.files) {
      let file = ev.target.files[0];
      var reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = function (e) {
        var image = new Image();
        image.src = e.target.result;
        image.onload = function (ev) {
          var canvas = document.getElementById('canvas');
          canvas.width = 640; //image.width;
          canvas.height = 480; //image.height;
          var ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(image, 0, 0, 640, 480);
        };
      };
    }
  });

  const video = document.querySelector('#pose-video');
  const canvas = document.querySelector('#pose-canvas');
  const ctx = canvas.getContext('2d');

  const resultLayer = document.querySelector('#pose-result');

  const thumbsUpGesture = new fp.GestureDescription('thumbs_up');
  thumbsUpGesture.addCurl(fp.Finger.Thumb, fp.FingerCurl.NoCurl, 1.0);

  thumbsUpGesture.addDirection(
    fp.Finger.Thumb,
    fp.FingerDirection.VerticalUp,
    1.0
  );
  thumbsUpGesture.addDirection(
    fp.Finger.Thumb,
    fp.FingerDirection.DiagonalUpLeft,
    0.5
  );
  thumbsUpGesture.addDirection(
    fp.Finger.Thumb,
    fp.FingerDirection.DiagonalUpRight,
    0.5
  );
  thumbsUpGesture.addCurl(fp.Finger.Index, fp.FingerCurl.FullCurl, 1.0);
  thumbsUpGesture.addCurl(fp.Finger.Middle, fp.FingerCurl.FullCurl, 1.0);
  thumbsUpGesture.addCurl(fp.Finger.Ring, fp.FingerCurl.FullCurl, 1.0);
  thumbsUpGesture.addCurl(fp.Finger.Pinky, fp.FingerCurl.FullCurl, 1.0);

  const thumbsDownGesture = new fp.GestureDescription('thumbs_down');

  thumbsDownGesture.addCurl(fp.Finger.Thumb, fp.FingerCurl.NoCurl, 1.0);
  thumbsDownGesture.addDirection(
    fp.Finger.Thumb,
    fp.FingerDirection.VerticalDown,
    1.0
  );
  thumbsDownGesture.addDirection(
    fp.Finger.Thumb,
    fp.FingerDirection.DiagonalDownLeft,
    0.5
  );
  thumbsDownGesture.addDirection(
    fp.Finger.Thumb,
    fp.FingerDirection.DiagonalDownRight,
    0.5
  );

  thumbsDownGesture.addCurl(fp.Finger.Index, fp.FingerCurl.FullCurl, 1.0);
  thumbsDownGesture.addCurl(fp.Finger.Middle, fp.FingerCurl.FullCurl, 1.0);
  thumbsDownGesture.addCurl(fp.Finger.Ring, fp.FingerCurl.FullCurl, 1.0);
  thumbsDownGesture.addCurl(fp.Finger.Pinky, fp.FingerCurl.FullCurl, 1.0);

  const knownGestures = [thumbsUpGesture, thumbsDownGesture];
  const GE = new fp.GestureEstimator(knownGestures);

  const model = await handpose.load();
  console.log('Handpose model loaded');

  const estimateHands = async () => {
    ctx.clearRect(0, 0, config.video.width, config.video.height);
    resultLayer.innerText = '';

    const canvasimg = document.querySelector('canvas');
    const canvasctx = canvasimg.getContext('2d');

    var imageData = canvasctx.getImageData(
      0,
      0,
      canvasimg.width,
      canvasimg.height
    );

    console.log(imageData);

    if (document.getElementById('option1').checked) {
      dataToPredict = video;
    } else {
      dataToPredict = imageData;
    }

    const predictions = await model.estimateHands(dataToPredict, true);

    for (let i = 0; i < predictions.length; i++) {
      for (let part in predictions[i].annotations) {
        for (let point of predictions[i].annotations[part]) {
          drawPoint(ctx, point[0], point[1], 3, landmarkColors[part]);
        }
      }

      const est = GE.estimate(predictions[i].landmarks, 5.5);

      if (est.gestures.length > 0) {
        let result = est.gestures.reduce((p, c) => {
          return p.confidence > c.confidence ? p : c;
        });
        console.log(gestureStrings[result.name]);

        resultLayer.innerText = gestureStrings[result.name];
      }
    }

    setTimeout(() => {
      estimateHands();
    }, 10000 / config.video.fps);
  };

  estimateHands();
  console.log('Starting predictions');
}

async function initCamera(width, height, fps) {
  const constraints = {
    audio: false,
    video: {
      facingMode: 'user',
      width: width,
      height: height,
      frameRate: {max: fps},
    },
  };

  const video = document.querySelector('#pose-video');
  video.width = width;
  video.height = height;

  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  video.srcObject = stream;

  return new Promise((resolve) => {
    video.onloadedmetadata = () => {
      resolve(video);
    };
  });
}

function drawPoint(ctx, x, y, r, color) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}

window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btnApp').style.visibility = 'visible';
});

const iniciarApp = () => {
  initCamera(config.video.width, config.video.height, config.video.fps).then(
    (video) => {
      video.play();
      video.addEventListener('loadeddata', (event) => {
        console.log('Camera is ready');
        main();
      });
    }
  );

  const canvas = document.querySelector('#pose-canvas');
  canvas.width = config.video.width;
  canvas.height = config.video.height;
  console.log('Canvas initialized');
};
