#!/usr/bin/env node

import * as fs from "fs"
import * as imagemin from "imagemin"
import * as _ from "lodash"
import * as os from "os"

const optipng = require('imagemin-optipng')
const jpegtran = require('imagemin-jpegtran')
const gifsicle = require('imagemin-gifsicle')

const [minCoefStr, ...files] = process.argv.slice(2)
const minCoef = parseInt(minCoefStr)
const cpuCount = os.cpus().length
serial(_.chunk(files, cpuCount).map(x => () => minimizeFiles(x)))
    .then(() => console.log("done"), showErrorAndExit)

function serial(funcs: (() => Promise<any>)[]) {
    return funcs.reduce((promise, func) =>
        promise.then(result => func().then(x => result.concat(x))), Promise.resolve([]))
}

function minimizeFiles(files: string[]) {
    return Promise.all(files.map(x => minimizeFile(x))).then(
        files => files.forEach(file => {
            writeFile(file)
        })
    )
}

function showErrorAndExit(error:string){
    console.error(error)
    process.exit(1)
}

function minimizeFile(path: string) {
    return imagemin([path], undefined, {use: [optipng(), jpegtran(), gifsicle()]})
        .then(x => ({...x[0], path}))
}

function writeFile(file: imagemin.File) {
    if(!fs.existsSync(file.path)){
        showErrorAndExit(`file "${file.path} doesn't exist"`)
        return
    }
    const stats = fs.statSync(file.path)
    const minimizeCoef = Math.round(100 - file.data.byteLength * 100 / stats.size)
    if (minimizeCoef > minCoef) {
        fs.writeFileSync(file.path, file.data)
        console.log(`✓ ${file.path} ${minimizeCoef}% ${stats.size} => ${file.data.byteLength}`)
    } else {
        console.log(`✗ ${file.path} ${minimizeCoef}%`)
    }
}







