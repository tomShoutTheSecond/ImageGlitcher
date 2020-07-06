export class Util
{
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
}