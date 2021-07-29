let filesUnprocessed;
let filesForDownload = [];
const quality = 0.75;
const downloadTimeInterval = 300;

$('#action').on('change', function () {

    $('#before img').appendTo($('#garage'));
    $('#after img').appendTo($('#garage'));

    switch ($('#action').val().toUpperCase()) {
        case 'SCRAMBLE': {

            $('#garage #example_original').appendTo($('#before'));
            $('#garage #example_stripped').appendTo($('#after'));
            break;
        }
        case 'UNSCRAMBLE': {
            $('#garage #example_original').appendTo($('#after'));
            $('#garage #example_stripped').appendTo($('#before'));
            break;
        }
    }
})

$('#fileLoader').on('change', function (event) {

    filesUnprocessed = event.currentTarget.files;
    // Abort if there were no files selected
    if (!filesUnprocessed.length) return;

    initializeComponentState();
});

$('#startButton').on('click', function () {
    // processData(filesUnprocessed);
    // processImage(filesUnprocessed[0]); //OK
    // processImagePromise(filesUnprocessed[0]);

    // Clear previous data
    clearResults();
    // Start to process images
    processImages(filesUnprocessed);
    $('#startButton').attr('disabled', false);

    if ($('#checkShowResults').attr('checked')) {
        $('#results').removeClass('d-none');
    }
})

$('#downloadButton').on('click', function (event) {

    event.preventDefault();
    $('#downloadButton').attr('disabled', true);

    let temporaryDownloadLink = document.createElement("a");
    temporaryDownloadLink.style.display = 'none';
    document.body.appendChild(temporaryDownloadLink);

    downloadProgress.initializeProgress(filesForDownload.length);

    // for (let i = 0; i < filesForDownload.length; i++) {
    //     setTimeout(function (n) {
    //         downloadImageN(n);
    //         if (downloadProgress.isCompleted) {
    //             $('#downloadButton').attr('disabled', false);
    //         }
    //     }, downloadTimeInterval * i, i)
    // }

    let n = 0;
    let interval = setInterval(function () {
        downloadImageN(n);
        n++;
        if (n === filesForDownload.length) {
            clearInterval(interval);
        }
        if (downloadProgress.isCompleted) {
            $('#downloadButton').attr('disabled', false);
        }
    }, downloadTimeInterval);

    function downloadImageN(n) {
        let download = filesForDownload[n];
        temporaryDownloadLink.setAttribute('href', download.path);
        temporaryDownloadLink.setAttribute('download', download.name);
        temporaryDownloadLink.click();
        downloadProgress.tick();
    }

    document.body.removeChild(temporaryDownloadLink);
});

class TrackProgress {
    constructor(barElement) {
        this.progressBar = barElement;
        this.taskSum = 0;
        this.count = 0;
        this.percentage = 0;
        this.completed = false;
    }

    initializeProgress(totalTasks) {
        this.taskSum = totalTasks;
        this.count = 0;
        this.percentage = 0;
        this.completed = false;
    }

    tick() {
        this.count++;
        this.percentage = (this.count / this.taskSum * 100).toFixed(0);
        this.progressBar.width(this.percentage + '%');
        this.progressBar.text(this.percentage + '%');
        if (this.count === this.taskSum) this.completed = true;
    }

    isCompleted() {
        return this.completed;
    }
}
let transformProgress = new TrackProgress($('#transformProgress'));
let downloadProgress = new TrackProgress($('#downloadProgress'));

function initializeComponentState() {
    $('#startButton').attr('disabled', false);
    $('#transformProgress').width('0%');
    $('#transformProgress').text('0%');
    $('#downloadProgress').width('0%');
    $('#downloadProgress').text('0%');
    $('#downloadbar-btn').addClass('d-none');
    $('#downloadbar-status').addClass('d-none');
}

function clearResults() {
    $('#results img').remove();
    filesForDownload = [];
}

/**
 * Image processing for all images uploaded.
 *
 * @param {file} images images to be processed
 * @returns
 */
function processImages(files) {
    transformProgress.initializeProgress(files.length);

    for (let i = 0; i < files.length; i++) {
        // processImage(files[i]);
        processImagePromise(files[i]).then((() => {
            transformProgress.tick();

            if (transformProgress.isCompleted()) {
                $('#downloadbar-btn').removeClass('d-none');
                $('#downloadbar-status').removeClass('d-none');
            }
        }));
    }
}

/**
 * Image processing according to the action and method selected.
 *
 * @param {file} image
 * @returns
 */
function processImage(file) {

    if (!isImage(file)) return;

    let url = URL.createObjectURL(file);

    switch ($('#action').val().toUpperCase()) {
        case 'SCRAMBLE': {
            scrambleImage(url, function (result) {
                storeImage(result, file.name);
            });
            break;
        }
        case 'UNSCRAMBLE': {
            unscrambleImage(url, function (result) {
                storeImage(result, file.name);
            });
            break;
        }
    }
}

/**
 * Image processing according to the action and method selected.
 *
 * @param {file} image
 * @returns {Promise}
 */
function processImagePromise(file) {
    return new Promise((resolve, reject) => {

        if (!isImage(file)) reject();

        let url = URL.createObjectURL(file);

        switch ($('#action').val().toUpperCase()) {
            case 'SCRAMBLE': {
                scrambleImage(url, function (result) {
                    storeImage(result, file.name);
                    resolve();
                });
                break;
            }
            case 'UNSCRAMBLE': {
                unscrambleImage(url, function (result) {
                    storeImage(result, file.name);
                    resolve();
                });
                break;
            }
        }
    });
}

/**
 * Store and display processed image on the page.
 *
 * @param {String} url DataURI or objectUrl of the processed image
 * @param {String} fileName
 * @returns {}
 */
function storeImage(url, fileName) {
    filesForDownload.push({ path: url, name: "new_" + fileName });

    let newImg = document.createElement('img');
    newImg.classList.add('img-fluid');
    newImg.src = url;
    if ($('#checkShowResults').attr('checked')) {
        $('#results').append(newImg);
    }
}

/**
 * Scramble the image using stripped method
 *
 * @param {String} url url of an image to be processed
 * @param {callback} callback return the processed image url through callback
 * @returns {}
 */
function scrambleImage(url, callback) {

    let canvas;
    canvas = document.createElement('canvas');
    let img = new Image()
    img.src = url;
    img.onload = function () {
        // Set canvas size
        let ctx = canvas.getContext('2d');
        let w = img.width;
        let h = img.height;
        canvas.width = img.width;
        canvas.height = img.height;
        // Repaint
        let num = 10;
        let remainder = parseInt(h % num);
        let copyW = w;
        for (let i = 0; i < num; i++) {
            var copyH = Math.floor(h / num);
            var py = h - copyH * (i + 1) - remainder;
            var y = copyH * (i) + remainder;
            if (i == 0) {
                copyH = copyH + remainder;
                y = 0;
            }
            ctx.drawImage(img, 0, y, copyW, copyH, 0, py, copyW, copyH);
        }

        let compressedImageUrl = compressCanvas(canvas);
        callback(compressedImageUrl);
    }
}

/**
 * Unscramble the image using stripped method
 *
 * @param {String} url url of an image to be processed
 * @param {callback} callback return the processed image url through callback
 * @returns {}
 */
 function unscrambleImage(url, callback) {

    let canvas;
    canvas = document.createElement('canvas');
    let img = new Image()
    img.src = url;
    img.onload = function () {
        // Set canvas size
        let ctx = canvas.getContext('2d');
        let w = img.width;
        let h = img.height;
        canvas.width = img.width;
        canvas.height = img.height;
        // Repaint
        let num = 10;
        let remainder = parseInt(h % num);
        let copyW = w;
        for (let i = 0; i < num; i++) {
            let copyH = Math.floor(h / num);
            let py = copyH * (i);
            let y = h - (copyH * (i + 1)) - remainder;
            if (i == 0) { copyH = copyH + remainder; }
            else { py = py + remainder; }
            ctx.drawImage(img, 0, y, copyW, copyH, 0, py, copyW, copyH);
        }

        let compressedImageUrl = compressCanvas(canvas);
        callback(compressedImageUrl);
    }
}

/**
 * Compress the image on a canvas to make the size similar to the source image
 *
 * @param {String} canvas canvas on which the image being processed is drawn
 * @returns {String} url
 */
function compressCanvas(canvas) {
    let url = canvas.toDataURL("image/jpeg", quality);
    return url;
}

/**
 * To tell if a file is an image or not
 *
 * @param {file} file
 * @returns {bool}
 */
function isImage(file) {
    let fileType = file.type;
    switch (fileType.toLowerCase()) {
        case 'image/jpeg':
        case 'image/bmp':
        case 'image/png':
            return true;
    }
    console.log(fileType + 'is not image');
    return false;
}
