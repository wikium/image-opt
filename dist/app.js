#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const imagemin = require("imagemin");
const _ = require("lodash");
const os = require("os");
const optipng = require('imagemin-optipng');
const jpegtran = require('imagemin-jpegtran');
const gifsicle = require('imagemin-gifsicle');
const [minCoefStr, ...files] = process.argv.slice(2);
const minCoef = parseInt(minCoefStr);
const cpuCount = os.cpus().length;
serial(_.chunk(files, cpuCount).map(x => () => minimizeFiles(x)))
    .then(() => console.log("done"), showErrorAndExit);
function serial(funcs) {
    return funcs.reduce((promise, func) => promise.then(result => func().then(x => result.concat(x))), Promise.resolve([]));
}
function minimizeFiles(files) {
    return Promise.all(files.map(x => minimizeFile(x))).then(files => files.forEach(file => {
        writeFile(file);
    }));
}
function showErrorAndExit(error) {
    console.error(error);
    process.exit(1);
}
function minimizeFile(path) {
    return imagemin([path], undefined, { use: [optipng(), jpegtran(), gifsicle()] })
        .then(x => (Object.assign({}, x[0], { path })));
}
function writeFile(file) {
    if (!fs.existsSync(file.path)) {
        showErrorAndExit(`file "${file.path} doesn't exist"`);
        return;
    }
    const stats = fs.statSync(file.path);
    const minimizeCoef = Math.round(100 - file.data.byteLength * 100 / stats.size);
    if (minimizeCoef > minCoef) {
        fs.writeFileSync(file.path, file.data);
        console.log(`✓ ${file.path} ${minimizeCoef}% ${stats.size} => ${file.data.byteLength}`);
    }
    else {
        console.log(`✗ ${file.path} ${minimizeCoef}%`);
    }
}
