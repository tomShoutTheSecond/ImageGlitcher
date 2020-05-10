export class Util
{
    static mixNumber(val0 : number, val1 : number, mix : number)
    {
        return val0 * mix + val1 * (1 - mix);
    }
}