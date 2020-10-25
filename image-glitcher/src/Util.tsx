import Jimp from "jimp";

export class Util
{
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

    static convertImage(imageUrl : string, loadConvertedImage : (blob : Blob) => void)
    {
        Jimp.read(imageUrl, (err, image) =>
        {
            if(err) 
            {
                console.log(err);
            } 
            else 
            {
                image.getBuffer(Jimp.MIME_BMP, (error, data) => 
                {
                    let convertedImageBlob = Util.bufferToBlob(data, "image/bmp");
                    loadConvertedImage(convertedImageBlob)
                });
            }
        });
    }
}