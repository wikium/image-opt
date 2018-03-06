declare namespace imagemin {
    export interface File {
        data: Buffer
        path: string
    }
}

declare function imagemin(input: string[], output?: string, plugins?: any): Promise<imagemin.File[]>

export = imagemin
export as namespace imagemin
