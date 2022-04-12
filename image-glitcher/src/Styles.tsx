import { Colors } from "./Colors";

export class Styles
{
    static get containerStyle()
    {
        let style : React.CSSProperties = 
        {
            margin: "16px",
            padding: "12px 16px 16px 16px",
            verticalAlign: "top",
            background: Colors.fill,
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: Colors.border,
            display: "inline-block",
            borderRadius: "8px",
            color: Colors.lightGrey
        };

        return style;
    }

    static get h1Style()
    {
        let style : React.CSSProperties = 
        {
            padding: 0,
            margin: "0 0 16px 0",
            fontFamily: this.headingFont,
            color: Colors.white
        };

        return style;
    }

    static get h2Style()
    { 
        let style : React.CSSProperties = 
        {
            fontSize: "20px",
            padding: 0,
            margin: "0 0 16px 0",
            fontFamily: this.headingFont
        };

        return style;
    }

    static get frameHolderSize() 
    {
        return 256;
    }

    static get imageStyle() 
    { 
        let style : React.CSSProperties = 
        {
            maxWidth: this.frameHolderSize,
            maxHeight: this.frameHolderSize,
            display: "block"
        };

        return style;
    }

    static get bigImageStyle() 
    { 
        let style : React.CSSProperties = 
        {
            maxWidth: 480,
            maxHeight: 480,
            display: "block"
        };

        return style;
    }

    static get handCursor()
    {
        let style : React.CSSProperties =
        {
            cursor: "pointer"
        };

        return style;
    }

    static get inlineBlock()
    {
        let style : React.CSSProperties =
        {
            display: "inline-block"
        };

        return style;
    }

    static get alignRight()
    {
        let style : React.CSSProperties =
        {
            textAlign: "right"
        };

        return style;
    }

    static get headingFont()
    {
        return "Montserrat, Verdana, sans-serif"
    };

    static get textFont()
    {
        return "Roboto, sans-serif"
    };
}