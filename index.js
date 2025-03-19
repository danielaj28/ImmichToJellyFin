require("dotenv").config();
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const ProgressBar = require("progress");

const IMMICH_URL = process.env.IMMICH_URL;
const JELLYFIN_MEDIA_PATH = process.env.JELLYFIN_MEDIA_PATH;
const IMMICH_EMAIL = process.env.IMMICH_EMAIL;
const IMMICH_PASSWORD = process.env.IMMICH_PASSWORD;

let IMMICH_API_KEY;
let HEADERS = { Authorization: `Bearer ${IMMICH_API_KEY}` };

async function loginToImmich() {
  try {
    const response = await axios.post(`${IMMICH_URL}/api/auth/login`, {
      email: IMMICH_EMAIL,
      password: IMMICH_PASSWORD,
    });

    console.log("✅ Login successful! Token:", response.data.accessToken);
    return response.data.accessToken;
  } catch (error) {
    console.error("❌ Login failed:", error.response?.data || error.message);
    process.exit(1);
  }
}

async function getAlbums() {
  try {
    const response = await axios.get(`${IMMICH_URL}/api/albums`, {
      headers: HEADERS,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching albums:", error.message);
    return [];
  }
}

async function getAlbumAssets(albumId) {
  try {
    const response = await axios.get(`${IMMICH_URL}/api/albums/${albumId}`, {
      headers: { Authorization: `Bearer ${IMMICH_API_KEY}` },
    });
    return response.data.assets || [];
  } catch (error) {
    console.error(
      `❌ Error fetching assets for album ${albumId}:`,
      error.response?.data || error.message
    );
    return [];
  }
}

async function downloadMedia(album) {
  const albumPath = path.join(JELLYFIN_MEDIA_PATH, album.albumName);
  await fs.ensureDir(albumPath);

  for (const media of album.assets) {
    const filePath = path.join(albumPath, media.originalFileName);
    if (fs.existsSync(filePath)) {
      console.log(`Skipping ${media.originalFileName}, already exists.`);
      continue;
    }

    try {
      console.log(
        `Downloading ${media.originalFileName} to ${album.albumName}...`
      );

      let type = `thumbnail?size=preview`;

      if (media.originalFileName.indexOf(".mp4") > 0) {
        type = "original";
      }

      const mediaUrl = `${IMMICH_URL}/api/assets/${media.id}/${type}`;

      const response = await axios({
        url: mediaUrl,
        headers: HEADERS,
        responseType: "stream",
      });

      const totalLength = response.headers["content-length"] || 0;
      const bar = new ProgressBar(`-> [:bar] :percent :etas`, {
        width: 40,
        total: parseInt(totalLength),
        clear: true,
      });

      const writer = fs.createWriteStream(filePath);
      response.data.on("data", (chunk) => bar.tick(chunk.length));
      response.data.pipe(writer);

      await new Promise((resolve) => writer.on("finish", resolve));
    } catch (error) {
      console.error(
        `Failed to download ${media.originalFileName}:`,
        error.message
      );
    }
  }
}

async function syncAlbums() {
  console.log("Logging in..");

  IMMICH_API_KEY = await loginToImmich();
  HEADERS = { Authorization: `Bearer ${IMMICH_API_KEY}` };
  console.log("Fetching albums...");
  const albums = await getAlbums();

  for (const album of albums) {
    console.log(`Getting assests for album: ${album.albumName}`);
    album.assets = await getAlbumAssets(album.id);
    console.log(`Downloading assets for album: ${album.albumName}`);
    await downloadMedia(album);
  }

  console.log("Sync complete!");
}

syncAlbums().catch(console.error);
