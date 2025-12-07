// ==================== ASSET LOADING ====================

// Image assets
export const images = {
    demogorgon: null,
    mindFlayer: null,
    dustin: null
};

// Load all image assets
export function loadAssets() {
    images.demogorgon = loadImage('images/demog.png');
    images.mindFlayer = loadImage('images/mf.png');
    images.dustin = loadImage('images/dustin1.png');
}

function loadImage(src) {
    const img = new Image();
    img.src = src;
    return img;
}

// Check if an image is ready to use
export function isImageReady(img) {
    return img && img.complete && img.naturalWidth > 0;
}
