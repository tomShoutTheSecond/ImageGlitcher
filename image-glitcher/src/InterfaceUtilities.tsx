export class InterfaceUtilities
{
    static canvasFixDpi(canvas : HTMLCanvasElement, context : CanvasRenderingContext2D, translate ?: boolean) 
    {
        let dpi = window.devicePixelRatio;

        //get CSS height
        //the + prefix casts it to an integer
        //the slice method gets rid of "px"
        let style_height = +getComputedStyle(canvas).getPropertyValue("height").slice(0, -2);

        //get CSS width
        let style_width = +getComputedStyle(canvas).getPropertyValue("width").slice(0, -2);

        //scale the canvas
        canvas.setAttribute('height', String(style_height * dpi));
        canvas.setAttribute('width', String(style_width * dpi));

        //move 0.5 pixels down and right to straddle the pixels
        if(translate !== false)
            context.translate(0.5, 0.5);
    }

    static set cursorStyle(value : CSSStyleDeclaration["cursor"])
    {
        document.body.style.cursor = value;
    }
}