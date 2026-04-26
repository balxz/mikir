const fs = require("fs");
const path = require("path");
const Crypto = require("crypto");
const { tmpdir } = require("os");
const ff = require("fluent-ffmpeg");
const webp = require("node-webpmux");

async function imageToWebp(media) {
    let tmpFileOut = path.join(
        tmpdir(),
        `${Crypto.randomBytes(6).toString("hex")}.webp`
    );
    let tmpFileIn = path.join(
        tmpdir(),
        `${Crypto.randomBytes(6).toString("hex")}.jpg`
    );

    fs.writeFileSync(tmpFileIn, media);

    await new Promise((resolve, reject) => {
        ff(tmpFileIn)
            .on("error", reject)
            .on("end", resolve)
            .addOutputOptions([
                "-vcodec",
                "libwebp",
                "-vf",
                "scale=320:320:force_original_aspect_ratio=decrease,fps=15"
            ])
            .toFormat("webp")
            .save(tmpFileOut);
    });

    let buff = fs.readFileSync(tmpFileOut);
    fs.unlinkSync(tmpFileOut);
    fs.unlinkSync(tmpFileIn);
    return buff;
}

async function videoToWebp(media) {
    let tmpFileOut = path.join(
        tmpdir(),
        `${Crypto.randomBytes(6).toString("hex")}.webp`
    );
    let tmpFileIn = path.join(
        tmpdir(),
        `${Crypto.randomBytes(6).toString("hex")}.mp4`
    );

    fs.writeFileSync(tmpFileIn, media);

    await new Promise((resolve, reject) => {
        ff(tmpFileIn)
            .on("error", reject)
            .on("end", resolve)
            .addOutputOptions([
                "-vcodec",
                "libwebp",
                "-vf",
                "scale=320:320:force_original_aspect_ratio=decrease,fps=15",
                "-loop",
                "0",
                "-t",
                "5",
                "-an"
            ])
            .toFormat("webp")
            .save(tmpFileOut);
    });

    let buff = fs.readFileSync(tmpFileOut);
    fs.unlinkSync(tmpFileOut);
    fs.unlinkSync(tmpFileIn);
    return buff;
}

async function writeExifImg(media, metadata) {
    let wMedia = await imageToWebp(media);
    let tmpFileIn = path.join(
        tmpdir(),
        `${Crypto.randomBytes(6).toString("hex")}.webp`
    );
    let tmpFileOut = path.join(
        tmpdir(),
        `${Crypto.randomBytes(6).toString("hex")}.webp`
    );

    fs.writeFileSync(tmpFileIn, wMedia);

    let img = new webp.Image();

    let json = {
        "sticker-pack-id": "",
        "sticker-pack-name": metadata.packname,
        "sticker-pack-publisher": metadata.author,
        emojis: [""]
    };

    let exifAttr = Buffer.from([
        0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57,
        0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00
    ]);

    let jsonBuff = Buffer.from(JSON.stringify(json), "utf-8");
    let exif = Buffer.concat([exifAttr, jsonBuff]);
    exif.writeUIntLE(jsonBuff.length, 14, 4);

    await img.load(tmpFileIn);
    fs.unlinkSync(tmpFileIn);

    img.exif = exif;
    await img.save(tmpFileOut);

    return tmpFileOut;
}

async function writeExifVid(media, metadata) {
    let wMedia = await videoToWebp(media);
    let tmpFileIn = path.join(
        tmpdir(),
        `${Crypto.randomBytes(6).toString("hex")}.webp`
    );
    let tmpFileOut = path.join(
        tmpdir(),
        `${Crypto.randomBytes(6).toString("hex")}.webp`
    );

    fs.writeFileSync(tmpFileIn, wMedia);

    let img = new webp.Image();

    let json = {
        "sticker-pack-id": "",
        "sticker-pack-name": metadata.packname,
        "sticker-pack-publisher": metadata.author,
        emojis: [""]
    };

    let exifAttr = Buffer.from([
        0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57,
        0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00
    ]);

    let jsonBuff = Buffer.from(JSON.stringify(json), "utf-8");
    let exif = Buffer.concat([exifAttr, jsonBuff]);
    exif.writeUIntLE(jsonBuff.length, 14, 4);

    await img.load(tmpFileIn);
    fs.unlinkSync(tmpFileIn);

    img.exif = exif;
    await img.save(tmpFileOut);

    return tmpFileOut;
}

async function writeExif(media, metadata) {
    let tmpFileIn = path.join(
        tmpdir(),
        `${Crypto.randomBytes(6).toString("hex")}.webp`
    );
    let tmpFileOut = path.join(
        tmpdir(),
        `${Crypto.randomBytes(6).toString("hex")}.webp`
    );

    fs.writeFileSync(tmpFileIn, media.data);

    let img = new webp.Image();

    let json = {
        "sticker-pack-id": "",
        "sticker-pack-name": metadata.packname,
        "sticker-pack-publisher": metadata.author,
        emojis: metadata.categories ? metadata.categories : [""]
    };

    let exifAttr = Buffer.from([
        0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57,
        0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00
    ]);

    let jsonBuff = Buffer.from(JSON.stringify(json), "utf-8");
    let exif = Buffer.concat([exifAttr, jsonBuff]);
    exif.writeUIntLE(jsonBuff.length, 14, 4);

    await img.load(tmpFileIn);
    fs.unlinkSync(tmpFileIn);

    img.exif = exif;
    await img.save(tmpFileOut);

    return tmpFileOut;
}

module.exports = {
    imageToWebp,
    videoToWebp,
    writeExifImg,
    writeExifVid,
    writeExif
};