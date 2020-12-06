import { Colors } from "./Colors";

export class Styles
{
    static get h1Style()
    {
        let style : React.CSSProperties = 
        {
            padding: 0,
            margin: "0 0 16px 0"
        };

        return style;
    }

    static get h2Style()
    { 
        let style : React.CSSProperties = 
        {
            fontSize: "20px",
            padding: 0,
            margin: "0 0 16px 0"
        };

        return style;
    }

    static get imageStyle() 
    { 
        let style : React.CSSProperties = 
        {
            maxWidth: 240,
            maxHeight: 240,
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

    static get bigButtonStyle()
    {
        let style : React.CSSProperties = 
        {
            color: Colors.white,
            background: Colors.fill,
            border: "none",
            fontSize: "16px",
            padding: "16px",
            float: "right"
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
}