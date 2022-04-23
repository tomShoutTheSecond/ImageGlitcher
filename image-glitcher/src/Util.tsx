import { saveAs } from 'file-saver';
import Jimp from "jimp";
import JSZip from "jszip";

export class Util
{
    static radians(degrees : number) 
    {
        return degrees * Math.PI / 180;
    }

    static copy<AmpModSettings>(object : object)
    {
        return Object.assign({ }, object) as AmpModSettings;
    }

    static mixNumber(val0 : number, val1 : number, mix : number)
    {
        return val0 * (1 - mix) + val1 * mix;
    }

    static getFrameName(index : number | string, name ?: string)
    {
        if(name)
            return name + index + ".bmp";

        return "image" + index + ".bmp";
    }

    static getIcon(name : string)
    {
        return process.env.PUBLIC_URL + '/icons/' + name;
    }

    static getPublicFile(name : string)
    {
        return process.env.PUBLIC_URL + "/" + name;
    }

    static bufferToBlob(buffer : Buffer, contentType : string)
    {
        return new Blob([ buffer ], { type: contentType });
    }

    static async convertImage(imageUrl : string)
    {
        return new Promise<Blob>((resolve, reject) => 
        {
            Jimp.read(imageUrl, (err, image) =>
            {
                if(err) 
                {
                    console.log(err);
                    reject(err);
                    return;
                } 

                image.getBuffer(Jimp.MIME_BMP, (error, data) => 
                {
                    if(error)
                    {
                        reject(error);
                        return;
                    }

                    let convertedImageBlob = Util.bufferToBlob(data, "image/bmp");
                    resolve(convertedImageBlob);
                });
            });
        });
    }

    static arrayMove<T>(array : Array<T>, oldIndex : number, newIndex : number) 
    {
        while (oldIndex < 0) 
            oldIndex += array.length;

        while (newIndex < 0) 
            newIndex += array.length;
        
        while (newIndex >= array.length) 
            newIndex -= array.length;

        //modifies the original array
        array.splice(newIndex, 0, array.splice(oldIndex, 1)[0]);
        return array;
    };

    static async downloadFrameSequence(frameSequence : Uint8Array[] | Blob[])
    {
        let zip = new JSZip();

        console.log('Downloading frame sequence', frameSequence);

        //each zip files contains 10 frames to avoid memory overflow
        let tenFramesCounter = 0;
        for (let i = 0; i < frameSequence.length; i++) 
        {
            const frame = frameSequence[i];
            zip.file(Util.getFrameName(i), frame);

            tenFramesCounter++;
            if(tenFramesCounter > 9)
            {
                tenFramesCounter = 0;

                //split to a new zip file every 10 frames
                let content = await zip.generateAsync({ type:"blob" });

                //see FileSaver.js
                saveAs(content, "FrameSequence.zip");

                zip = new JSZip();
            }
        }

        if(zip.length > 0)
        {
            let content = await zip.generateAsync({ type:"blob" });

            //see FileSaver.js
            saveAs(content, "FrameSequence.zip");
        }
    }
}