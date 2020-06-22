import { Colors } from "./Colors";

export class Styles
{
    static h1Style : React.CSSProperties = 
    {
        padding: 0,
        margin: "0 0 16px 0"
    };

    static h2Style : React.CSSProperties = 
    {
        fontSize: "20px",
        padding: 0,
        margin: "0 0 16px 0"
    };

    static imageStyle : React.CSSProperties = 
    {
        maxWidth: 240,
        maxHeight: 240,
        display: "block"
    };

    static bigImageStyle : React.CSSProperties = 
    {
        maxWidth: 480,
        maxHeight: 480,
        display: "block"
    };

    static bigButtonStyle : React.CSSProperties = 
    {
        color: Colors.white,
        background: Colors.fill,
        border: "none",
        fontSize: "16px",
        padding: "16px",
        float: "right"
    };

    static get handCursor()
    {
        let style : React.CSSProperties =
        {
            cursor: "pointer"
        };

        return style
    }
}